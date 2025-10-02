import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const correlationId = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}-wa-history`
  try {
    const payload = await req.json().catch(() => ({})) as any
    const {
      studentId,
      action = 'wa_share_clicked',
      target_type, // 'CONTACT' | 'GROUP'
      target_wa_id = null,
      target_name = null,
      target_phone_e164 = null,
      message_preview = null,
      correlationId: externalCorrelationId = null
    } = payload || {}

    if (!studentId) {
      return NextResponse.json({ error: 'studentId é obrigatório' }, { status: 400 })
    }
    if (!target_type || !['CONTACT','GROUP'].includes(String(target_type))) {
      return NextResponse.json({ error: 'target_type inválido' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { createAdminClient } = await import('@/utils/supabase/admin')
    const admin = createAdminClient()

    // obter tenant do aluno
    const { data: student, error: stuErr } = await admin
      .from('students')
      .select('id, tenant_id')
      .eq('id', studentId)
      .single()
    if (stuErr || !student) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
    }

    const { error: insErr } = await admin
      .from('relationship_whatsapp_history')
      .insert({
        tenant_id: student.tenant_id,
        student_id: studentId,
        action,
        target_type,
        target_wa_id,
        target_name,
        target_phone_e164,
        message_preview,
        correlation_id: externalCorrelationId || correlationId,
        created_by: user.id
      })

    if (insErr) {
      console.error('Erro ao registrar histórico WhatsApp:', insErr)
      return NextResponse.json({ error: 'Erro ao registrar histórico' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, correlationId })
  } catch (e) {
    console.error('Erro interno WhatsApp history:', e)
    return NextResponse.json({ error: 'Erro interno', correlationId }, { status: 500 })
  }
}


