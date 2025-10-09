import { NextRequest, NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NEXT_PUBLIC_DEBUG !== 'true') {
    return NextResponse.json({ error: 'disabled' }, { status: 404 })
  }
  const ctx = await resolveRequestContext(request)
  const { id } = await params
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  const softDelete = (process.env.STUDENTS_USE_SOFT_DELETE ?? 'true') !== 'false'
  const filters: string[] = []
  filters.push(`id=eq.${id}`)
  if (ctx?.tenantId) filters.push(`org_id=eq.${ctx.org_id}`)
  if (softDelete) filters.push('deleted_at=is.null')
  const resp = await fetch(`${url}/rest/v1/students?${filters.join('&')}&select=*`, {
    headers: { apikey: key!, Authorization: `Bearer ${key}`! },
    cache: 'no-store',
  })
  const json = await resp.json().catch(() => null)
  return NextResponse.json({ ok: resp.ok, status: resp.status, data: json })
}


