import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

export async function GET(request: Request, ctxParam: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error:'unauthorized' }, { status: 401 })
  const { id } = await ctxParam.params
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const resp = await fetch(`${url}/rest/v1/memberships?tenant_id=eq.${ctx.tenantId}&user_id=eq.${id}&select=role`, { headers:{ apikey:key!, Authorization:`Bearer ${key}`! } })
  const items = await resp.json().catch(()=>[])
  return NextResponse.json({ items })
}

export async function POST(request: Request, ctxParam: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error:'unauthorized' }, { status: 401 })
  const { id } = await ctxParam.params
  type Body = { role?: unknown }
  const body: Body = await request.json().catch(()=>({}))
  const role = String(body.role||'')
  if (!role) return NextResponse.json({ error:'invalid_payload' }, { status: 400 })
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const resp = await fetch(`${url}/rest/v1/memberships`, { method:'POST', headers:{ apikey:key!, Authorization:`Bearer ${key}`!, 'Content-Type':'application/json', Prefer:'resolution=merge-duplicates' }, body: JSON.stringify({ tenant_id: ctx.tenantId, user_id: id, role }) })
  if (!resp.ok) return NextResponse.json({ error:'insert_failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, ctxParam: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error:'unauthorized' }, { status: 401 })
  const { id } = await ctxParam.params
  const { searchParams } = new URL(request.url)
  const role = String(searchParams.get('role')||'')
  if (!role) return NextResponse.json({ error:'invalid_payload' }, { status: 400 })
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const resp = await fetch(`${url}/rest/v1/memberships?tenant_id=eq.${ctx.tenantId}&user_id=eq.${id}&role=eq.${role}`, { method:'DELETE', headers:{ apikey:key!, Authorization:`Bearer ${key}`! } })
  if (!resp.ok) return NextResponse.json({ error:'delete_failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}


