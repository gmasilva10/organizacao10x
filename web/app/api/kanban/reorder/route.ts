import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

// POST /api/kanban/reorder  { columnId: string, cardIds: string[] }
export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const body = await request.json().catch(()=>({})) as { columnId?: string; cardIds?: string[] }
  const columnId = String(body?.columnId || '').trim()
  const cardIds = Array.isArray(body?.cardIds) ? body!.cardIds! : []
  if (!columnId || cardIds.length === 0) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })

  // sort sequencial (10,20,30,...) para espaço futuro
  const updates = cardIds.map((id, idx) => ({ id, sort: (idx+1)*10 }))
  for (const u of updates) {
    const resp = await fetch(`${url}/rest/v1/onboarding_cards?id=eq.${u.id}&org_id=eq.${ctx.tenantId}`, {
      method: 'PATCH', headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sort: u.sort, column_id: columnId })
    })
    if (!resp.ok) return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
  return new NextResponse(null, { status: 204 })
}



