import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

export async function GET(request: Request, ctxParam: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await ctxParam.params
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const pageSize = Math.min(50, Math.max(10, Number(searchParams.get('pageSize') || 20)))
  const rangeStart = (page - 1) * pageSize
  const rangeEnd = rangeStart + pageSize - 1
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const resp = await fetch(`${url}/rest/v1/relationship_messages?tenant_id=eq.${ctx.tenantId}&student_id=eq.${id}&order=created_at.desc`, { headers: { apikey: key!, Authorization: `Bearer ${key}`!, Range: `${rangeStart}-${rangeEnd}`, Prefer: 'count=exact' } })
  const items = await resp.json().catch(()=>[])
  const contentRange = resp.headers.get('content-range') || '0-0/0'
  const total = Number(contentRange.split('/').pop() || 0)
  return NextResponse.json({ items, page, pageSize, total })
}


