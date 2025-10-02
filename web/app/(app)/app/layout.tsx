import { AppShell } from '@/components/AppShell'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      redirect('/')
    }

    // Buscar informações do usuário + membership/role + perfil (avatar)
    const user = session.user
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

    const membership = membershipRes.data
    const profile = profileRes.data

    const cookieStore = await cookies()
    const activeOrg = cookieStore.get('pg.active_org')?.value || null

    const userInfo = {
      name: profile?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
      email: user.email,
      role: (membership?.role as string) || (user.user_metadata?.role as string) || 'support',
      avatar_url: profile?.avatar_url || null,
    }

    return (
      <AppShell user={userInfo} activeOrgId={activeOrg}>
        {children}
      </AppShell>
    )
  } catch (error) {
    console.error('Auth error in app layout:', error)
    redirect('/')
  }
}
