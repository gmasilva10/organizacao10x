import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

function isAllowedRead(role: string) {
  return role === 'admin' || role === 'manager' || role === 'seller' || role === 'trainer' || role === 'support'
}
function isAllowedWrite(role: string) {
  return role === 'admin' || role === 'manager' || role === 'seller'
}

function validateXorDiscount(payload: any) {
  const hasAmount = payload.discount_amount_cents != null
  const hasPct = payload.discount_pct != null
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
  const body = await request.json().catch(()=> ({} as any))
  if (!validateXorDiscount(body)) return NextResponse.json({ error: 'invalid_discount' }, { status: 400 })
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const row = {
    tenant_id: ctx.tenantId,
    student_id: id,
    name: String(body.name || ''),
    type: String(body.type || ''),
    status: String(body.status || 'active'),
    price_cents: Number(body.price_cents || 0),
    currency: String(body.currency || 'BRL'),
    discount_amount_cents: body.discount_amount_cents != null ? Number(body.discount_amount_cents) : null,
    discount_pct: body.discount_pct != null ? Number(body.discount_pct) : null,
    purchase_status: String(body.purchase_status || 'pending'),
    payment_method: body.payment_method != null ? String(body.payment_method) : null,
    installments: body.installments != null ? Number(body.installments) : null,
    billing_cycle: body.billing_cycle != null ? String(body.billing_cycle) : null,
    start_date: body.start_date != null ? String(body.start_date) : null,
    delivery_date: body.delivery_date != null ? String(body.delivery_date) : null,
    end_date: body.end_date != null ? String(body.end_date) : null,
    last_payment_at: body.last_payment_at != null ? String(body.last_payment_at) : null,
    next_payment_at: body.next_payment_at != null ? String(body.next_payment_at) : null,
    is_active: Boolean(body.is_active) || false,
    notes: body.notes != null ? String(body.notes) : null,
  }
  // Enviar
  const resp = await fetch(`${url}/rest/v1/student_services`, {
    method: 'POST', headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(row)
  })
  if (!resp.ok) return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  const res = await resp.json()
  return NextResponse.json({ ok: true, id: res?.[0]?.id || null })
}


