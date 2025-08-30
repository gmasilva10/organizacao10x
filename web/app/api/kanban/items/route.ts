import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

// GET /api/kanban/items?count_only=true
// - Quando count_only=true, retorna apenas { count }
// - Caso contrário, retorna { items }
export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const countOnly = String(searchParams.get("count_only") || "").toLowerCase() === "true"

  const headers: Record<string, string> = { apikey: key!, Authorization: `Bearer ${key}`! }

  if (countOnly) {
    const resp = await fetch(
      `${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&select=id`,
      { headers: { ...headers, Prefer: "count=exact" }, cache: "no-store" }
    )
    const total = Number(resp.headers.get("content-range")?.split("/")?.[1] || 0)
    return NextResponse.json({ count: total })
  }

  // Seleção resiliente: não depende de coluna meta
  let listResp = await fetch(
    `${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&select=id,student_id,stage_id,position,created_at&order=position.asc`,
    { headers, cache: "no-store" }
  )
  if (!listResp.ok) {
    // Fallback final sem created_at (para esquemas mínimos)
    listResp = await fetch(
      `${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&select=id,student_id,stage_id,position&order=position.asc`,
      { headers, cache: "no-store" }
    )
  }
  const items = await listResp.json().catch(() => [])
  return NextResponse.json({ items })
}


