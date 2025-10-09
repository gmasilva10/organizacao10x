import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent } from "@/server/events"

// POST /api/kanban/stages/reorder  [{ id, order }]
export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_payload' }, { status: 400 }) }
  const updates = Array.isArray(body) ? body as Array<{ id: string, order: number }> : []
  if (updates.length === 0) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })

  // Normaliza range 2..98. Ignora fixas (1 e 99)
  const norm = updates.map(u => ({ id: String(u.id), position: Math.max(2, Math.min(98, Number(u.order))) }))

  // Aplica sequencialmente (última gravação vence)
  for (const u of norm) {
    const resp = await fetch(`${url}/rest/v1/kanban_stages?id=eq.${u.id}&org_id=eq.${ctx.org_id}&is_fixed=eq.false`, {
      method: 'PATCH',
      headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ position: u.position })
    })
    if (!resp.ok) return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
  try { await logEvent({ tenantId: ctx.org_id, userId: ctx.userId, eventType: 'kanban.stage.reordered', payload: { updates: norm.length } }) } catch {}
  return new NextResponse(null, { status: 204 })
}



