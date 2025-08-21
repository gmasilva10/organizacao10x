export type RoleName = "admin" | "manager" | "trainer" | "seller" | "support"

export type RequestContext = {
  userId: string
  tenantId: string
  role: RoleName
}

// Resolve contexto do request exclusivamente via Supabase Auth + memberships
export async function resolveRequestContext(_request: Request): Promise<RequestContext | null> {
  let supabase: any
  try {
    const { createClient } = await import("@/utils/supabase/server")
    supabase = await createClient()
  } catch {
    return null
  }
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id || ""

  if (!userId) return null

  const { data: membership } = await supabase
    .from("memberships")
    .select("tenant_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle()

  const tenantId = (membership?.tenant_id as string) || ""
  const role = (membership?.role as RoleName) || ""
  if (!tenantId || !role) return null
  return { userId, tenantId, role }
}


