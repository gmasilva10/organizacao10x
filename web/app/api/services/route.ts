import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

const WRITERS = new Set(["admin", "manager"]) as Set<string>

export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get("page") || 1))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)))
  const isActiveParam = searchParams.get("is_active")
  const activeFilter = isActiveParam == null ? "" : `&is_active=eq.${isActiveParam === "true" ? "true" : "false"}`
  const rangeFrom = (page - 1) * pageSize
  const rangeTo = rangeFrom + pageSize - 1

  const headers: Record<string, string> = { apikey: key!, Authorization: `Bearer ${key}`! }

  const listResp = await fetch(
    `${url}/rest/v1/services?org_id=eq.${ctx.tenantId}${activeFilter}&order=created_at.desc&select=id,org_id,name,description,duration_min,price_cents,plan_visibility,is_active,created_at,updated_at&range=${rangeFrom}-${rangeTo}`,
    { headers, cache: "no-store" }
  )
  const items = await listResp.json().catch(() => [])

  // total via head count
  const countResp = await fetch(
    `${url}/rest/v1/services?org_id=eq.${ctx.tenantId}${activeFilter}&select=id`,
    { headers: { ...headers, Prefer: "count=exact" }, cache: "no-store" }
  )
  const total = Number(countResp.headers.get("content-range")?.split("/")?.[1] || 0)

  return NextResponse.json({ items, page, pageSize, total })
}

export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!WRITERS.has(ctx.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  }
  const b = (body || {}) as Partial<{
    name: string
    description: string | null
    duration_min: number | null
    price_cents: number | null
    plan_visibility: "basic" | "enterprise" | "all"
    is_active: boolean | null
  }>

  const name = String((b.name ?? "").toString()).trim()
  if (name.length < 2 || name.length > 80) return NextResponse.json({ error: "invalid_name" }, { status: 400 })
  const price = Number(b.price_cents ?? 0)
  if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: "invalid_price" }, { status: 400 })
  const duration = b.duration_min == null ? null : Number(b.duration_min)
  if (duration != null && (!Number.isFinite(duration) || duration < 0)) return NextResponse.json({ error: "invalid_duration" }, { status: 400 })
  const vis = (b.plan_visibility ?? "all") as string
  if (!new Set(["basic", "enterprise", "all"]).has(vis)) return NextResponse.json({ error: "invalid_visibility" }, { status: 400 })

  const headers: Record<string, string> = { apikey: key!, Authorization: `Bearer ${key}`!, "Content-Type": "application/json", Prefer: "return=representation" }
  const payload = [{
    org_id: ctx.tenantId,
    name,
    description: b.description ?? null,
    duration_min: duration,
    price_cents: price,
    plan_visibility: vis,
    is_active: b.is_active ?? true,
  }]
  const ins = await fetch(`${url}/rest/v1/services`, { method: "POST", headers, body: JSON.stringify(payload) })
  const json = await ins.json().catch(() => null)
  if (!ins.ok) return NextResponse.json({ error: "unexpected_error" }, { status: 500 })

  // Telemetria/Audit best-effort
  ;(async () => {
    try {
      await fetch(`${url}/rest/v1/events`, {
        method: "POST",
        headers: { apikey: key!, Authorization: `Bearer ${key}`!, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ tenant_id: ctx.tenantId, user_id: ctx.userId, event_type: "service.created", payload: { name }, route: "/(app)/services", ts: new Date().toISOString() })
      })
      await fetch(`${url}/rest/v1/audit_log`, {
        method: "POST",
        headers: { apikey: key!, Authorization: `Bearer ${key}`!, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ org_id: ctx.tenantId, actor_id: ctx.userId, entity_type: "service", entity_id: json?.[0]?.id || "", action: "service.created", payload: { name, price_cents: price }, created_at: new Date().toISOString() })
      })
    } catch {}
  })()

  return NextResponse.json({ ok: true, id: json?.[0]?.id || null })
}



