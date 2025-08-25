import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent } from "@/server/events"

function isAllowedWrite(role: string) {
  return role === 'admin' || role === 'manager' || role === 'seller'
}

function validateXorDiscount(payload: Record<string, unknown>) {
  const hasAmount = (payload as Record<string, unknown>).discount_amount_cents != null
  const hasPct = (payload as Record<string, unknown>).discount_pct != null
  if (hasAmount && hasPct) return false
  return true
}

export async function PATCH(request: Request, ctxParam: { params: Promise<{ id: string; serviceId: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isAllowedWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { id, serviceId } = await ctxParam.params
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const body: Record<string, unknown> = await request.json().catch(()=> ({} as Record<string, unknown>))
  if (!validateXorDiscount(body)) return NextResponse.json({ error: 'invalid_discount' }, { status: 400 })
  // Garantir escopo do tenant e aluno
  const resp = await fetch(`${url}/rest/v1/student_services?id=eq.${serviceId}&tenant_id=eq.${ctx.tenantId}&student_id=eq.${id}`, {
    method: 'PATCH', headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body)
  })
  if (!resp.ok) return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: 'feature.used', payload: { feature: 'students.service.updated', student_id: id, service_id: serviceId } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, ctxParam: { params: Promise<{ id: string; serviceId: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isAllowedWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { id, serviceId } = await ctxParam.params
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const resp = await fetch(`${url}/rest/v1/student_services?id=eq.${serviceId}&tenant_id=eq.${ctx.tenantId}&student_id=eq.${id}`, {
    method: 'DELETE', headers: { apikey: key!, Authorization: `Bearer ${key}`! },
  })
  if (!resp.ok) return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}


