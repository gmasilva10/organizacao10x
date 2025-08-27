import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { writeAudit } from "@/server/events"

function canWrite(role: string) { return role === 'admin' || role === 'manager' }

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const targetUserId = String(params.id || '')
  let body: any = {}
  try { body = await request.json() } catch {}
  const roleCode = String(body?.role || '').trim()
  if (!targetUserId || !roleCode) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })

  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  // role deve existir
  const roleResp = await fetch(`${url}/rest/v1/roles?code=eq.${encodeURIComponent(roleCode)}&select=id,code&limit=1`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store' })
  const role = (await roleResp.json().catch(()=>[]))?.[0]
  if (!role) return NextResponse.json({ error: 'role_not_found' }, { status: 404 })

  // atribuição (idempotente)
  const ins = await fetch(`${url}/rest/v1/user_roles`, {
    method: 'POST', headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ user_id: targetUserId, role_id: role.id })
  })
  if (!ins.ok) return NextResponse.json({ error: 'assign_failed' }, { status: 500 })

  ;(async () => { try { await writeAudit({ orgId: ctx.tenantId, actorId: ctx.userId, entityType: 'settings.users', entityId: targetUserId, action: 'role_assigned', payload: { role: roleCode } }) } catch {} })()

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const targetUserId = String(params.id || '')
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

  // precisa de role no body ou query
  const roleCode = new URL(request.url).searchParams.get('role') || ''
  if (!roleCode) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  const roleResp = await fetch(`${url}/rest/v1/roles?code=eq.${encodeURIComponent(roleCode)}&select=id,code&limit=1`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store' })
  const role = (await roleResp.json().catch(()=>[]))?.[0]
  if (!role) return NextResponse.json({ error: 'role_not_found' }, { status: 404 })

  const del = await fetch(`${url}/rest/v1/user_roles?user_id=eq.${targetUserId}&role_id=eq.${role.id}`, { method: 'DELETE', headers: { apikey: key!, Authorization: `Bearer ${key}`! } })
  if (!del.ok) return NextResponse.json({ error: 'remove_failed' }, { status: 500 })

  ;(async () => { try { await writeAudit({ orgId: ctx.tenantId, actorId: ctx.userId, entityType: 'settings.users', entityId: targetUserId, action: 'role_removed', payload: { role: roleCode } }) } catch {} })()

  return new NextResponse(null, { status: 204 })
}

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
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const resp = await fetch(`${url}/rest/v1/memberships?tenant_id=eq.${ctx.tenantId}&user_id=eq.${id}&role=eq.${role}`, { method:'DELETE', headers:{ apikey:key!, Authorization:`Bearer ${key}`! } })
  if (!resp.ok) return NextResponse.json({ error:'delete_failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}


