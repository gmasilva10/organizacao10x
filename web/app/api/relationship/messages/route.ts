import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent } from "@/server/events"

function canRead(role: string) { return ['admin','manager','trainer','seller','support'].includes(role) }
function canWrite(role: string) { return ['admin','manager','trainer'].includes(role) }

export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const body = await request.json().catch(()=>({})) as any
  const row = {
    tenant_id: ctx.tenantId,
    student_id: String(body.student_id||''),
    type: String(body.type||'nota'),
    channel: body.channel != null ? String(body.channel) : null,
    body: String(body.body||''),
    attachments: body.attachments ?? null,
    links: body.links ?? null,
  }
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const resp = await fetch(`${url}/rest/v1/relationship_messages`, { method: 'POST', headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(row) })
  if (!resp.ok) return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  const data = await resp.json()
  await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: 'feature.used', payload: { feature: 'relationship.message.logged', id: data?.[0]?.id } })
  return NextResponse.json({ ok: true, id: data?.[0]?.id || null })
}

export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canRead(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('student_id')
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
  return NextResponse.json({ items, page, pageSize, total })
}


