export async function fetchPlanPolicyByTenant(tenantId: string) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return null
  const resp = await fetch(`${url}/rest/v1/plan_policies?tenant_id=eq.${tenantId}&select=name,limits,features`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  })
  if (!resp.ok) return null
  const rows = await resp.json()
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null
}


