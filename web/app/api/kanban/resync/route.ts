import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

// POST /api/kanban/resync — cria cards para alunos 'enviado' sem item no kanban
export async function POST(request: Request) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  const headers = { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type': 'application/json' }

  try {
    // Verificar se é uma criação forçada para um aluno específico
    const body = await request.json().catch(() => ({}))
    const { student_id, force_create, org_id: bodyOrgId } = body
    
    // Tentar resolver contexto, mas se falhar, usar org_id do body (para chamadas internas)
    const ctx = await resolveRequestContext(request)
    const orgId = ctx?.org_id || bodyOrgId
    
    if (!orgId) {
      console.warn('[KANBAN RESYNC] org_id não disponível nem no contexto nem no body')
      return NextResponse.json({ error: 'unauthorized', message: 'org_id requerido' }, { status: 401 })
    }
    
    console.log('[KANBAN RESYNC] Iniciando resync:', { orgId, student_id, force_create, hasContext: !!ctx, usedBodyOrgId: !ctx?.org_id })

    let firstStageResp = await fetch(`${url}/rest/v1/kanban_stages?org_id=eq.${orgId}&position=eq.1&select=id,position&limit=1`, { headers, cache: 'no-store' })
    let firstStage = (await firstStageResp.json().catch(()=>[]))?.[0]
    if (!firstStage?.id) {
      firstStageResp = await fetch(`${url}/rest/v1/kanban_stages?org_id=eq.${orgId}&select=id,position&order=position.asc&limit=1`, { headers, cache:'no-store' })
      firstStage = (await firstStageResp.json().catch(()=>[]))?.[0]
    }
    if (!firstStage?.id) {
      console.warn('[KANBAN RESYNC] Nenhum estágio encontrado para org_id:', orgId)
      return NextResponse.json({ ok: false, code:'no_stage' }, { status: 200 })
    }

    // Se é criação forçada para um aluno específico
    if (force_create && student_id) {
      console.log('[KANBAN RESYNC] Modo force_create ativado para student_id:', student_id)
      
      // Verificar se já existe card para este aluno
      const ex = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${orgId}&student_id=eq.${student_id}&select=id&limit=1`, { headers, cache:'no-store' })
      const has = (await ex.json().catch(()=>[]))?.[0]
      
      if (!has) {
        console.log('[KANBAN RESYNC] Card não existe, criando...')
        
        // Buscar próxima posição
        const posResp = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${orgId}&stage_id=eq.${firstStage.id}&select=position&order=position.desc&limit=1`, { headers, cache:'no-store' })
        const top = (await posResp.json().catch(()=>[]))?.[0]
        const nextPos = Number.isFinite(Number(top?.position)) ? Number(top.position) + 1 : 0
        
        console.log('[KANBAN RESYNC] Criando card na posição:', nextPos)
        
        // Criar card forçadamente
        const ins = await fetch(`${url}/rest/v1/kanban_items`, { 
          method:'POST', 
          headers, 
          body: JSON.stringify({ 
            org_id: orgId, 
            student_id: student_id, 
            stage_id: firstStage.id, 
            position: nextPos 
          }) 
        })
        
        if (ins.ok) {
          console.log('[KANBAN RESYNC] ✅ Card criado com sucesso')
          return NextResponse.json({ ok: true, created: 1, message: 'Card criado com sucesso' })
        } else {
          const errorText = await ins.text()
          console.error('[KANBAN RESYNC] ❌ Erro ao criar card:', errorText)
          return NextResponse.json({ ok: false, error: `Erro ao criar card: ${errorText}` }, { status: 500 })
        }
      } else {
        console.log('[KANBAN RESYNC] Card já existe, nada a fazer')
        return NextResponse.json({ ok: true, created: 0, message: 'Card já existe' })
      }
    }

    // Lógica original para resync geral
    console.log('[KANBAN RESYNC] Modo resync geral')
    const toCreateResp = await fetch(`${url}/rest/v1/students?org_id=eq.${orgId}&or=(onboard_opt.eq.enviar,onboard_opt.eq.enviado)&select=id`, { headers, cache:'no-store' })
    const rows: Array<{ id:string }> = await toCreateResp.json().catch(()=>[])
    let created = 0
    for (const r of rows) {
      const ex = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${orgId}&student_id=eq.${r.id}&select=id&limit=1`, { headers, cache:'no-store' })
      const has = (await ex.json().catch(()=>[]))?.[0]
      if (!has) {
        const posResp = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${orgId}&stage_id=eq.${firstStage.id}&select=position&order=position.desc&limit=1`, { headers, cache:'no-store' })
        const top = (await posResp.json().catch(()=>[]))?.[0]
        const nextPos = Number.isFinite(Number(top?.position)) ? Number(top.position) + 1 : 0
        const ins = await fetch(`${url}/rest/v1/kanban_items`, { method:'POST', headers, body: JSON.stringify({ org_id: orgId, student_id: r.id, stage_id: firstStage.id, position: nextPos }) })
        if (ins.ok) created++
      }
    }
    console.log('[KANBAN RESYNC] ✅ Resync concluído:', { created })
    return NextResponse.json({ ok: true, created })
  } catch (e) {
    const msg = (e as Error)?.message || 'error'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}



