import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent } from "@/server/events"

// POST /api/kanban/columns  { title: string }
export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const body = await request.json().catch(()=>({})) as { title?: string }
  const title = String(body?.title || '').trim()
  if (!title) return NextResponse.json({ error: 'invalid_title' }, { status: 400 })

  // sort = último + 1
  const sortResp = await fetch(`${url}/rest/v1/onboarding_columns?tenant_id=eq.${ctx.tenantId}&select=sort&order=sort.desc&limit=1`, {
    headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store'
  })
  const last = (await sortResp.json().catch(()=>[]))?.[0]?.sort ?? -1
  const sort = Number(last) + 1

  const ins = await fetch(`${url}/rest/v1/onboarding_columns`, {
    method: 'POST',
    headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type':'application/json', Prefer:'return=representation' },
    body: JSON.stringify({ tenant_id: ctx.tenantId, title, sort })
  })
  if (!ins.ok) return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  const row = await ins.json().catch(()=>[])
  const now = new Date().toISOString()
  await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: 'feature.used', payload: { type: 'kanban.column', action: 'create', details: { columnId: row?.[0]?.id, columns_version: 1, ts: now }, route: '/(app)/onboarding' } })
  // Não alterar cards existentes; apenas retornar representação da coluna criada
  return NextResponse.json({ ok:true, id: row?.[0]?.id })
}


