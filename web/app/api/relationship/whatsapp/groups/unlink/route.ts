import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { studentId, groupId } = await request.json()
    if (!studentId || !groupId) return NextResponse.json({ error: 'studentId e groupId são obrigatórios' }, { status: 400 })

    const { error } = await supabase
      .from('student_whatsapp_groups')
      .delete()
      .eq('org_id', (user.user_metadata as any)?.tenant_id)
      .eq('student_id', studentId)
      .eq('group_id', groupId)
    if (error) return NextResponse.json({ error: 'Falha ao desvincular' }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Erro unlink grupo:', e)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}



