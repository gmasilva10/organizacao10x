import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

// POST /api/kanban/columns/reorder  { columnIds: string[] }
export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const body = (await request.json().catch(() => ({}))) as { columnIds?: string[] }
  const columnIds = Array.isArray(body?.columnIds) ? body!.columnIds! : []
  if (columnIds.length === 0) return NextResponse.json({ error: "invalid_payload" }, { status: 400 })

  // Buscar colunas atuais para preservar fixas nas extremidades
  const colsResp = await fetch(
    `${url}/rest/v1/onboarding_columns?tenant_id=eq.${ctx.tenantId}&select=id,title,sort&order=sort.asc`,
    { headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: "no-store" }
  )
  const current: Array<{ id: string; title: string; sort: number }> = await colsResp
    .json()
    .catch(() => [])

  const fixedFirst = current.find((c) => c.title === "Novo Aluno")?.id
  const fixedLast = current.find((c) => c.title === "Entrega do Treino")?.id

  // Montar nova ordem respeitando fixas nas pontas
  const middleIds = columnIds.filter((id) => id !== fixedFirst && id !== fixedLast)
  const updates: Array<{ id: string; sort: number }> = []

  if (fixedFirst) updates.push({ id: fixedFirst, sort: 0 })
  middleIds.forEach((id, idx) => updates.push({ id, sort: (idx + 1) * 10 }))
  if (fixedLast) updates.push({ id: fixedLast, sort: (middleIds.length + 1) * 10 })

  for (const u of updates) {
    const resp = await fetch(
      `${url}/rest/v1/onboarding_columns?id=eq.${u.id}&tenant_id=eq.${ctx.tenantId}`,
      {
        method: "PATCH",
        headers: {
          apikey: key!,
          Authorization: `Bearer ${key}`!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sort: u.sort }),
      }
    )
    if (!resp.ok) return NextResponse.json({ error: "update_failed" }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}



