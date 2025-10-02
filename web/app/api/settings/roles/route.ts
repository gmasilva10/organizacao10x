import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const [rolesResp, permsResp] = await Promise.all([
    fetch(`${url}/rest/v1/roles?select=id,code,name`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! } }),
    fetch(`${url}/rest/v1/permissions?select=id,domain,action`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! } })
  ])
  const roles = await rolesResp.json().catch(()=>[])
  const perms = await permsResp.json().catch(()=>[])
  // matrix
  const rpResp = await fetch(`${url}/rest/v1/role_permissions?select=role_id,permission_id,allowed`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! } })
  const rp = await rpResp.json().catch(()=>[])
  return NextResponse.json({ roles, permissions: perms, role_permissions: rp })
}



