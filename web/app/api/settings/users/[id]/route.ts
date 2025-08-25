import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

export async function PATCH(request: Request, ctxParam: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await ctxParam.params
  type Body = { status?: unknown }
  const body: Body = await request.json().catch(()=>({}))
  const status = body?.status != null ? String(body.status) : undefined
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (status && !['active','invited','paused'].includes(status)) return NextResponse.json({ code:'validation', message:'status inválido' }, { status: 422 })
  const patch: Record<string, unknown> = {}
  if (status) {
    patch.status = status
    const now = new Date().toISOString()
    if (status === 'active') patch.activated_at = now
    if (status === 'paused') patch.paused_at = now
  }
  const resp = await fetch(`${url}/rest/v1/tenant_users?tenant_id=eq.${ctx.tenantId}&user_id=eq.${id}`, { method:'PATCH', headers:{ apikey:key!, Authorization:`Bearer ${key}`!, 'Content-Type':'application/json', Prefer:'return=minimal' }, body: JSON.stringify(patch) })
  if (!resp.ok) return NextResponse.json({ error:'update_failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}


