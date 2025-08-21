import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { fetchPlanPolicyByTenant } from "@/server/plan-policy"
import { logEvent } from "@/server/events"

// GET /api/students?q=&status=&page=&pageSize=
export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  // Param names per STU01: query, status, trainer_id, page, page_size
  const q = (searchParams.get("query") ?? searchParams.get("q") ?? "").trim()
  const status = (searchParams.get("status") ?? "").trim()
  const trainerIdFilter = (searchParams.get("trainer_id") ?? "").trim()
  const page = Math.max(1, Number(searchParams.get("page") || 1))
  const reqPageSize = Number(searchParams.get("page_size") ?? searchParams.get("pageSize") ?? 20)
  // Clamp page_size between 10 and 50; default 20
  const pageSize = Math.min(50, Math.max(10, Number.isFinite(reqPageSize) ? reqPageSize : 20))

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const filters: string[] = [
    `tenant_id=eq.${ctx.tenantId}`,
    `deleted_at=is.null`,
  ]
  if (status) filters.push(`status=eq.${status}`)
  // Optional explicit trainer filter from query params
  if (trainerIdFilter) filters.push(`trainer_id=eq.${encodeURIComponent(trainerIdFilter)}`)
  // Busca simples por nome/email (ilike). Tabela usa campo "name"
  const search = q ? `&or=(name.ilike.*${encodeURIComponent(q)}*,email.ilike.*${encodeURIComponent(q)}*)` : ""

  // Trainer enxerga apenas seus alunos
  if (ctx.role === "trainer") filters.push(`trainer_id=eq.${ctx.userId}`)

  const base = `${url}/rest/v1/students?${filters.join("&")}${search}`
  const rangeStart = (page - 1) * pageSize
  const rangeEnd = rangeStart + pageSize - 1
  const resp = await fetch(`${base}&order=created_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${rangeStart}-${rangeEnd}`, Prefer: "count=exact" },
    cache: "no-store",
  })
  const items = (await resp.json().catch(() => [])) as Array<{
    id: string
    name: string
    status: string
    trainer_id?: string | null
    created_at: string
  }>
  const contentRange = resp.headers.get("content-range") || `0-0/0`
  const total = Number(contentRange.split("/").pop() || 0)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  // STU01 response shape
  const meta = {
    query: q || "",
    status: status || null,
    trainer_id: trainerIdFilter || null,
  }
  const data = items.map((it) => ({
    id: it.id,
    full_name: it.name,
    status: it.status,
    trainer: it.trainer_id ? { id: it.trainer_id, name: null as string | null } : null,
    created_at: it.created_at,
  }))
  return NextResponse.json({
    meta,
    data,
    pagination: { page, page_size: pageSize, total, total_pages: totalPages },
  })
}

// POST /api/students
export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  // RBAC: admin|manager|seller
  const allowedRoles = new Set(["admin", "manager", "seller"]) as Set<string>
  if (!allowedRoles.has(ctx.role)) {
    await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: "rbac.denied", payload: { action: "students.create" } })
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const name = String(body?.name || "").trim()
  const email = String(body?.email || "").trim()
  const phone = body?.phone ? String(body.phone) : null
  const status = body?.status && ["onboarding", "active", "paused"].includes(body.status) ? body.status : "onboarding"
  const trainerId = body?.trainer_id ? String(body.trainer_id) : null
  if (!name || !email) return NextResponse.json({ error: "invalid_input" }, { status: 400 })

  // Limits
  const policy = await fetchPlanPolicyByTenant(ctx.tenantId)
  const maxStudents = Number(policy?.limits?.students ?? 0)
  if (maxStudents > 0) {
    const url = process.env.SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    const countResp = await fetch(`${url}/rest/v1/students?tenant_id=eq.${ctx.tenantId}&deleted_at=is.null&select=id`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}`!, Prefer: "count=exact" },
      cache: "no-store",
    })
    const contentRange = countResp.headers.get("content-range") || "*/0"
    const current = Number(contentRange.split("/").pop() || 0)
    if (current >= maxStudents) {
      await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: "limit.hit", payload: { limit: "students", value: current, max: maxStudents } })
      return NextResponse.json({ error: "limit_reached", details: { limit: "students", value: current, max: maxStudents } }, { status: 422 })
    }
  }

  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const insert = await fetch(`${url}/rest/v1/students`, {
    method: "POST",
    headers: { apikey: key!, Authorization: `Bearer ${key}`!, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ tenant_id: ctx.tenantId, name, email, phone, status, trainer_id: trainerId }),
  })
  if (!insert.ok) return NextResponse.json({ error: "insert_failed" }, { status: 500 })
  const row = await insert.json()
  await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: "feature.used", payload: { feature: "students.create", id: row?.[0]?.id } })
  return NextResponse.json({ ok: true, id: row?.[0]?.id })
}

