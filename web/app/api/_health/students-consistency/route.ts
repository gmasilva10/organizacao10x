import { NextRequest, NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"

export async function GET(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEBUG !== 'true') {
    return NextResponse.json({ error: 'disabled' }, { status: 404 })
  }
  const ctx = await resolveRequestContext(request)
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  const softDelete = (process.env.STUDENTS_USE_SOFT_DELETE ?? 'true') !== 'false'

  // pegar 3 primeiros alunos
  const baseFilters = [`org_id=eq.${ctx.tenantId}`]
  if (softDelete) baseFilters.push('deleted_at=is.null')
  const listUrl = `${url}/rest/v1/students?${baseFilters.join('&')}&select=id&limit=3`
  const listResp = await fetch(listUrl, { headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store' })
  if (!listResp.ok) return NextResponse.json({ error: 'list_failed', status: listResp.status }, { status: 500 })
  const ids = (await listResp.json()).map((r: any) => r.id) as string[]

  for (const id of ids) {
    const itemFilters = [`id=eq.${id}`, `org_id=eq.${ctx.tenantId}`]
    if (softDelete) itemFilters.push('deleted_at=is.null')
    const itemUrl = `${url}/rest/v1/students?${itemFilters.join('&')}&select=id`
    const itemResp = await fetch(itemUrl, { headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store' })
    const item = await itemResp.json().catch(() => [])
    if (!Array.isArray(item) || item.length === 0) {
      return NextResponse.json({
        ok: false,
        inconsistentId: id,
        tenantId: ctx.tenantId,
        details: { listUrl, itemUrl, itemStatus: itemResp.status },
      }, { status: 500 })
    }
  }
  return NextResponse.json({ ok: true })
}



