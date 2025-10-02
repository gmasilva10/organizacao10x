import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent } from "@/server/events"

function canRead(role: string) { return ['admin','manager','trainer','seller','support'].includes(role) }
function canWrite(role: string) { return ['admin','manager','trainer'].includes(role) }

export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  type Body = {
    student_id?: unknown
    type?: unknown
    channel?: unknown
    body?: unknown
    attachments?: unknown
    links?: unknown
  }
  const body: Body = await request.json().catch(()=>({}))
  const row = {
    tenant_id: ctx.tenantId,
    student_id: String((body as Body).student_id||''),
    type: String((body as Body).type||'nota'),
    channel: (body as Body).channel != null ? String((body as Body).channel) : null,
    body: String((body as Body).body||''),
    attachments: (body as Body).attachments ?? null,
    links: (body as Body).links ?? null,
  }
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const resp = await fetch(`${url}/rest/v1/relationship_messages`, { method: 'POST', headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(row) })
  if (!resp.ok) return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  const data = await resp.json()
  await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: 'feature.used', payload: { feature: 'relationship.message.logged', id: data?.[0]?.id } })

  // Best-effort: dual-write em relationship_tasks como 'sent' para refletir no Kanban
  try {
    const taskRow = {
      student_id: String((body as Body).student_id||''),
      template_code: null,
      anchor: 'manual',
      scheduled_for: new Date().toISOString(),
      channel: String((body as Body).channel||'manual'),
      status: 'sent',
      payload: {
        message: String((body as Body).body||''),
      },
      variables_used: {},
      created_by: ctx.userId,
      sent_at: new Date().toISOString(),
      notes: 'Mensagem registrada via /relationship/messages (dual-write tasks)'
    }
    const taskResp = await fetch(`${url}/rest/v1/relationship_tasks`, { method: 'POST', headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(taskRow) })
    const taskData = await taskResp.json().catch(()=>[])
    const taskId = taskData?.[0]?.id
    if (taskId) {
      const logCreated = {
        student_id: String((body as Body).student_id||''),
        task_id: taskId,
        action: 'created',
        channel: String((body as Body).channel||'manual'),
        template_code: null,
        meta: { source: 'messages_api_dual_write' }
      }
      const logSent = {
        student_id: String((body as Body).student_id||''),
        task_id: taskId,
        action: 'sent',
        channel: String((body as Body).channel||'manual'),
        template_code: null,
        meta: { source: 'messages_api_dual_write' }
      }
      await fetch(`${url}/rest/v1/relationship_logs`, { method: 'POST', headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type':'application/json' }, body: JSON.stringify([logCreated, logSent]) })
    }
  } catch {}

  return NextResponse.json({ ok: true, id: data?.[0]?.id || null })
}

export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canRead(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('student_id') ?? searchParams.get('studentId')
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const pageSize = Math.min(50, Math.max(10, Number(searchParams.get('pageSize') || 20)))
  const rangeStart = (page - 1) * pageSize
  const rangeEnd = rangeStart + pageSize - 1
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const base = `${url}/rest/v1/relationship_messages?tenant_id=eq.${ctx.tenantId}${studentId?`&student_id=eq.${studentId}`:''}`
  const resp = await fetch(`${base}&order=created_at.desc`, { headers: { apikey: key!, Authorization: `Bearer ${key}`!, Range: `${rangeStart}-${rangeEnd}`, Prefer: 'count=exact' } })
  const items = await resp.json().catch(()=>[])
  const contentRange = resp.headers.get('content-range') || '0-0/0'
  const total = Number(contentRange.split('/').pop() || 0)
  return NextResponse.json({ items, messages: items, page, pageSize, total })
}




