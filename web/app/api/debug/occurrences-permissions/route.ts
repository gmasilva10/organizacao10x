import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { can } from '@/server/rbac'

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 1. Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Não autorizado',
        details: 'Usuário não autenticado',
        authError: authError?.message 
      }, { status: 401 })
    }

    // 2. Buscar membership
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('tenant_id, role, created_at')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ 
        error: 'Membro não encontrado',
        details: 'Usuário não possui membership',
        membershipError: membershipError?.message,
        userId: user.id
      }, { status: 404 })
    }

    // 3. Verificar permissões de ocorrências
    const occurrencePermissions = {
      read: can(membership.role as any, 'occurrences.read'),
      write: can(membership.role as any, 'occurrences.write'),
      close: can(membership.role as any, 'occurrences.close'),
      manage: can(membership.role as any, 'occurrences.manage')
    }

    // 4. Verificar dados necessários
    const { data: occurrenceGroups } = await supabase
      .from('occurrence_groups')
      .select('id, name, tenant_id')
      .eq('tenant_id', membership.tenant_id)
      .limit(5)

    const { data: occurrenceTypes } = await supabase
      .from('occurrence_types')
      .select('id, name, group_id, tenant_id')
      .eq('tenant_id', membership.tenant_id)
      .limit(5)

    const { data: students } = await supabase
      .from('students')
      .select('id, name, tenant_id')
      .eq('tenant_id', membership.tenant_id)
      .limit(5)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      membership: {
        tenant_id: membership.tenant_id,
        role: membership.role,
        created_at: membership.created_at
      },
      permissions: occurrencePermissions,
      data: {
        occurrenceGroups: occurrenceGroups?.length || 0,
        occurrenceTypes: occurrenceTypes?.length || 0,
        students: students?.length || 0
      },
      details: {
        occurrenceGroups: occurrenceGroups || [],
        occurrenceTypes: occurrenceTypes || [],
        students: students || []
      }
    })

  } catch (error) {
    console.error('Erro no debug de permissões:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
