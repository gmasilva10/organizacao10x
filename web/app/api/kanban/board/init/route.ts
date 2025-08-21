import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

// POST /api/kanban/board/init — cria colunas padrão se não existirem (Novo Aluno, Avaliação Inicial, Montagem do Treino, Entrega do Treino)
export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const headers = { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type': 'application/json' }
  const existing = await fetch(`${url}/rest/v1/onboarding_columns?tenant_id=eq.${ctx.tenantId}&select=id&limit=1`, { headers })
  const rows = await existing.json().catch(()=>[])
  if (Array.isArray(rows) && rows.length > 0) return new NextResponse(null, { status: 204 })

  const defaults = [
    { title: 'Novo Aluno', sort: 0 },
    { title: 'Avaliação Inicial', sort: 1 },
    { title: 'Montagem do Treino', sort: 2 },
    { title: 'Entrega do Treino', sort: 3 },
  ]
  const payload = defaults.map(d => ({ tenant_id: ctx.tenantId, title: d.title, sort: d.sort }))
  const ins = await fetch(`${url}/rest/v1/onboarding_columns`, { method: 'POST', headers, body: JSON.stringify(payload) })
  if (!ins.ok) return NextResponse.json({ error: 'init_failed' }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}


