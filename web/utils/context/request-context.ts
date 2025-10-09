import { cookies, headers } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export type RequestContext = {
  userId: string | null
  org_id: string | null
  role: string | null
}

export async function resolveRequestContext(_request?: Request): Promise<RequestContext> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    const user = data?.user || null

    // Tenta obter org ativa do cookie (quando AppShell define)
    const cookieStore = await cookies()
    const activeOrg = cookieStore.get("pg.active_org")?.value || null

    // Debug de contexto
    console.log('🔍 resolveRequestContext - Debug:', {
      userId: user?.id,
      userEmail: user?.email,
      activeOrgFromCookie: activeOrg,
      hasUser: !!user
    })

    // Busca membership do usuário (primeira org)
    let resolvedOrgId: string | null = activeOrg
    let role: string | null = null

    if (user) {
      // Primeiro verifica se o activeOrg é válido (usuário tem acesso)
      let membership = null
      
      if (activeOrg) {
        const { data: activeOrgMembership, error: activeOrgError } = await (await createClient())
          .from("memberships")
          .select("org_id, role")
          .eq("user_id", user.id)
          .eq("org_id", activeOrg)
          .limit(1)
          .maybeSingle()
        
        if (activeOrgError) {
          console.error('❌ resolveRequestContext - Erro ao verificar acesso à org ativa:', activeOrgError)
        }
        
        membership = activeOrgMembership
      }
      
      // Se não tem acesso à org ativa ou não há org ativa, busca a primeira disponível
      if (!membership) {
        const { data: firstMembership, error: firstMembershipError } = await (await createClient())
          .from("memberships")
          .select("org_id, role")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle()
        
        if (firstMembershipError) {
          console.error('❌ resolveRequestContext - Erro ao buscar primeira membership:', firstMembershipError)
        }
        
        membership = firstMembership
      }

      resolvedOrgId = membership?.org_id || null
      role = membership?.role || null
      
      // Log de debug para identificar problemas
      if (activeOrg && activeOrg !== resolvedOrgId) {
        console.warn(`⚠️ Org mismatch: activeOrg=${activeOrg}, resolved=${resolvedOrgId}`)
      }

      console.log('🔍 resolveRequestContext - Membership:', {
        membership,
        finalOrgId: resolvedOrgId,
        finalRole: role,
        hadAccessToActiveOrg: !!membership
      })
    }

    return { userId: user?.id || null, org_id: resolvedOrgId, role }
  } catch (error) {
    console.error('❌ resolveRequestContext - Erro inesperado:', error)
    return { userId: null, org_id: null, role: null }
  }
}
