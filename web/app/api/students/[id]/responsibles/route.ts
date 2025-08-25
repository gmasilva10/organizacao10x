import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

function canRead(role: string) { return ['admin','manager','trainer','seller','support'].includes(role) }
function canWrite(role: string) { return ['admin','manager'].includes(role) }

export async function GET(request: Request, ctxParam: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canRead(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { id } = await ctxParam.params
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const resp = await fetch(`${url}/rest/v1/student_responsibles?tenant_id=eq.${ctx.tenantId}&student_id=eq.${id}&order=created_at.asc`, {
    headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store'
  })
  const items = await resp.json().catch(()=>[])
  return NextResponse.json({ items })
}

export async function POST(request: Request, ctxParam: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { id } = await ctxParam.params
  const body: Record<string, unknown> = await request.json().catch(()=> ({}))
  const role = String(body['role']||'') as 'owner'|'trainer_primary'|'trainer_support'
  const userId = String(body['user_id']||'')
  if (!role || !userId) return NextResponse.json({ error:'invalid_payload' }, { status: 400 })

  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

  // Limites por plano
  const caps = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/capabilities`, { headers: { cookie: request.headers.get('cookie') || '' } }).then(r=>r.json()).catch(()=>null)
  const planCode = String(caps?.plan?.code || 'basic')
  if (role === 'trainer_support' && planCode === 'basic') {
    // contar supports existentes
    const c = await fetch(`${url}/rest/v1/student_responsibles?tenant_id=eq.${ctx.tenantId}&student_id=eq.${id}&role=eq.trainer_support&select=id`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}`!, Prefer: 'count=exact' }, cache: 'no-store'
    })
    const contentRange = c.headers.get('content-range') || '*/0'
    const supports = Number(contentRange.split('/').pop() || 0)
    if (supports >= 1) return NextResponse.json({ error:'limit_reached', details:{ limit:'trainer_support_basic', value: supports, max: 1 } }, { status: 422 })
  }

  const ins = await fetch(`${url}/rest/v1/student_responsibles`, {
    method:'POST', headers:{ apikey:key!, Authorization:`Bearer ${key}`!, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ tenant_id: ctx.tenantId, student_id: id, user_id: userId, role })
  })
  if (!ins.ok) {
    const text = await ins.text().catch(()=> '')
    // unicidade parcial violada
    if (/duplicate/i.test(text)) return NextResponse.json({ error:'unique_violation', message:'Regra de unicidade (owner/primary) violada.' }, { status: 422 })
    return NextResponse.json({ error:'insert_failed' }, { status: 500 })
  }
  const rows = await ins.json().catch(()=>[])
  return NextResponse.json({ ok: true, id: rows?.[0]?.id || null })
}


