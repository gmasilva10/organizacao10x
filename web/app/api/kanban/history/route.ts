import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

// GET /api/kanban/history?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const trainerId = searchParams.get('trainerId')
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || 20)))

  const filters = [`tenant_id=eq.${ctx.tenantId}`]
  if (from) filters.push(`completed_at=gte.${from}`)
  if (to) filters.push(`completed_at=lte.${to}T23:59:59`)
  if (trainerId) {
    filters.push(`trainer_id=eq.${trainerId}`)
  } else if (ctx.role === 'trainer') {
    filters.push(`trainer_id=eq.${ctx.userId}`)
  }

  const rangeStart = (page - 1) * pageSize
  const rangeEnd = rangeStart + pageSize - 1
  const resp = await fetch(`${url}/rest/v1/onboarding_cards?${filters.join('&')}&completed_at=is.not.null&select=id,student_id,trainer_id,completed_at&order=completed_at.desc`, {
    headers: { apikey: key!, Authorization: `Bearer ${key}`!, Range: `${rangeStart}-${rangeEnd}`, Prefer: 'count=exact' }, cache: 'no-store'
  })
  const data = await resp.json().catch(()=>[])
  const items = Array.isArray(data) ? data : []
  const contentRange = resp.headers.get('content-range') || '0-0/0'
  const total = Number(contentRange.split('/').pop() || 0)
  return NextResponse.json({ items, page, pageSize, total })
}


