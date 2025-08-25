import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent } from "@/server/events"

export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json().catch(()=>({})) as any
  const email = String(body.email||'').trim().toLowerCase()
  const role = String(body.role||'trainer')
  if (!email) return NextResponse.json({ code:'validation', message:'E-mail é obrigatório.' }, { status: 422 })

  // Capabilities & limits
  const caps = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/capabilities`, { headers: { cookie: (request as any).headers.get('cookie') || '' }}).then(r=>r.json()).catch(()=>null)
  const limitMembers = Number(caps?.limits?.members_total ?? 0)
  const limitTrainers = Number(caps?.limits?.trainers ?? 0)

  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

  // Count tenant members
  if (limitMembers > 0) {
    const resp = await fetch(`${url}/rest/v1/tenant_users?tenant_id=eq.${ctx.tenantId}&select=user_id`, { headers: { apikey: key!, Authorization: `Bearer ${key}`!, Prefer: 'count=exact' } })
    const contentRange = resp.headers.get('content-range') || '*/0'
    const members = Number(contentRange.split('/').pop() || 0)
    if (members >= limitMembers) return NextResponse.json({ error:'limit_reached', details:{ limit:'members_total', value: members, max: limitMembers } }, { status: 422 })
  }

  // Count trainers when inviting trainer
  if (role === 'trainer' && limitTrainers > 0) {
    const resp = await fetch(`${url}/rest/v1/memberships?tenant_id=eq.${ctx.tenantId}&role=eq.trainer&select=user_id`, { headers: { apikey: key!, Authorization: `Bearer ${key}`!, Prefer: 'count=exact' } })
    const contentRange = resp.headers.get('content-range') || '*/0'
    const trainers = Number(contentRange.split('/').pop() || 0)
    if (trainers >= limitTrainers) return NextResponse.json({ error:'limit_reached', details:{ limit:'trainers', value: trainers, max: limitTrainers } }, { status: 422 })
  }

  // Create invited user record (tenant_users)
  // For MVP, we only register invited status; mail delivery omitted.
  // Optional: find existing auth user by email
  const { createClient } = await import('@supabase/supabase-js')
  const admin = createClient(url, key!, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 2000 })
  const user = usersList.users.find(u => (u.email||'').toLowerCase() === email)
  const userId = user?.id || crypto.randomUUID() // placeholder if not found; in real flow, send invite and get id later

  const ins = await fetch(`${url}/rest/v1/tenant_users`, { method:'POST', headers:{ apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type':'application/json', Prefer:'return=minimal' }, body: JSON.stringify({ tenant_id: ctx.tenantId, user_id: userId, status: 'invited', invited_at: new Date().toISOString() }) })
  if (!ins.ok) return NextResponse.json({ error:'insert_failed' }, { status: 500 })

  // Upsert membership for requested role
  if (role) {
    await fetch(`${url}/rest/v1/memberships`, { method:'POST', headers:{ apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type':'application/json', Prefer:'resolution=merge-duplicates' }, body: JSON.stringify({ tenant_id: ctx.tenantId, user_id: userId, role }) })
  }

  await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: 'feature.used', payload: { feature: 'team.invite', email, role } })
  return NextResponse.json({ ok: true, user_id: userId })
}


