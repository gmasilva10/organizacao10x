import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

// GET /api/kanban/tree — árvore para gestores: raiz=organização; filhos=professores e seus alunos/cards
export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  // Perfis: admin|manager veem todos; trainer vê apenas seus
  const trainerScope = ctx.role === 'trainer' ? `&trainer_id=eq.${ctx.userId}` : ''

  // Lista distinta de trainers com contagem
  const trainersResp = await fetch(`${url}/rest/v1/onboarding_cards?tenant_id=eq.${ctx.tenantId}${trainerScope}&completed_at=is.null&select=trainer_id,student_id,column_id`, {
    headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store'
  })
  const cards = await trainersResp.json().catch(()=>[] as Array<{trainer_id: string|null; student_id: string; column_id: string}>)
  const byTrainer = new Map<string, Array<{ student_id: string; column_id: string }>>()
  for (const c of cards) {
    const k = c.trainer_id || 'unassigned'
    if (!byTrainer.has(k)) byTrainer.set(k, [])
    byTrainer.get(k)!.push({ student_id: c.student_id, column_id: c.column_id })
  }

  const nodes = Array.from(byTrainer.entries()).map(([trainerId, items]) => ({
    id: trainerId,
    type: trainerId === 'unassigned' ? 'group' : 'trainer',
    title: trainerId === 'unassigned' ? 'Sem treinador' : `Treinador ${trainerId.slice(0,8)}`,
    count: items.length,
    items,
  }))

  return NextResponse.json({ root: { id: ctx.tenantId, title: 'Organização', count: cards.length }, nodes })
}



