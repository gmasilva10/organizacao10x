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

    // Buscar informações do usuário + membership/role
    const user = session.user
    const { data: membership } = await (await createClient())
      .from('memberships')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    const cookieStore = await cookies()
    const activeOrg = cookieStore.get('pg.active_org')?.value || null

    const userInfo = {
      name: user.user_metadata?.name || user.email?.split('@')[0],
      email: user.email,
      role: (membership?.role as string) || (user.user_metadata?.role as string) || 'support',
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
