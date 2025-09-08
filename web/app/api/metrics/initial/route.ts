import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

// GET /api/metrics/initial - Endpoint agregador para Dashboard
export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const t0 = Date.now()
  const headers = { apikey: key!, Authorization: `Bearer ${key}`! }

  try {
    // Contadores em paralelo
    const [studentsResp, servicesResp, collaboratorsResp, occurrencesResp, kanbanResp] = await Promise.all([
      // Students count
      fetch(`${url}/rest/v1/students?tenant_id=eq.${ctx.tenantId}&deleted_at=is.null&select=id`, {
        headers: { ...headers, Prefer: "count=exact" },
        cache: "no-store"
      }),
      // Services count (placeholder - pode ser implementado depois)
      Promise.resolve({ headers: new Headers({ "content-range": "*/0" }) }),
      // Collaborators count
      fetch(`${url}/rest/v1/collaborators?tenant_id=eq.${ctx.tenantId}&select=id`, {
        headers: { ...headers, Prefer: "count=exact" },
        cache: "no-store"
      }),
      // Open occurrences count
      fetch(`${url}/rest/v1/student_occurrences?tenant_id=eq.${ctx.tenantId}&status=eq.OPEN&select=id`, {
        headers: { ...headers, Prefer: "count=exact" },
        cache: "no-store"
      }),
      // Kanban items count
      fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&select=id`, {
        headers: { ...headers, Prefer: "count=exact" },
        cache: "no-store"
      })
    ])

    // Processar contadores
    const studentsTotal = Number(studentsResp.headers.get("content-range")?.split("/")?.[1] || 0)
    const servicesTotal = 0 // Placeholder
    const collaboratorsTotal = Number(collaboratorsResp.headers.get("content-range")?.split("/")?.[1] || 0)
    const occurrencesOpen = Number(occurrencesResp.headers.get("content-range")?.split("/")?.[1] || 0)
    const kanbanCards = Number(kanbanResp.headers.get("content-range")?.split("/")?.[1] || 0)

    // Buscar ocorrências de hoje
    const today = new Date().toISOString().split('T')[0]
    const todayOccurrencesResp = await fetch(
      `${url}/rest/v1/student_occurrences?tenant_id=eq.${ctx.tenantId}&occurred_at=gte.${today}&select=id`,
      { headers: { ...headers, Prefer: "count=exact" }, cache: "no-store" }
    )
    const occurrencesToday = Number(todayOccurrencesResp.headers.get("content-range")?.split("/")?.[1] || 0)

    const ms = Date.now() - t0

    const metrics = {
      students: {
        total: studentsTotal,
        active: studentsTotal // Simplificado - pode ser refinado depois
      },
      services: {
        total: servicesTotal
      },
      collaborators: {
        total: collaboratorsTotal
      },
      occurrences: {
        open: occurrencesOpen,
        today: occurrencesToday
      },
      kanban: {
        cards: kanbanCards,
        tasks_open: kanbanCards // Simplificado
      },
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(metrics, {
      headers: {
        'X-Query-Time': String(ms),
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        'X-Cache-Hit': 'false'
      }
    })

  } catch (error) {
    console.error('Erro no endpoint metrics/initial:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
