import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"

// GET /api/students/summary — retorna contagens por status respeitando RBAC (trainer vê apenas seus alunos)
export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const baseFilters = [`tenant_id=eq.${ctx.tenantId}`, `deleted_at=is.null`]
  const trainerFilter = ctx.role === "trainer" ? `&trainer_id=eq.${ctx.userId}` : ""

  async function countFor(status: string) {
    const resp = await fetch(`${url}/rest/v1/students?${baseFilters.join("&")}&status=eq.${status}${trainerFilter}&select=id`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}`!, Prefer: "count=exact" },
      cache: "no-store",
    })
    const contentRange = resp.headers.get("content-range") || "*/0"
    return Number(contentRange.split("/").pop() || 0)
  }

  async function countAll() {
    const resp = await fetch(`${url}/rest/v1/students?${baseFilters.join("&")}${trainerFilter}&select=id`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}`!, Prefer: "count=exact" },
      cache: "no-store",
    })
    const contentRange = resp.headers.get("content-range") || "*/0"
    return Number(contentRange.split("/").pop() || 0)
  }

  const t0 = Date.now()
  const [onboarding, active, paused, total] = await Promise.all([
    countFor("onboarding"),
    countFor("active"),
    countFor("paused"),
    countAll(),
  ])

  const ms = Date.now() - t0
  const totalRows = onboarding + active + paused
  return NextResponse.json({ counts: { onboarding, active, paused, total } }, { 
    headers: { 
      'X-Query-Time': String(ms), 
      'X-Row-Count': String(totalRows),
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
      'X-Cache-Hit': 'false'
    } 
  })
}


