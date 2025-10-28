export type RoleName = "admin" | "manager" | "trainer" | "seller" | "support"

import { logger } from "@/lib/logger"

export type RequestContext = {
  userId: string
  org_id: string
  role: RoleName
}

// Resolve contexto do request exclusivamente via Supabase Auth + memberships
export async function resolveRequestContext(_request: Request): Promise<RequestContext | null> {
  let supabase: any
  try {
    const { createClient } = await import("@/utils/supabase/server")
    supabase = await createClient()
  } catch (error) {
    logger.error('❌ [CONTEXT] Erro ao criar cliente Supabase:', error)
    return null
  }
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  logger.debug('🔍 [CONTEXT] User data:', { userData, userError })
  
  const userId = userData?.user?.id || ""
  if (!userId) {
    logger.debug('❌ [CONTEXT] Usuário não autenticado')
    return null
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("org_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle()

  logger.debug('🔍 [CONTEXT] Membership data:', { membership, membershipError })

  const org_id = (membership?.org_id as string) || ""
  const role = (membership?.role as RoleName) || ""
  if (!org_id || !role) {
    logger.debug('❌ [CONTEXT] Membership inválido:', { org_id, role })
    return null
  }
  
  logger.debug('✅ [CONTEXT] Contexto resolvido:', { userId, org_id, role })
  return { userId, org_id, role }
}


