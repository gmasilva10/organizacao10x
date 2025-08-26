import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent, writeAudit } from "@/server/events"

type MoveBody = { itemId: string; toStageId: string; toIndex: number }

const ALLOWED = new Set(["admin", "manager", "trainer"]) as Set<string>

export async function PATCH(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  if (!ALLOWED.has(ctx.role)) {
    await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: "rbac.denied", payload: { action: "kanban.move" } })
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as Partial<MoveBody>
  const itemId = String(body.itemId || "").trim()
  const toStageId = String(body.toStageId || "").trim()
  const toIndex = Number(body.toIndex)
  if (!itemId || !toStageId || !Number.isFinite(toIndex) || toIndex < 0) return NextResponse.json({ error: "invalid_payload" }, { status: 400 })

  const now = new Date().toISOString()

  // Persistir movimento (fractional indexing) em kanban_items
  let persisted = false
  try {
    const url = process.env.SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    // validar destino
    const stageResp = await fetch(`${url}/rest/v1/kanban_stages?id=eq.${toStageId}&org_id=eq.${ctx.tenantId}&select=id,position&limit=1`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store' })
    const stage = (await stageResp.json().catch(()=>[]))?.[0]
    if (!stage) return NextResponse.json({ error: 'invalid_stage' }, { status: 400 })

    // obter vizinhos no destino para calcular fractional position
    const neighborResp = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&stage_id=eq.${toStageId}&select=id,position&order=position.asc`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store' })
    const neighbors: Array<{ id: string; position: number }> = await neighborResp.json().catch(()=>[])
    const prev = neighbors[toIndex - 1]?.position
    const next = neighbors[toIndex]?.position
    let newPos: number
    if (prev != null && next != null) newPos = (prev + next) / 2
    else if (prev == null && next != null) newPos = Math.max(1, Math.floor(next) - 1) // topo
    else if (prev != null && next == null) newPos = Math.floor(prev) + 1 // fim
    else newPos = 1

    // validar item pertence à org
    const itemResp = await fetch(`${url}/rest/v1/kanban_items?id=eq.${itemId}&org_id=eq.${ctx.tenantId}&select=id,stage_id,student_id&limit=1`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store' })
    const item = (await itemResp.json().catch(()=>[]))?.[0]
    if (!item) return NextResponse.json({ error: 'invalid_item' }, { status: 400 })

    const upd = await fetch(`${url}/rest/v1/kanban_items?id=eq.${itemId}&org_id=eq.${ctx.tenantId}`, {
      method: 'PATCH',
      headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: toStageId, position: newPos })
    })
    persisted = upd.ok
  } catch {}

  if (persisted) {
    await writeAudit({ orgId: ctx.tenantId, actorId: ctx.userId, entityType: 'kanban_item', entityId: itemId, action: 'moved', payload: { toStageId, toIndex } })
    await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: 'feature.used', payload: { type: 'kanban_item.moved', toStageId, toIndex, ts: now } })
  }

  return new NextResponse(null, { status: persisted ? 204 : 500 })
}


