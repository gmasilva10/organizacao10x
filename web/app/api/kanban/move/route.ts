import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent } from "@/server/events"

type MoveBody = {
  studentId: string
  from: string
  to: string
}

const ALLOWED = new Set(["admin", "manager", "trainer"]) as Set<string>

export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  if (!ALLOWED.has(ctx.role)) {
    await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: "rbac.denied", payload: { action: "kanban.move" } })
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as Partial<MoveBody>
  const studentId = String(body.studentId || "").trim()
  const from = String(body.from || "").trim()
  const to = String(body.to || "").trim()
  if (!studentId || !from || !to) return NextResponse.json({ error: "invalid_payload" }, { status: 400 })

  const now = new Date().toISOString()

  // Persistir movimento no banco (MVP): atualizar column_id/sort do card
  let persisted = false
  try {
    const url = process.env.SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    // busca card por (tenant_id, student_id)
    const search = await fetch(`${url}/rest/v1/onboarding_cards?tenant_id=eq.${ctx.tenantId}&student_id=eq.${encodeURIComponent(studentId)}&select=id,column_id,sort`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store'
    })
    const arr = await search.json().catch(()=>[])
    const cardId = arr?.[0]?.id
    if (cardId) {
      // calcular nova ordenação simples: sort = epoch seconds
      const newSort = Math.floor(Date.now() / 1000)
      // detectar se coluna destino é "Entrega do Treino" para completed_at
      const colResp = await fetch(`${url}/rest/v1/onboarding_columns?id=eq.${to}&tenant_id=eq.${ctx.tenantId}&select=title,sort&limit=1`, {
        headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store'
      })
      const col = (await colResp.json().catch(()=>[]))?.[0]
      const completedAt = col && String(col.title).toLowerCase().includes('entrega do treino') ? now : null
      const upd = await fetch(`${url}/rest/v1/onboarding_cards?id=eq.${cardId}&tenant_id=eq.${ctx.tenantId}`, {
        method: 'PATCH',
        headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ column_id: to, sort: newSort, completed_at: completedAt })
      })
      persisted = upd.ok
    }
  } catch {}

  if (persisted) {
    // Telemetria somente em sucesso
    await logEvent({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      eventType: "feature.used",
      payload: {
        type: "student.stage.moved",
        details: {
          studentId,
          from,
          to,
          columns_version: 1,
          source: "kanban.ui",
          ts: now,
        },
        route: "/(app)/onboarding",
      },
    })
  }

  return new NextResponse(null, { status: persisted ? 204 : 500 })
}


