import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent } from "@/server/events"

function canRead(role: string) { return ['admin','manager','trainer','seller','support'].includes(role) }
function canWrite(role: string) { return ['admin','manager','trainer'].includes(role) }

export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canRead(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const resp = await fetch(`${url}/rest/v1/relationship_templates?tenant_id=eq.${ctx.tenantId}&order=created_at.desc`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! } })
  const items = await resp.json().catch(()=>[])
  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  type Body = { title?: unknown; type?: unknown; content?: unknown }
  const body: Body = await request.json().catch(()=>({}))
  const row = { tenant_id: ctx.tenantId, title: String(body.title||''), type: String(body.type||'nota'), content: String(body.content||'') }
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const resp = await fetch(`${url}/rest/v1/relationship_templates`, { method: 'POST', headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(row) })
  if (!resp.ok) return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  const data = await resp.json().catch(()=>[])
  await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: 'feature.used', payload: { feature: 'relationship.template.created', id: data?.[0]?.id } })
  return NextResponse.json({ ok: true, id: data?.[0]?.id || null })
}


