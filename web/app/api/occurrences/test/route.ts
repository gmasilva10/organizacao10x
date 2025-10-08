import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/occurrences/test
// Versão ultra simples para testar
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: membership } = await supabase
      .from('memberships')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })

    // Query ultra simples
    const { data, error } = await supabase
      .from('student_occurrences')
      .select('id, student_id, status, occurred_at')
      .eq('org_id', membership.org_id)
      .eq('status', 'OPEN')
      .limit(5)

    return NextResponse.json({ 
      success: true,
      data, 
      error,
      membership,
      org_id: membership.org_id 
    })
  } catch (e) {
    console.error('Erro na API test /occurrences:', e)
    return NextResponse.json({ error: 'Erro interno do servidor', details: e }, { status: 500 })
  }
}

