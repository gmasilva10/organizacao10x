import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const headers = { apikey: key!, Authorization: `Bearer ${key}`! }

  // garantir seeds (idempotente)
  try {
    await fetch(`${url}/rest/v1/rpc/seed_kanban_stages`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ p_org: ctx.org_id }),
      cache: "no-store",
    })
  } catch {}

  const stagesResp = await fetch(`${url}/rest/v1/kanban_stages?org_id=eq.${ctx.org_id}&select=id,name,position&order=position.asc`, { headers, cache: "no-store" })
  const stages = await stagesResp.json().catch(() => [])

  const itemsResp = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.org_id}&select=id,student_id,stage_id,position,meta&order=position.asc`, { headers, cache: "no-store" })
  const items = await itemsResp.json().catch(() => [])

  return NextResponse.json({ stages, items })
}



