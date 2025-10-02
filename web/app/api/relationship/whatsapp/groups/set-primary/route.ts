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

    const tenantId = (user.user_metadata as any)?.tenant_id
    await supabase
      .from('student_whatsapp_groups')
      .update({ is_primary: false })
      .eq('org_id', tenantId)
      .eq('student_id', studentId)

    const { error } = await supabase
      .from('student_whatsapp_groups')
      .update({ is_primary: true })
      .eq('org_id', tenantId)
      .eq('student_id', studentId)
      .eq('group_id', groupId)
    if (error) return NextResponse.json({ error: 'Falha ao definir padrão' }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Erro set-primary:', e)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}



