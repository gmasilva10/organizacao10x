import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getOccurrencesPermissions } from '@/server/withOccurrencesRBAC'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const permissions = await getOccurrencesPermissions(user.id)
    return NextResponse.json(permissions)

  } catch (error) {
    console.error('Erro ao buscar permissões de ocorrências:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
