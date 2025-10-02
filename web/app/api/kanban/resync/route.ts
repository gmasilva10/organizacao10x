import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

// POST /api/kanban/resync — cria cards para alunos 'enviado' sem item no kanban
export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  const headers = { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type': 'application/json' }

  try {
    // Verificar se é uma criação forçada para um aluno específico
    const body = await request.json().catch(() => ({}))
    const { student_id, force_create } = body

    let firstStageResp = await fetch(`${url}/rest/v1/kanban_stages?org_id=eq.${ctx.tenantId}&position=eq.1&select=id,position&limit=1`, { headers, cache: 'no-store' })
    let firstStage = (await firstStageResp.json().catch(()=>[]))?.[0]
    if (!firstStage?.id) {
      firstStageResp = await fetch(`${url}/rest/v1/kanban_stages?org_id=eq.${ctx.tenantId}&select=id,position&order=position.asc&limit=1`, { headers, cache:'no-store' })
      firstStage = (await firstStageResp.json().catch(()=>[]))?.[0]
    }
    if (!firstStage?.id) return NextResponse.json({ ok: false, code:'no_stage' }, { status: 200 })

    // Se é criação forçada para um aluno específico
    if (force_create && student_id) {
      // Verificar se já existe card para este aluno
      const ex = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&student_id=eq.${student_id}&select=id&limit=1`, { headers, cache:'no-store' })
      const has = (await ex.json().catch(()=>[]))?.[0]
      
      if (!has) {
        // Buscar próxima posição
        const posResp = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&stage_id=eq.${firstStage.id}&select=position&order=position.desc&limit=1`, { headers, cache:'no-store' })
        const top = (await posResp.json().catch(()=>[]))?.[0]
        const nextPos = Number.isFinite(Number(top?.position)) ? Number(top.position) + 1 : 0
        
        // Criar card forçadamente
        const ins = await fetch(`${url}/rest/v1/kanban_items`, { 
          method:'POST', 
          headers, 
          body: JSON.stringify({ 
            org_id: ctx.tenantId, 
            student_id: student_id, 
            stage_id: firstStage.id, 
            position: nextPos 
          }) 
        })
        
        if (ins.ok) {
          return NextResponse.json({ ok: true, created: 1, message: 'Card criado com sucesso' })
        } else {
          const errorText = await ins.text()
          return NextResponse.json({ ok: false, error: `Erro ao criar card: ${errorText}` }, { status: 500 })
        }
      } else {
        return NextResponse.json({ ok: true, created: 0, message: 'Card já existe' })
      }
    }

    // Lógica original para resync geral
    const toCreateResp = await fetch(`${url}/rest/v1/students?tenant_id=eq.${ctx.tenantId}&or=(onboard_opt.eq.enviar,onboard_opt.eq.enviado)&select=id`, { headers, cache:'no-store' })
    const rows: Array<{ id:string }> = await toCreateResp.json().catch(()=>[])
    let created = 0
    for (const r of rows) {
      const ex = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&student_id=eq.${r.id}&select=id&limit=1`, { headers, cache:'no-store' })
      const has = (await ex.json().catch(()=>[]))?.[0]
      if (!has) {
        const posResp = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&stage_id=eq.${firstStage.id}&select=position&order=position.desc&limit=1`, { headers, cache:'no-store' })
        const top = (await posResp.json().catch(()=>[]))?.[0]
        const nextPos = Number.isFinite(Number(top?.position)) ? Number(top.position) + 1 : 0
        const ins = await fetch(`${url}/rest/v1/kanban_items`, { method:'POST', headers, body: JSON.stringify({ org_id: ctx.tenantId, student_id: r.id, stage_id: firstStage.id, position: nextPos }) })
        if (ins.ok) created++
      }
    }
    return NextResponse.json({ ok: true, created })
  } catch (e) {
    const msg = (e as Error)?.message || 'error'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}



