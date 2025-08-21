import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent } from "@/server/events"

const FIXED_TITLES = new Set(["Novo Aluno", "Entrega do Treino"]) as Set<string>

// PATCH /api/kanban/columns/:id  { title?: string }
export async function PATCH(request: Request, ctxParam: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { id } = await ctxParam.params
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const colResp = await fetch(`${url}/rest/v1/onboarding_columns?id=eq.${id}&tenant_id=eq.${ctx.tenantId}&select=title&limit=1`, { headers:{ apikey:key!, Authorization:`Bearer ${key}`! } })
  const current = (await colResp.json().catch(()=>[]))?.[0]
  if (!current) return NextResponse.json({ error:'not_found' }, { status:404 })
  if (FIXED_TITLES.has(String(current.title))) return NextResponse.json({ error:'forbidden_fixed' }, { status:403 })

  const body = await request.json().catch(()=>({})) as { title?: string }
  const title = body?.title ? String(body.title).trim() : undefined
  if (!title) return NextResponse.json({ error:'invalid_title' }, { status:400 })

  const upd = await fetch(`${url}/rest/v1/onboarding_columns?id=eq.${id}&tenant_id=eq.${ctx.tenantId}`, {
    method:'PATCH', headers:{ apikey:key!, Authorization:`Bearer ${key}`!, 'Content-Type':'application/json' }, body: JSON.stringify({ title })
  })
  if (!upd.ok) return NextResponse.json({ error:'update_failed' }, { status:500 })
  const now = new Date().toISOString()
  await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: 'feature.used', payload: { type: 'kanban.column', action: 'rename', details: { columnId: id, columns_version: 1, ts: now }, route: '/(app)/onboarding' } })
  return NextResponse.json({ ok:true })
}

// DELETE /api/kanban/columns/:id
export async function DELETE(request: Request, ctxParam: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { id } = await ctxParam.params
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const colResp = await fetch(`${url}/rest/v1/onboarding_columns?id=eq.${id}&tenant_id=eq.${ctx.tenantId}&select=title&limit=1`, { headers:{ apikey:key!, Authorization:`Bearer ${key}`! } })
  const current = (await colResp.json().catch(()=>[]))?.[0]
  if (!current) return NextResponse.json({ error:'not_found' }, { status:404 })
  if (FIXED_TITLES.has(String(current.title))) return NextResponse.json({ error:'forbidden_fixed' }, { status:403 })

  // Impedir exclusão quando houver cards anexados à coluna (evita cascata)
  const cardsResp = await fetch(`${url}/rest/v1/onboarding_cards?tenant_id=eq.${ctx.tenantId}&column_id=eq.${id}&select=id&limit=1`, {
    headers:{ apikey:key!, Authorization:`Bearer ${key}`! }, cache:'no-store'
  })
  const cards = await cardsResp.json().catch(()=>[])
  if (Array.isArray(cards) && cards.length > 0) {
    return NextResponse.json({ error:'not_empty' }, { status: 422 })
  }

  const del = await fetch(`${url}/rest/v1/onboarding_columns?id=eq.${id}&tenant_id=eq.${ctx.tenantId}`, {
    method:'DELETE', headers:{ apikey:key!, Authorization:`Bearer ${key}`! }
  })
  if (!del.ok) return NextResponse.json({ error:'delete_failed' }, { status:500 })
  const now2 = new Date().toISOString()
  await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: 'feature.used', payload: { type: 'kanban.column', action: 'delete', details: { columnId: id, columns_version: 1, ts: now2 }, route: '/(app)/onboarding' } })
  return NextResponse.json({ ok:true })
}


