import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { writeAudit } from "@/server/events"

const WRITERS = new Set(["admin", "manager"]) as Set<string>

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!WRITERS.has(ctx.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const id = String(params.id || "").trim()
  if (!id) return NextResponse.json({ error: "invalid_id" }, { status: 400 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  }

  const b = (body || {}) as Partial<{ name: string; description: string | null; duration_min: number | null; price_cents: number | null; is_active: boolean | null }>
  const patch: Record<string, unknown> = {}
  if (b.name != null) {
    const name = String(b.name).trim()
    if (name.length < 2 || name.length > 80) return NextResponse.json({ error: "invalid_name" }, { status: 400 })
    patch.name = name
  }
  if (b.description !== undefined) patch.description = b.description ?? null
  if (b.duration_min !== undefined) {
    const d = b.duration_min == null ? null : Number(b.duration_min)
    if (d != null && (!Number.isFinite(d) || d < 0)) return NextResponse.json({ error: "invalid_duration" }, { status: 400 })
    patch.duration_min = d
  }
  if (b.price_cents !== undefined) {
    const p = b.price_cents == null ? null : Number(b.price_cents)
    if (p != null && (!Number.isFinite(p) || p < 0)) return NextResponse.json({ error: "invalid_price" }, { status: 400 })
    patch.price_cents = p ?? 0
  }
  if (b.is_active !== undefined) patch.is_active = !!b.is_active

  // garantir pertencimento à org
  const headers = { apikey: key!, Authorization: `Bearer ${key}`!, "Content-Type": "application/json" }
  const check = await fetch(`${url}/rest/v1/services?id=eq.${id}&org_id=eq.${ctx.org_id}&select=id&limit=1`, { headers, cache: "no-store" })
  const found = (await check.json().catch(() => []))?.[0]
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 })

  const upd = await fetch(`${url}/rest/v1/services?id=eq.${id}&org_id=eq.${ctx.org_id}`, { method: "PATCH", headers, body: JSON.stringify(patch) })
  if (!upd.ok) return NextResponse.json({ error: "unexpected_error" }, { status: 500 })

  ;(async () => {
    try { await writeAudit({ orgId: ctx.org_id, actorId: ctx.userId, entityType: "service", entityId: id, action: "updated", payload: patch }) } catch {}
  })()

  return NextResponse.json({ ok: true })
}


