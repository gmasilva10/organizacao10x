import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('studentId')
  if (!studentId) return NextResponse.json({ error: 'studentId é obrigatório' }, { status: 400 })
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data, error } = await supabase
      .from('relacionamento_messages')
      .select('id, channel, direction, status, to_text, group_id, template_id, payload, created_at')
      .eq('tenant_id', (user.user_metadata as any)?.tenant_id)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) return NextResponse.json({ error: 'Falha ao listar histórico' }, { status: 500 })
    return NextResponse.json({ messages: data || [] })
  } catch (e) {
    console.error('Erro GET histórico:', e)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}


