import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const trainerId = (searchParams.get('trainerId') || '').trim()

  // Removido resync automático; será feito via endpoint dedicado

  const t0 = Date.now()
  // Columns (kanban_stages)
  let columns: Array<{ id: string; title: string; sort: number; is_fixed?: boolean; stage_code?: string; blocked?: boolean }> = []
  {
    const colsResp = await fetch(`${url}/rest/v1/kanban_stages?org_id=eq.${ctx.tenantId}&select=id,name,position,is_fixed,stage_code&order=position.asc`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store'
    })
    if (colsResp.ok) {
      const stages: Array<{ id: string; name: string; position: number; is_fixed:boolean; stage_code:string|null }> = await colsResp.json().catch(()=>[])
      columns = stages.map(s => ({ id: s.id, title: s.name, sort: s.position, is_fixed: s.is_fixed, stage_code: s.stage_code || undefined }))
    } else {
      // Fallback para modelo antigo (onboarding_columns)
      const t = await colsResp.text().catch(()=>"")
      try {
        const legacy = await fetch(`${url}/rest/v1/onboarding_columns?org_id=eq.${ctx.tenantId}&select=id,title,sort&order=sort.asc`, {
          headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store'
        })
        if (legacy.ok) {
          const rows: Array<{ id: string; title: string; sort: number }> = await legacy.json().catch(()=>[])
          columns = rows.map(r => ({ id: r.id, title: r.title, sort: Number(r.sort||0) }))
        } else {
          const lt = await legacy.text().catch(()=>"")
          return NextResponse.json({ error: 'stages_fetch_failed', status: colsResp.status, details: t || lt }, { status: 500 })
        }
      } catch {
        return NextResponse.json({ error: 'stages_fetch_failed', status: colsResp.status, details: t }, { status: 500 })
      }
    }
  }

  // Cards
  const trainerFilter = trainerId ? `&trainer_id=eq.${trainerId}` : (ctx.role === 'trainer' ? `&trainer_id=eq.${ctx.userId}` : '')
  let cards: Array<{ id: string; student_id: string; column_id: string; sort: number; created_at?: string; completed_at?: string | null; _meta?: any }>
  = []
  {
    // Busca robusta incluindo org_id; tenta incluir meta quando existir
    let cardsResp = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&select=id,student_id,stage_id,position,created_at,meta&order=position.asc`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store'
    })
    if (!cardsResp.ok) {
      // Fallback sem meta
      cardsResp = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&select=id,student_id,stage_id,position,created_at&order=position.asc`, {
        headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store'
      })
    }
    if (cardsResp.ok) {
      const cardsRaw: Array<{ id: string; student_id: string; stage_id: string; position: number; created_at?: string | null; meta?: any }> = await cardsResp.json().catch(()=>[])
      cards = cardsRaw.map(r => ({ id: r.id, student_id: r.student_id, column_id: r.stage_id, sort: r.position, created_at: r.created_at || undefined, completed_at: null, _meta: (r as any).meta }))
    } else {
      const t = await cardsResp.text().catch(()=>"")
      // Fallback para modelo antigo
      try {
        const legacy = await fetch(`${url}/rest/v1/onboarding_cards?org_id=eq.${ctx.tenantId}&select=id,student_id,column_id,sort,created_at,completed_at&order=sort.asc`, {
          headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store'
        })
        if (legacy.ok) {
          const rows: Array<{ id:string; student_id:string; column_id:string; sort:number; created_at?:string|null; completed_at?:string|null }>
            = await legacy.json().catch(()=>[])
          cards = rows.map(r => ({ id: r.id, student_id: r.student_id, column_id: r.column_id, sort: Number(r.sort||0), created_at: r.created_at || undefined, completed_at: r.completed_at || null }))
        } else {
          const lt = await legacy.text().catch(()=>"")
          return NextResponse.json({ error: 'items_fetch_failed', status: cardsResp.status, details: t || lt }, { status: 500 })
        }
      } catch {
        return NextResponse.json({ error: 'items_fetch_failed', status: cardsResp.status, details: t }, { status: 500 })
      }
    }
  }

  // Salvaguarda: se não retornou nenhum card mas existem itens na tabela para a org, tenta uma segunda leitura simples
  if (cards.length === 0) {
    const probe = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&select=id,student_id,stage_id,position&order=position.asc`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store'
    })
    if (probe.ok) {
      const rows: Array<{ id:string; student_id:string; stage_id:string; position:number }>= await probe.json().catch(()=>[])
      cards = rows.map(r => ({ id: r.id, student_id: r.student_id, column_id: r.stage_id, sort: r.position, created_at: undefined, completed_at: null }))
    }
  }

  // Segunda salvaguarda: se ainda estiver vazio, tenta ressincronizar alunos enviados e refazer a leitura
  if (cards.length === 0) {
    try {
      await fetch(new URL('/api/kanban/resync', request.url).toString(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store' })
    } catch {}
    const retry = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&select=id,student_id,stage_id,position&order=position.asc`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store'
    })
    if (retry.ok) {
      const rows2: Array<{ id:string; student_id:string; stage_id:string; position:number }>= await retry.json().catch(()=>[])
      cards = rows2.map(r => ({ id: r.id, student_id: r.student_id, column_id: r.stage_id, sort: r.position, created_at: undefined, completed_at: null }))
    }
  }

  // Blockers (em lote): bloqueia coluna se algum card tiver meta.pending_services > 0
  const blockedByStage: Record<string, boolean> = {}
  for (const c of cards) {
    try {
      const pending = (c as any)?._meta?.pending_services
      if (typeof pending === 'number' && pending > 0) blockedByStage[c.column_id] = true
    } catch {}
  }
  if (columns.length) {
    columns = columns.map(col => ({ ...col, blocked: Boolean(blockedByStage[col.id]) }))
  }

  // Enriquecer com dados do aluno (status e nome)
  const studentIds = Array.from(new Set(cards.map(c => c.student_id))).filter(Boolean)
  const studentsMap: Record<string, { status?: string; name?: string; phone?: string }> = {}
  if (studentIds.length > 0) {
    const inList = studentIds.map(encodeURIComponent).join(',')
    const stuResp = await fetch(`${url}/rest/v1/students?org_id=eq.${ctx.tenantId}&id=in.(${inList})&select=id,name,status,phone`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store'
    })
    if (!stuResp.ok) {
      const t = await stuResp.text().catch(()=>"")
      return NextResponse.json({ error: 'students_fetch_failed', status: stuResp.status, details: t }, { status: 500 })
    }
    const rows: Array<{ id: string; name?: string|null; status?: string; phone?: string }> = await stuResp.json().catch(()=>[])
    for (const r of rows) studentsMap[r.id] = { status: r.status, name: r.name || undefined, phone: r.phone || undefined }
  }

  const enriched = cards.map(c => ({ 
    ...c, 
    student_status: studentsMap[c.student_id]?.status || 'onboarding', 
    student_name: studentsMap[c.student_id]?.name,
    student_phone: studentsMap[c.student_id]?.phone
  }))
  const ms = Date.now() - t0
  return NextResponse.json({ columns, cards: enriched }, { 
    headers: { 
      'X-Query-Time': String(ms), 
      'X-Row-Count': String(cards.length),
      'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' 
    } 
  })
}



