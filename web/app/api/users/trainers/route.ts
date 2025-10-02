import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { can } from "@/server/rbac"
import { logEvent } from "@/server/events"

type CreateTrainerBody = {
  email: string
}

async function countTenantTrainers(tenantId: string): Promise<number> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return 0
  const resp = await fetch(
    `${url}/rest/v1/memberships?org_id=eq.${tenantId}&role=eq.trainer&select=user_id`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" },
      cache: "no-store",
    }
  )
  // Supabase envia count no header content-range: */<count>
  const contentRange = resp.headers.get("content-range") || "*/0"
  const count = Number(contentRange.split("/").pop() || 0)
  return Number.isFinite(count) ? count : 0
}

async function getUserIdByEmail(email: string): Promise<string | null> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) return null
  const { createClient } = await import('@supabase/supabase-js')
  const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 2000 })
  if (error) return null
  const u = list.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase())
  return (u?.id as string) || null
}

async function insertMembership(userId: string, tenantId: string): Promise<boolean> {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return false
  const resp = await fetch(`${url}/rest/v1/memberships`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({ user_id: userId, org_id: tenantId, role: "trainer" }),
  })
  return resp.ok
}

export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  // RBAC: precisa gerenciar usuários e criar trainer
  const allowed = can(ctx.role, "manage_users") && can(ctx.role, "create_trainer")
  if (!allowed) {
    await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: "rbac.denied", payload: { action: "users.create_trainer" } })
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as Partial<CreateTrainerBody>
  const email = (body.email || "").trim()
  if (!email) return NextResponse.json({ error: "email_required" }, { status: 400 })

  // Limite por plano
  // Obter a policy para saber o limite
  const policyResp = await fetch(`${process.env.SUPABASE_URL}/rest/v1/plan_policies?org_id=eq.${ctx.tenantId}&select=limits`, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "",
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY}`,
    },
    cache: "no-store",
  })
  let maxTrainers = 0
  if (policyResp.ok) {
    const rows = (await policyResp.json()) as Array<{ limits: { trainers?: number } }>
    maxTrainers = Number(rows?.[0]?.limits?.trainers ?? 0)
  }

  const current = await countTenantTrainers(ctx.tenantId)
  if (current >= maxTrainers) {
    await logEvent({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      eventType: "limit.hit",
      payload: { limit: "trainers", value: current, max: maxTrainers },
    })
    return NextResponse.json({ error: "limit_reached", details: { limit: "trainers", value: current, max: maxTrainers } }, { status: 422 })
  }

  // Encontrar user_id por email e inserir membership
  const userId = await getUserIdByEmail(email)
  if (!userId) return NextResponse.json({ error: "user_not_found" }, { status: 404 })

  const ok = await insertMembership(userId, ctx.tenantId)
  if (!ok) return NextResponse.json({ error: "insert_failed" }, { status: 500 })

  await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: "feature.used", payload: { feature: "users.create_trainer", email } })
  return NextResponse.json({ ok: true })
}

// GET /api/users/trainers — lista trainers do tenant com { user_id, email }
export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  // 1) pegar user_ids de trainers no tenant
  const idsResp = await fetch(`${url}/rest/v1/memberships?org_id=eq.${ctx.tenantId}&role=eq.trainer&select=user_id`, {
    headers: { apikey: service, Authorization: `Bearer ${service}` },
    cache: "no-store",
  })
  const rows = (await idsResp.json().catch(() => [])) as Array<{ user_id: string }>
  const userIds = rows.map(r => r.user_id)
  if (userIds.length === 0) return NextResponse.json({ items: [] })

  // 2) mapear emails via Admin API
  const { createClient } = await import('@supabase/supabase-js')
  const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 2000 })
  const items = list.users
    .filter(u => userIds.includes(u.id as string))
    .map(u => ({ user_id: u.id as string, email: u.email as string }))
  return NextResponse.json({ items })
}



