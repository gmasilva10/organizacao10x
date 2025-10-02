import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { can, type Action } from './rbac'
import type { RoleName } from './context'

export type OccurrencesAction = 'occurrences.read' | 'occurrences.write' | 'occurrences.close' | 'occurrences.manage'

export async function withOccurrencesRBAC(
  request: NextRequest,
  action: OccurrencesAction,
  handler: (request: NextRequest, context: { user: any, membership: any, org_id: string }) => Promise<NextResponse>
) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar membership e role
    const { data: membership } = await supabase
      .from('memberships')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }

    // Verificar permissão específica
    if (!can(membership.role as RoleName, action)) {
      return NextResponse.json({ 
        error: 'Acesso negado', 
        details: `Permissão '${action}' necessária` 
      }, { status: 403 })
    }

    // Executar handler com contexto
    return await handler(request, {
      user,
      membership,
      org_id: membership.org_id
    })

  } catch (error) {
    console.error('Erro no middleware RBAC de ocorrências:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Helper para verificar permissões em componentes
export function checkOccurrencesPermission(role: RoleName, action: OccurrencesAction): boolean {
  return can(role, action)
}

// Helper para obter permissões do usuário atual
export async function getOccurrencesPermissions(userId: string) {
  try {
    const supabase = await createClient()
    
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (!membership) {
      return {
        read: false,
        write: false,
        close: false,
        manage: false
      }
    }

    const role = membership.role as RoleName

    return {
      read: can(role, 'occurrences.read'),
      write: can(role, 'occurrences.write'),
      close: can(role, 'occurrences.close'),
      manage: can(role, 'occurrences.manage')
    }
  } catch (error) {
    console.error('Erro ao obter permissões de ocorrências:', error)
    return {
      read: false,
      write: false,
      close: false,
      manage: false
    }
  }
}
