import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent } from "@/server/events"
import { sanitizeAddress } from "../_utils"

// PATCH /api/students/:id — editar básicos + trainer_id (RBAC: admin|manager full; trainer restrito)
export async function PATCH(_request: Request, ctxParam: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(_request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { id } = await ctxParam.params
  if (!id) return NextResponse.json({ error: "invalid_id" }, { status: 400 })

  const allowedFull = new Set(["admin", "manager"]) as Set<string>
  const body = await _request.json().catch(() => ({} as Record<string, unknown>))
  // Sanitizações leves para novos campos
  if (Object.prototype.hasOwnProperty.call(body, 'customer_stage')) {
    const v = String((body as any).customer_stage)
    if (!['new','renewal','canceled'].includes(v)) delete (body as any).customer_stage
  }
  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    const v = String((body as any).status)
    if (!['onboarding','active','paused'].includes(v)) delete (body as any).status
  }
  if (Object.prototype.hasOwnProperty.call(body, 'address')) {
    const raw = (body as any).address
    const rawZip = String(raw?.zip || "").replace(/\D/g, "")
    if (rawZip && rawZip.length !== 8) {
      return NextResponse.json({ code: 'validation', message: 'CEP deve ter 8 dígitos.' }, { status: 422 })
    }
    const rawState = String(raw?.state || "")
    if (rawState && rawState.trim().length !== 2) {
      return NextResponse.json({ code: 'validation', message: 'UF deve ter 2 letras.' }, { status: 422 })
    }
    (body as any).address = sanitizeAddress(raw)
  }

  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

  if (allowedFull.has(ctx.role)) {
    // update livre (soft delete via deleted_at também passaria por aqui com value null/now)
    const patch = await fetch(`${url}/rest/v1/students?id=eq.${id}&tenant_id=eq.${ctx.tenantId}&deleted_at=is.null`, {
      method: "PATCH",
      headers: { apikey: key!, Authorization: `Bearer ${key}`!, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(body),
    })
    if (!patch.ok) return NextResponse.json({ error: "update_failed" }, { status: 500 })
    const isAssign = Object.prototype.hasOwnProperty.call(body, "trainer_id")
    await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: "feature.used", payload: { feature: isAssign ? "students.assign_trainer" : "students.update", id } })
    return NextResponse.json({ ok: true })
  }

  if (ctx.role === "trainer") {
    // restrito: somente status onboarding→active do próprio
    const status = body?.status
    if (status !== "active" && status !== "onboarding") {
      await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: "rbac.denied", payload: { action: "students.update_status" } })
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }
    // garantir que é do próprio trainer
    const check = await fetch(`${url}/rest/v1/students?id=eq.${id}&tenant_id=eq.${ctx.tenantId}&trainer_id=eq.${ctx.userId}&deleted_at=is.null&select=id`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}`!, Prefer: "count=exact" },
    })
    const countRange = check.headers.get("content-range") || "*/0"
    const own = Number(countRange.split("/").pop() || 0) > 0
    if (!own) {
      await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: "rbac.denied", payload: { action: "students.update_status.not_owner" } })
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }
    const patch = await fetch(`${url}/rest/v1/students?id=eq.${id}&tenant_id=eq.${ctx.tenantId}&deleted_at=is.null`, {
      method: "PATCH",
      headers: { apikey: key!, Authorization: `Bearer ${key}`!, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ status }),
    })
    if (!patch.ok) return NextResponse.json({ error: "update_failed" }, { status: 500 })
    await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: "feature.used", payload: { feature: "students.update", id, status } })
    return NextResponse.json({ ok: true })
  }

  await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: "rbac.denied", payload: { action: "students.update" } })
  return NextResponse.json({ error: "forbidden" }, { status: 403 })
}

// DELETE /api/students/:id — soft delete
export async function DELETE(_request: Request, ctxParam: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(_request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!new Set(["admin","manager"]).has(ctx.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const { id } = await ctxParam.params
  if (!id) return NextResponse.json({ error: "invalid_id" }, { status: 400 })
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const del = await fetch(`${url}/rest/v1/students?id=eq.${id}&tenant_id=eq.${ctx.tenantId}&deleted_at=is.null`, {
    method: "PATCH",
    headers: { apikey: key!, Authorization: `Bearer ${key}`!, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ deleted_at: new Date().toISOString() }),
  })
  if (!del.ok) return NextResponse.json({ error: "delete_failed" }, { status: 500 })
  await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: "feature.used", payload: { feature: "students.delete", id } })
  return NextResponse.json({ ok: true })
}


