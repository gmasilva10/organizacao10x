import { AppShell } from '@/components/AppShell'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const isE2E = !!cookieStore.get('e2e')?.value
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!isE2E) {
      if (error || !user) {
        logger.debug('🔍 [APP LAYOUT] Redirecionando para home - erro de usuário:', { error: error?.message, hasUser: !!user })
        redirect('/')
      }
    }

    // Buscar informações do usuário + membership/role + perfil (avatar)
    let role: string | undefined
    let name: string | undefined
    let avatar_url: string | null | undefined
    const activeOrg = cookieStore.get('pg.active_org')?.value || null

    if (!isE2E && user?.id) {
      const [membershipRes, profileRes] = await Promise.all([
        (await createClient())
          .from('memberships')
          .select('org_id, role')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle(),
        (await createClient())
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle()
      ])
      role = (membershipRes.data?.role as string) || undefined
      name = profileRes.data?.full_name || user.user_metadata?.name
      avatar_url = profileRes.data?.avatar_url || null
    } else {
      // E2E: fornecer dados mínimos para renderização
      role = 'admin'
      name = 'E2E User'
      avatar_url = null
    }

    const userInfo = {
      name: name || user?.email?.split('@')[0] || 'User',
      email: user?.email || 'user@test',
      role: role || 'support',
      avatar_url: avatar_url ?? null,
    }

    return (
      <AppShell user={userInfo} activeOrgId={activeOrg}>
        {children}
      </AppShell>
    )
  } catch (error) {
    logger.error('Auth error in app layout:', error)
    redirect('/')
  }
}
