import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { fetchPlanPolicyByTenant } from "@/server/plan-policy"
import { logEvent } from "@/server/events"
import { sanitizeAddress } from "./_utils"

// GET /api/students?q=&status=&page=&pageSize=
export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  // Param names per STU01: query, status, trainer_id, page, page_size
  const q = (searchParams.get("query") ?? searchParams.get("q") ?? "").trim()
  const status = (searchParams.get("status") ?? "").trim()
  const idFilter = (searchParams.get("id") ?? "").trim()
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
  if (idFilter) filters.push(`id=eq.${encodeURIComponent(idFilter)}`)
  // Optional explicit trainer filter from query params
  if (trainerIdFilter) filters.push(`trainer_id=eq.${encodeURIComponent(trainerIdFilter)}`)
  // Busca simples por nome/email (ilike). Tabela usa campo "name"
  const search = q ? `&or=(name.ilike.*${encodeURIComponent(q)}*,email.ilike.*${encodeURIComponent(q)}*)` : ""

  // Trainer enxerga apenas seus alunos
  if (ctx.role === "trainer") filters.push(`trainer_id=eq.${ctx.userId}`)

  const base = `${url}/rest/v1/students?${filters.join("&")}${search}`
  const rangeStart = (page - 1) * pageSize
  const rangeEnd = rangeStart + pageSize - 1
  const t0 = Date.now()
  const resp = await fetch(`${base}&select=id,name,email,phone,status,onboard_opt,trainer_id,created_at&order=created_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${rangeStart}-${rangeEnd}`, Prefer: "count=exact" },
    cache: "no-store",
  })
  const items = (await resp.json().catch(() => [])) as Array<{
    id: string
    name: string
    email?: string | null
    phone?: string | null
    status: string
    onboard_opt?: 'nao_enviar'|'enviar'|'enviado'
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
    email: it.email ?? null,
    phone: it.phone ?? null,
    status: it.status,
    onboard_opt: (it.onboard_opt as any) ?? 'nao_enviar',
    trainer: it.trainer_id ? { id: it.trainer_id, name: null as string | null } : null,
    created_at: it.created_at,
  }))
  const ms = Date.now() - t0
  return NextResponse.json({
    meta,
    data,
    pagination: { page, page_size: pageSize, total, total_pages: totalPages },
  }, { headers: { 'X-Query-Time': String(ms), 'Cache-Control': 'private, max-age=15' } })
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

  const body: Record<string, unknown> = await request.json().catch(() => ({} as Record<string, unknown>))
  const name = String(body?.name || "").trim()
  const email = String(body?.email || "").trim()
  const phone = body?.phone ? String(body.phone) : null
  const cpf = body?.cpf ? String(body.cpf).trim() : null
  const birthDate = body?.birth_date ? String(body.birth_date) : null
  const customerStage = body?.customer_stage && ["new","renewal","canceled"].includes(String(body.customer_stage)) ? String(body.customer_stage) : 'new'
  const onboardOpt = ((): 'nao_enviar'|'enviar'|'enviado' => {
    const v = String(body?.onboard_opt || 'nao_enviar')
    return (['nao_enviar','enviar','enviado'] as const).includes(v as any) ? (v as any) : 'nao_enviar'
  })()
  const rawAddress = (body?.address ?? null) as Record<string, unknown> | null
  const address = rawAddress ? sanitizeAddress(rawAddress) : null
  // Basic validation for address (when provided): zip 8 digits; state 2 letters
  if (rawAddress) {
    const rawZip = String((rawAddress as Record<string, unknown>)?.zip || "").replace(/\D/g, "")
    if (rawZip && rawZip.length !== 8) {
      return NextResponse.json({ code: 'validation', message: 'CEP deve ter 8 dígitos.' }, { status: 422 })
    }
    const rawState = String((rawAddress as Record<string, unknown>)?.state || "")
    if (rawState && rawState.trim().length !== 2) {
      return NextResponse.json({ code: 'validation', message: 'UF deve ter 2 letras.' }, { status: 422 })
    }
  }
  const rawStatus = String(body?.status || 'onboarding')
  const status = ["onboarding","active","paused"].includes(rawStatus) ? rawStatus : "onboarding"
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
  // Garante seed de estágios do kanban (idempotente)
  try {
    await fetch(`${url}/rest/v1/rpc/seed_kanban_stages`, { method:'POST', headers:{ apikey:key!, Authorization:`Bearer ${key}`!, 'Content-Type':'application/json' }, body: JSON.stringify({ p_org: ctx.tenantId }) })
  } catch {}

  // Transação simples: criar aluno e card juntos; se card falhar, rollback do aluno
  const commonHeaders = { apikey: key!, Authorization: `Bearer ${key}`!, "Content-Type": "application/json", Prefer: "return=representation" }
  let insert = await fetch(`${url}/rest/v1/students`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({ tenant_id: ctx.tenantId, name, email, phone, cpf, birth_date: birthDate, customer_stage: customerStage, address, status, trainer_id: trainerId, onboard_opt: onboardOpt }),
  })
  if (!insert.ok) {
    const status = insert.status
    const errText = await insert.text().catch(()=>"")
    // Fallback: se coluna onboard_opt não existir ainda (migração pendente), reenvia sem o campo
    if (/onboard_opt/i.test(errText) || /column/i.test(errText)) {
      insert = await fetch(`${url}/rest/v1/students`, {
        method: "POST",
        headers: commonHeaders,
        body: JSON.stringify({ tenant_id: ctx.tenantId, name, email, phone, cpf, birth_date: birthDate, customer_stage: customerStage, address, status, trainer_id: trainerId }),
      })
    }
    // Erro de unicidade (e.g., e-mail duplicado)
    if (!insert.ok) {
      const text2 = await insert.text().catch(()=>"")
      if (status === 409 || /duplicate key|unique/i.test(text2)) {
        return NextResponse.json({ error: "validation", code: "unique_email" }, { status: 422 })
      }
      return NextResponse.json({ error: "insert_failed", details: text2 || errText || String(status) }, { status: 500 })
    }
  }
  if (!insert.ok) return NextResponse.json({ error: "insert_failed" }, { status: 500 })
  const row = await insert.json()
  const newId = row?.[0]?.id as string | undefined
  await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: "feature.used", payload: { feature: "students.create", id: newId } })
  // Criar card apenas quando o usuário opta por enviar para o Kanban
  try {
    if (newId && onboardOpt === 'enviar') {
      const headers = { apikey: key!, Authorization: `Bearer ${key}`!, "Content-Type": "application/json" }
      // idempotência: não duplica
      const exist = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&student_id=eq.${newId}&select=id&limit=1`, { headers, cache: 'no-store' })
      const exists = (await exist.json().catch(()=>[]))?.[0]
      if (!exists) {
        // Prioriza a coluna fixa de posição 1
        let stageResp = await fetch(`${url}/rest/v1/kanban_stages?org_id=eq.${ctx.tenantId}&position=eq.1&select=id,position&limit=1`, { headers, cache: 'no-store' })
        let stage = (await stageResp.json().catch(()=>[]))?.[0]
        // Fallback: pega a primeira por posição
        if (!stage?.id) {
          stageResp = await fetch(`${url}/rest/v1/kanban_stages?org_id=eq.${ctx.tenantId}&select=id,position&order=position.asc&limit=1`, { headers, cache: 'no-store' })
          stage = (await stageResp.json().catch(()=>[]))?.[0]
        }
        if (!stage?.id) throw new Error('no_stage')
        const posResp = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&stage_id=eq.${stage.id}&select=position&order=position.desc&limit=1`, { headers, cache: 'no-store' })
        const top = (await posResp.json().catch(()=>[]))?.[0]
        const nextPos = Number.isFinite(Number(top?.position)) ? Number(top.position) + 1 : 0
        let ins = await fetch(`${url}/rest/v1/kanban_items`, { method:'POST', headers, body: JSON.stringify({ org_id: ctx.tenantId, student_id: newId, stage_id: stage.id, position: nextPos, meta: { pending_services: 0 } }) })
        if (!ins.ok) {
          const errText = await ins.text().catch(()=>"")
          // Fallback: se coluna meta não existe no cache/DB, tenta sem meta
          if (ins.status === 400 && /meta/i.test(errText)) {
            ins = await fetch(`${url}/rest/v1/kanban_items`, { method:'POST', headers, body: JSON.stringify({ org_id: ctx.tenantId, student_id: newId, stage_id: stage.id, position: nextPos }) })
          }
          // Se foi conflito de unicidade, tratamos como sucesso idempotente
          if (!ins.ok) {
            const errText2 = await ins.text().catch(()=>"")
            if (ins.status === 409 || /duplicate key|unique/i.test(errText2)) {
              await fetch(`${url}/rest/v1/students?id=eq.${newId}&tenant_id=eq.${ctx.tenantId}`, { method:'PATCH', headers, body: JSON.stringify({ onboard_opt: 'enviado' }) }).catch(()=>{})
            } else {
              throw new Error(`card_failed|status=${ins.status}|body=${errText2 || errText}`)
            }
          }
        }
        // marca como enviado (após criar card com sucesso)
        await fetch(`${url}/rest/v1/students?id=eq.${newId}&tenant_id=eq.${ctx.tenantId}`, { method:'PATCH', headers, body: JSON.stringify({ onboard_opt: 'enviado' }) })
        
        // As tarefas são instanciadas automaticamente pelo trigger trigger_instantiate_tasks_on_card_create
        // quando o card é criado na tabela kanban_items
        
        try { await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: 'aluno_to_kanban.created', payload: { studentId: newId, stageId: stage.id, position: nextPos, source:'api' } }) } catch {}
      }
    }
  } catch (e) {
    // rollback do aluno para evitar órfão
    if (newId) {
      await fetch(`${url}/rest/v1/students?id=eq.${newId}&tenant_id=eq.${ctx.tenantId}`, { method:'DELETE', headers: { apikey: key!, Authorization: `Bearer ${key}`! } }).catch(()=>{})
    }
    const msg = String((e as Error)?.message || 'unknown')
    // formata status e body quando disponível: card_failed|status=xxx|body=...
    const m = /card_failed\|status=(\d+)\|body=(.*)/.exec(msg)
    if (m) {
      const status = Number(m[1])
      const body = m[2]
      return NextResponse.json({ error: 'kanban_card_failed', reason: 'card_failed', status, details: body || null }, { status: 500 })
    }
    return NextResponse.json({ error: 'kanban_card_failed', reason: msg || 'unknown' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: newId })
}


