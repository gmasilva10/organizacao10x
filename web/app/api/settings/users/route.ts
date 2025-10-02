import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const tu = await fetch(`${url}/rest/v1/tenant_users?org_id=eq.${ctx.tenantId}&select=user_id,status,invited_at,activated_at,paused_at,last_login_at`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! } })
  const list: Array<{ user_id: string; status: string; invited_at: string|null; activated_at: string|null; paused_at: string|null; last_login_at: string|null }>
    = await tu.json().catch(()=>[])
  // opcional: join com auth.users via Admin API (e-mails)
  let mapped: Array<{ user_id: string; email: string|null; status: string; last_login_at: string|null }> = list.map(x => ({ user_id: x.user_id, email: null, status: x.status, last_login_at: x.last_login_at }))
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(url, key!, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 2000 })
    mapped = list.map((x) => ({
      user_id: x.user_id,
      email: data.users.find(u=>u.id===x.user_id)?.email || null,
      status: x.status,
      last_login_at: x.last_login_at,
    }))
  } catch {}
  return NextResponse.json({ items: mapped })
}



