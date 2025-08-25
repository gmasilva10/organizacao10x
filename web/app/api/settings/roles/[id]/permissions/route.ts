import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

export async function PATCH(request: Request, ctxParam: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error:'unauthorized' }, { status: 401 })
  const { id } = await ctxParam.params
  const body = await request.json().catch(()=>({})) as Array<{ permission_id: string; allowed: boolean }>
  if (!Array.isArray(body)) return NextResponse.json({ code:'validation', message:'payload inválido' }, { status: 422 })
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  // upsert em lote
  const rows = body.map(x => ({ role_id: id, permission_id: x.permission_id, allowed: !!x.allowed }))
  const resp = await fetch(`${url}/rest/v1/role_permissions`, { method:'POST', headers:{ apikey:key!, Authorization:`Bearer ${key}`!, 'Content-Type':'application/json', Prefer:'resolution=merge-duplicates' }, body: JSON.stringify(rows) })
  if (!resp.ok) return NextResponse.json({ error:'update_failed' }, { status: 500 })
  // audit simplificado
  await fetch(`${url}/rest/v1/settings_audit`, { method:'POST', headers:{ apikey:key!, Authorization:`Bearer ${key}`!, 'Content-Type':'application/json', Prefer:'return=minimal' }, body: JSON.stringify({ tenant_id: ctx.tenantId, actor_user_id: ctx.userId, area: 'roles', action: 'update', before: null, after: rows }) })
  return NextResponse.json({ ok: true })
}


