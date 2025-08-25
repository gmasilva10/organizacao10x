import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent } from "@/server/events"

function canWrite(role: string) { return ['admin','manager','trainer'].includes(role) }

export async function PATCH(request: Request, ctxParam: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { id } = await ctxParam.params
  const body = await request.json().catch(()=>({}))
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const resp = await fetch(`${url}/rest/v1/relationship_templates?id=eq.${id}&tenant_id=eq.${ctx.tenantId}`, { method: 'PATCH', headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(body) })
  if (!resp.ok) return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: 'feature.used', payload: { feature: 'relationship.template.updated', id } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, ctxParam: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { id } = await ctxParam.params
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const resp = await fetch(`${url}/rest/v1/relationship_templates?id=eq.${id}&tenant_id=eq.${ctx.tenantId}`, { method: 'DELETE', headers: { apikey: key!, Authorization: `Bearer ${key}`! } })
  if (!resp.ok) return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: 'feature.used', payload: { feature: 'relationship.template.deleted', id } })
  return NextResponse.json({ ok: true })
}


