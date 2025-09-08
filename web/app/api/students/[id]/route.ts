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
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

  // Enviar para Kanban via onboard_opt='enviar'
  const onboardOpt = ((): 'nao_enviar'|'enviar'|'enviado'|undefined => {
    if (!Object.prototype.hasOwnProperty.call(body, 'onboard_opt')) return undefined
    const v = String((body as any).onboard_opt)
    return (['nao_enviar','enviar','enviado'] as const).includes(v as any) ? (v as any) : undefined
  })()
  // Sanitizações leves para novos campos
  if (Object.prototype.hasOwnProperty.call(body, 'customer_stage')) {
    const v = String((body as Record<string, unknown>)['customer_stage'] as string)
    if (!['new','renewal','canceled'].includes(v)) delete (body as Record<string, unknown>)['customer_stage']
  }
  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    const v = String((body as Record<string, unknown>)['status'] as string)
    if (!['onboarding','active','paused'].includes(v)) delete (body as Record<string, unknown>)['status']
  }
  if (Object.prototype.hasOwnProperty.call(body, 'address')) {
    const raw = (body as Record<string, unknown>).address as Record<string, unknown>
    const rawZip = String(raw?.zip || "").replace(/\D/g, "")
    if (rawZip && rawZip.length !== 8) {
      return NextResponse.json({ code: 'validation', message: 'CEP deve ter 8 dígitos.' }, { status: 422 })
    }
    const rawState = String(raw?.state || "")
    if (rawState && rawState.trim().length !== 2) {
      return NextResponse.json({ code: 'validation', message: 'UF deve ter 2 letras.' }, { status: 422 })
    }
    ;(body as Record<string, unknown>)['address'] = sanitizeAddress(raw)
  }

  if (onboardOpt === 'enviar') {
    // cria card na primeira coluna se não existir, e marca enviado
    const headers = { apikey: key!, Authorization: `Bearer ${key}`!, "Content-Type": "application/json" }
    // idempotência
    const check = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&student_id=eq.${id}&select=id&limit=1`, { headers, cache: 'no-store' })
    const exists = (await check.json().catch(()=>[]))?.[0]
    if (!exists) {
      // Seleciona a coluna fixa de posição 1
      let stageResp = await fetch(`${url}/rest/v1/kanban_stages?org_id=eq.${ctx.tenantId}&position=eq.1&select=id,position&limit=1`, { headers, cache: 'no-store' })
      let stage = (await stageResp.json().catch(()=>[]))?.[0]
      if (!stage?.id) {
        stageResp = await fetch(`${url}/rest/v1/kanban_stages?org_id=eq.${ctx.tenantId}&select=id,position&order=position.asc&limit=1`, { headers, cache: 'no-store' })
        stage = (await stageResp.json().catch(()=>[]))?.[0]
      }
      if (!stage?.id) return NextResponse.json({ error: 'no_stage' }, { status: 500 })
      const posResp = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&stage_id=eq.${stage.id}&select=position&order=position.desc&limit=1`, { headers, cache: 'no-store' })
      const top = (await posResp.json().catch(()=>[]))?.[0]
      const nextPos = Number.isFinite(Number(top?.position)) ? Number(top.position) + 1 : 0
      const ins = await fetch(`${url}/rest/v1/kanban_items`, { method:'POST', headers, body: JSON.stringify({ org_id: ctx.tenantId, student_id: id, stage_id: stage.id, position: nextPos, meta: { pending_services: 0 } }) })
      if (!ins.ok) return NextResponse.json({ error: 'card_failed' }, { status: 500 })
    }
    await fetch(`${url}/rest/v1/students?id=eq.${id}&tenant_id=eq.${ctx.tenantId}`, { method:'PATCH', headers, body: JSON.stringify({ onboard_opt: 'enviado' }) })
    try { await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: 'aluno_to_kanban.created', payload: { studentId: id, source:'api' } }) } catch {}
    return NextResponse.json({ ok: true })
  }

  if (allowedFull.has(ctx.role)) {
    // update livre (soft delete via deleted_at também passaria por aqui com value null/now)
    // Se trainer_id vier como user_id, converter para user_id (string) nesta tabela (alinhado ao restante do app)
    if (Object.prototype.hasOwnProperty.call(body, 'trainer_id')) {
      const value = (body as any).trainer_id
      if (typeof value === 'string' && value.length > 0 && value.length < 36) {
        // Parece ser um id numérico/string curto do professional; buscar user_id
        try {
          const headers = { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type': 'application/json' }
          const resp = await fetch(`${url}/rest/v1/professionals?tenant_id=eq.${ctx.tenantId}&id=eq.${encodeURIComponent(value)}&select=user_id&limit=1`, { headers })
          const row = (await resp.json().catch(()=>[]))?.[0]
          if (row?.user_id) (body as any).trainer_id = row.user_id
        } catch {}
      }
    }
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

// DELETE /api/students/:id — hard delete (CASCADE via FKs)
export async function DELETE(_request: Request, ctxParam: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(_request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!new Set(["admin","manager"]).has(ctx.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const { id } = await ctxParam.params
  if (!id) return NextResponse.json({ error: "invalid_id" }, { status: 400 })
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  // Hard delete com CASCADE: se não existir, 204
  const del = await fetch(`${url}/rest/v1/students?id=eq.${id}&tenant_id=eq.${ctx.tenantId}`, {
    method: "DELETE",
    headers: { apikey: key!, Authorization: `Bearer ${key}`!, "Content-Type": "application/json", Prefer: "return=minimal" },
  })
  if (del.status === 204 || del.status === 200) {
    try { await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: "student.deleted", payload: { studentId: id } }) } catch {}
    return new NextResponse(null, { status: 204 })
  }
  return NextResponse.json({ error: "delete_failed" }, { status: 500 })
}


