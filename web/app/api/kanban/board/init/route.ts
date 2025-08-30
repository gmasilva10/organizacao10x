import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

// POST /api/kanban/board/init — cria colunas padrão (kanban_stages) se não existirem
export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const headers = { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type': 'application/json' }
  // Seed canônico
  try {
    await fetch(`${url}/rest/v1/rpc/seed_kanban_stages_canonical`, { method:'POST', headers, body: JSON.stringify({ p_org: ctx.tenantId }) })
  } catch {}
  // Garante que ao menos uma linha exista
  const existing = await fetch(`${url}/rest/v1/kanban_stages?org_id=eq.${ctx.tenantId}&select=id&limit=1`, { headers, cache:'no-store' })
  const rows = await existing.json().catch(()=>[])
  if (!Array.isArray(rows) || rows.length === 0) {
    const defaults = [
      { name: 'Novo Aluno', position: 0 },
      { name: 'Avaliação Inicial', position: 1 },
      { name: 'Montagem do Treino', position: 2 },
      { name: 'Entrega do Treino', position: 3 },
    ]
    const payload = defaults.map(d => ({ org_id: ctx.tenantId, name: d.name, position: d.position }))
    const ins = await fetch(`${url}/rest/v1/kanban_stages`, { method: 'POST', headers, body: JSON.stringify(payload) })
    if (!ins.ok) return NextResponse.json({ error: 'init_failed' }, { status: 500 })
  }

  // Normalização canônica de posições: 1 (entrada), 99 (entrega), intermediárias 2..98
  try {
    const listResp = await fetch(`${url}/rest/v1/kanban_stages?org_id=eq.${ctx.tenantId}&select=id,name,position,is_fixed,stage_code&order=position.asc`, { headers, cache:'no-store' })
    const stages: Array<{ id:string; name:string; position:number; is_fixed?: boolean; stage_code?: string|null }> = await listResp.json().catch(()=>[])
    if (Array.isArray(stages) && stages.length > 0) {
      const normalizeString = (s:string) => String(s||"").normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase()
      let pos1 = stages.find(s => Number(s.position) === 1)
      if (!pos1) {
        pos1 = stages.find(s => s.stage_code === 'novo_aluno')
          || stages.find(s => /novo aluno|novo$/.test(normalizeString(s.name)))
          || null as any
        if (pos1 && Number(pos1.position) !== 1) {
          await fetch(`${url}/rest/v1/kanban_stages?id=eq.${pos1.id}&org_id=eq.${ctx.tenantId}`, { method:'PATCH', headers, body: JSON.stringify({ position: 1 }) })
        }
      }
      let pos99 = stages.find(s => Number(s.position) === 99)
      if (!pos99) {
        pos99 = stages.find(s => s.stage_code === 'entrega_treino')
          || stages.find(s => /entrega do treino|entrega/.test(normalizeString(s.name)))
          || null as any
        if (pos99 && Number(pos99.position) !== 99) {
          await fetch(`${url}/rest/v1/kanban_stages?id=eq.${pos99.id}&org_id=eq.${ctx.tenantId}`, { method:'PATCH', headers, body: JSON.stringify({ position: 99 }) })
        }
      }
      // Reindexar intermediárias (se existirem)
      const refreshed = await (await fetch(`${url}/rest/v1/kanban_stages?org_id=eq.${ctx.tenantId}&select=id,position&order=position.asc`, { headers, cache:'no-store' })).json().catch(()=>[])
      const mids: Array<{ id:string; position:number }> = (refreshed||[]).filter((s:any) => Number(s.position)!==1 && Number(s.position)!==99)
      if (mids.length > 0) {
        let order = 2
        for (const s of mids) {
          if (Number(s.position) !== order) {
            await fetch(`${url}/rest/v1/kanban_stages?id=eq.${s.id}&org_id=eq.${ctx.tenantId}`, { method:'PATCH', headers, body: JSON.stringify({ position: order }) })
          }
          order = Math.min(98, order + 1)
        }
      }
    }
  } catch {}

  // Resync: para cada aluno marcado como 'enviar' ou 'enviado' sem card, cria card no fim da coluna novo_aluno
  try {
    // coluna fixa position=1
    let sResp = await fetch(`${url}/rest/v1/kanban_stages?org_id=eq.${ctx.tenantId}&position=eq.1&select=id,position&limit=1`, { headers, cache:'no-store' })
    let stage = (await sResp.json().catch(()=>[]))?.[0]
    if (!stage?.id) {
      sResp = await fetch(`${url}/rest/v1/kanban_stages?org_id=eq.${ctx.tenantId}&select=id,position&order=position.asc&limit=1`, { headers, cache:'no-store' })
      stage = (await sResp.json().catch(()=>[]))?.[0]
    }
    if (stage?.id) {
      // alunos enviados (ou marcados para enviar) sem card
      const studentsResp = await fetch(`${url}/rest/v1/students?tenant_id=eq.${ctx.tenantId}&or=(onboard_opt.eq.enviar,onboard_opt.eq.enviado)&select=id`, { headers, cache:'no-store' })
      const students = await studentsResp.json().catch(()=>[])
      for (const st of students) {
        const exist = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&student_id=eq.${st.id}&select=id&limit=1`, { headers, cache:'no-store' })
        const has = (await exist.json().catch(()=>[]))?.[0]
        if (!has) {
          const posResp = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&stage_id=eq.${stage.id}&select=position&order=position.desc&limit=1`, { headers, cache:'no-store' })
          const top = (await posResp.json().catch(()=>[]))?.[0]
          const nextPos = Number.isFinite(Number(top?.position)) ? Number(top.position) + 1 : 0
          await fetch(`${url}/rest/v1/kanban_items`, { method:'POST', headers, body: JSON.stringify({ org_id: ctx.tenantId, student_id: st.id, stage_id: stage.id, position: nextPos }) })
        }
      }
    }
  } catch {}
  // Telemetria leve
  try {
    const { logEvent } = await import('@/server/events')
    await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: 'onboarding.seed_applied', payload: { created: 0 } })
  } catch {}
  return new NextResponse(null, { status: 204 })
}


