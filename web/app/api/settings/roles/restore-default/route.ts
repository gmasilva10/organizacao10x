import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

function canRestore(role: string) {
  return role === 'admin'
}

type Role = { id: string; code: string; name: string }
type Permission = { id: string; domain: string; action: string }

function isReadAction(action: string) {
  return action === 'read' || action === 'list' || action === 'get'
}

function defaultAllowed(roleCode: string, perm: Permission): boolean {
  const domain = perm.domain
  const action = perm.action
  // Admin tem tudo
  if (roleCode === 'admin') return true

  // Manager: tudo em students e relationship; CRUD em services
  if (roleCode === 'manager') {
    if (domain === 'students' || domain === 'relationship') return true
    if (domain === 'services') return true
    return isReadAction(action)
  }

  // Seller: read students; CRUD services; read relationship
  if (roleCode === 'seller') {
    if (domain === 'services') return true
    if (domain === 'relationship') return isReadAction(action)
    if (domain === 'students') return isReadAction(action)
    return isReadAction(action)
  }

  // Support: read-only em tudo
  if (roleCode === 'support') {
    return isReadAction(action)
  }

  // Trainer: students read; relationship CRUD; services read
  if (roleCode === 'trainer') {
    if (domain === 'relationship') return true
    if (domain === 'services') return isReadAction(action)
    if (domain === 'students') return isReadAction(action)
    return isReadAction(action)
  }

  // Qualquer outro papel: read-only
  return isReadAction(action)
}

export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canRestore(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

  // Snapshot BEFORE
  const [rolesResp, permsResp, beforeResp] = await Promise.all([
    fetch(`${url}/rest/v1/roles?select=id,code,name`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! } }),
    fetch(`${url}/rest/v1/permissions?select=id,domain,action`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! } }),
    fetch(`${url}/rest/v1/role_permissions?select=role_id,permission_id,allowed`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! } }),
  ])
  const roles: Role[] = await rolesResp.json().catch(()=>[])
  const perms: Permission[] = await permsResp.json().catch(()=>[])
  const before = await beforeResp.json().catch(()=>[] as Array<{ role_id: string; permission_id: string; allowed: boolean }>)

  // Construir matriz padrão completa (cartesiano roles x perms)
  const rows = [] as Array<{ role_id: string; permission_id: string; allowed: boolean }>
  for (const r of roles) {
    for (const p of perms) {
      rows.push({ role_id: r.id, permission_id: p.id, allowed: defaultAllowed(r.code, p) })
    }
  }

  // Upsert em lote definindo o estado completo (inclusive allowed=false)
  const upsert = await fetch(`${url}/rest/v1/role_permissions`, {
    method: 'POST',
    headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(rows),
  })
  if (!upsert.ok) {
    const txt = await upsert.text().catch(()=> 'unknown')
    return NextResponse.json({ error: 'restore_failed', details: txt }, { status: 500 })
  }

  // Audit
  await fetch(`${url}/rest/v1/settings_audit`, {
    method: 'POST',
    headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ org_id: ctx.tenantId, actor_user_id: ctx.userId, area: 'roles', action: 'restore_default', before, after: rows })
  })

  return NextResponse.json({ ok: true, updated: rows.length })
}



