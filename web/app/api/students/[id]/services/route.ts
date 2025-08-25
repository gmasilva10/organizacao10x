import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent } from "@/server/events"

function isAllowedRead(role: string) {
  return role === 'admin' || role === 'manager' || role === 'seller' || role === 'trainer' || role === 'support'
}
function isAllowedWrite(role: string) {
  return role === 'admin' || role === 'manager' || role === 'seller'
}

function validateXorDiscount(payload: Record<string, unknown>) {
  const hasAmount = (payload as Record<string, unknown>).discount_amount_cents != null
  const hasPct = (payload as Record<string, unknown>).discount_pct != null
  if (hasAmount && hasPct) return false
  return true
}

export async function GET(request: Request, ctxParam: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isAllowedRead(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { id } = await ctxParam.params
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const resp = await fetch(`${url}/rest/v1/student_services?tenant_id=eq.${ctx.tenantId}&student_id=eq.${id}&order=created_at.desc`, {
    headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store'
  })
  const items = await resp.json().catch(()=>[])
  return NextResponse.json({ items })
}

export async function POST(request: Request, ctxParam: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isAllowedWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { id } = await ctxParam.params
  const body: Record<string, unknown> = await request.json().catch(()=> ({} as Record<string, unknown>))
  if (!validateXorDiscount(body)) return NextResponse.json({ error: 'invalid_discount' }, { status: 400 })
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const row: Record<string, unknown> = {
    tenant_id: ctx.tenantId,
    student_id: id,
    name: String((body as Record<string, unknown>)['name'] || ''),
    type: String((body as Record<string, unknown>)['type'] || ''),
    status: String((body as Record<string, unknown>)['status'] || 'active'),
    price_cents: Number((body as Record<string, unknown>)['price_cents'] || 0),
    currency: String((body as Record<string, unknown>)['currency'] || 'BRL'),
    discount_amount_cents: (body as Record<string, unknown>)['discount_amount_cents'] != null ? Number((body as Record<string, unknown>)['discount_amount_cents']) : null,
    discount_pct: (body as Record<string, unknown>)['discount_pct'] != null ? Number((body as Record<string, unknown>)['discount_pct']) : null,
    purchase_status: String((body as Record<string, unknown>)['purchase_status'] || 'pending'),
    payment_method: (body as Record<string, unknown>)['payment_method'] != null ? String((body as Record<string, unknown>)['payment_method']) : null,
    installments: (body as Record<string, unknown>)['installments'] != null ? Number((body as Record<string, unknown>)['installments']) : null,
    billing_cycle: (body as Record<string, unknown>)['billing_cycle'] != null ? String((body as Record<string, unknown>)['billing_cycle']) : null,
    start_date: (body as Record<string, unknown>)['start_date'] != null ? String((body as Record<string, unknown>)['start_date']) : null,
    delivery_date: (body as Record<string, unknown>)['delivery_date'] != null ? String((body as Record<string, unknown>)['delivery_date']) : null,
    end_date: (body as Record<string, unknown>)['end_date'] != null ? String((body as Record<string, unknown>)['end_date']) : null,
    last_payment_at: (body as Record<string, unknown>)['last_payment_at'] != null ? String((body as Record<string, unknown>)['last_payment_at']) : null,
    next_payment_at: (body as Record<string, unknown>)['next_payment_at'] != null ? String((body as Record<string, unknown>)['next_payment_at']) : null,
    is_active: Boolean((body as Record<string, unknown>)['is_active']) || false,
    notes: (body as Record<string, unknown>)['notes'] != null ? String((body as Record<string, unknown>)['notes']) : null,
  }
  // Enviar
  const resp = await fetch(`${url}/rest/v1/student_services`, {
    method: 'POST', headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(row)
  })
  if (!resp.ok) return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  const res = await resp.json()
  await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: 'feature.used', payload: { feature: 'students.service.created', student_id: id, service_id: res?.[0]?.id || null } })
  return NextResponse.json({ ok: true, id: res?.[0]?.id || null })
}


