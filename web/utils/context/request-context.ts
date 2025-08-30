import { cookies, headers } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export type RequestContext = {
  userId: string | null
  tenantId: string | null
  role: string | null
}

export async function resolveRequestContext(_request?: Request): Promise<RequestContext> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user || null

  // Tenta obter org ativa do cookie (quando AppShell define)
  const cookieStore = await cookies()
  const activeOrg = cookieStore.get("pg.active_org")?.value || null

  // Busca membership do usuário (primeira org)
  let tenantId: string | null = activeOrg
  let role: string | null = null

  if (user) {
    const { data: membership } = await (await createClient())
      .from("memberships")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()

    tenantId = tenantId || membership?.tenant_id || null
    role = membership?.role || null
  }

  return { userId: user?.id || null, tenantId, role }
}
