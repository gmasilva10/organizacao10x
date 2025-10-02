import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { studentId, externalId, name, isPrimary } = await request.json()
    if (!studentId || !externalId || !name) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios: studentId, externalId, name' }, { status: 400 })
    }

    // Upsert do grupo
    const { data: group, error: gErr } = await supabase
      .from('whatsapp_groups')
      .upsert({
        org_id: (user.user_metadata as any)?.org_id,
        external_id: externalId,
        name,
        platform: 'z-api',
        is_active: true,
        created_by: user.id,
      }, { onConflict: 'org_id,external_id' })
      .select('id')
      .single()
    if (gErr || !group) return NextResponse.json({ error: 'Falha ao criar grupo' }, { status: 500 })

    // Vincular ao aluno
    const { error: linkErr } = await supabase
      .from('student_whatsapp_groups')
      .upsert({
        org_id: (user.user_metadata as any)?.org_id,
        student_id: studentId,
        group_id: group.id,
        is_primary: !!isPrimary,
        active: true,
        created_by: user.id,
      }, { onConflict: 'org_id,student_id,group_id' })
    if (linkErr) return NextResponse.json({ error: 'Falha ao vincular grupo' }, { status: 500 })

    if (isPrimary) {
      await supabase
        .from('student_whatsapp_groups')
        .update({ is_primary: false })
        .eq('org_id', (user.user_metadata as any)?.org_id)
        .eq('student_id', studentId)
        .neq('group_id', group.id)
      await supabase
        .from('student_whatsapp_groups')
        .update({ is_primary: true })
        .eq('org_id', (user.user_metadata as any)?.org_id)
        .eq('student_id', studentId)
        .eq('group_id', group.id)
    }

    return NextResponse.json({ ok: true, groupId: group.id })
  } catch (e) {
    console.error('Erro link grupo:', e)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}



