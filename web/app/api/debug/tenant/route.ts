import { NextRequest, NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveRequestContext(request)
    const supabase = await createClient()
    
    // Buscar informações detalhadas do usuário
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    // Buscar todas as organizações do usuário
    let memberships: any[] = []
    if (user) {
      const { data: membershipsData } = await supabase
        .from("memberships")
        .select("org_id, role, tenants(id, name, plan)")
        .eq("user_id", user.id)
      
      memberships = membershipsData || []
    }

    // Buscar informações das organizações
    const orgDetails = await Promise.all(
      memberships.map(async (membership: any) => {
        const { data: studentCount } = await supabase
          .from("students")
          .select("id", { count: "exact" })
          .eq("org_id", membership.org_id)
          .is("deleted_at", null)

        return {
          org_id: membership.org_id,
          role: membership.role,
          name: membership.tenants?.name || 'Nome não encontrado',
          plan: membership.tenants?.plan || 'basic',
          student_count: studentCount?.length || 0
        }
      })
    )

    // Informações do cookie
    const cookies = request.cookies
    const activeOrgCookie = cookies.get("pg.active_org")?.value

    return NextResponse.json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        user: user ? {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name
        } : null,
        context: ctx,
        memberships: orgDetails,
        cookies: {
          active_org: activeOrgCookie,
          all_cookies: Object.fromEntries(cookies.getAll().map(c => [c.name, c.value]))
        },
        environment: {
          node_env: process.env.NODE_ENV,
          vercel_env: process.env.VERCEL_ENV
        }
      }
    })
  } catch (error) {
    console.error('Erro no debug de tenant:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
