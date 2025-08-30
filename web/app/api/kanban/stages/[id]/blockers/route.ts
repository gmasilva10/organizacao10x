import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

// GET /api/kanban/stages/:id/blockers → { hasPendingServices: boolean, pendingCount?: number }
export async function GET(request: Request, ctxParam: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await ctxParam.params
  if (!id) return NextResponse.json({ error: 'invalid_id' }, { status: 400 })

  // MVP: conta pendências simuladas via agregação simples em kanban_items.meta.pending_services
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ hasPendingServices: false })
  try {
    const resp = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&stage_id=eq.${id}&select=id,meta`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' })
    const rows: Array<{ id: string; meta: any }> = await resp.json().catch(()=>[])
    const pending = rows.filter(r => {
      const p = (r?.meta?.pending_services ?? 0) as number
      return Number(p) > 0
    }).length
    return NextResponse.json({ hasPendingServices: pending > 0, pendingCount: pending })
  } catch {
    return NextResponse.json({ hasPendingServices: false })
  }
}


