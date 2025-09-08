import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET /api/occurrences/debug
// Versão simplificada para debug
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: membership } = await supabase
      .from('memberships')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })

    // Query simples sem joins
    const { data, error, count } = await supabase
      .from('student_occurrences')
      .select('*', { count: 'exact' })
      .eq('tenant_id', membership.tenant_id)
      .eq('status', 'OPEN')
      .order('occurred_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Erro debug ocorrências:', error)
      return NextResponse.json({ error: 'Erro ao listar ocorrências', details: error }, { status: 500 })
    }

    return NextResponse.json({ 
      data, 
      count,
      membership,
      tenant_id: membership.tenant_id 
    })
  } catch (e) {
    console.error('Erro na API debug /occurrences:', e)
    return NextResponse.json({ error: 'Erro interno do servidor', details: e }, { status: 500 })
  }
}
