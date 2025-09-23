import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { versionId: string } }
) {
  const { versionId } = params
  const correlationId = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}-anamnese-send`

  try {
    const supabase = await createClient()

    // Buscar versão da anamnese
    const { data: version, error: versionError } = await supabase
      .from('anamnese_versions')
      .select(`
        id,
        code,
        status,
        student_id,
        tenant_id,
        token,
        token_expires_at,
        students!anamnese_versions_student_id_fkey (
          name,
          phone
        )
      `)
      .eq('id', versionId)
      .maybeSingle()

    if (versionError || !version) {
      console.error('Erro ao buscar versão:', versionError)
      return NextResponse.json(
        { error: 'Versão não encontrada' },
        { status: 404 }
      )
    }

    if (version.status !== 'RASCUHO') {
      return NextResponse.json(
        { error: 'Apenas anamneses em rascunho podem ser enviadas' },
        { status: 400 }
      )
    }

    // Atualizar status para ENVIADO
    const { error: updateError } = await supabase
      .from('anamnese_versions')
      .update({
        status: 'ENVIADO',
        updated_at: new Date().toISOString()
      })
      .eq('id', versionId)

    if (updateError) {
      console.error('Erro ao atualizar status:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar status' },
        { status: 500 }
      )
    }

    // TODO: Implementar envio via WhatsApp
    // Por enquanto, apenas simular o envio
    console.log(`📱 [ANAMNESE SEND] Simulando envio para ${version.students?.name}`)
    console.log(`📱 [ANAMNESE SEND] Token: ${version.token}`)
    console.log(`📱 [ANAMNESE SEND] Telefone: ${version.students?.phone}`)

    // Criar registro no histórico de relacionamento
    const { error: historyError } = await supabase
      .from('relacionamento_messages')
      .insert({
        student_id: version.student_id,
        tenant_id: version.tenant_id,
        channel: 'whatsapp',
        direction: 'outbound',
        to_text: version.students?.phone || '',
        template_id: 'anamnese_invite',
        status: 'sent',
        payload: {
          anamnese_version_id: versionId,
          token: version.token,
          student_name: version.students?.name
        },
        created_by: 'system'
      })

    if (historyError) {
      console.error('Erro ao criar histórico:', historyError)
      // Não falhar o envio por erro de histórico
    }

    console.log(`✅ [ANAMNESE SEND] Anamnese ${version.code} enviada com sucesso`)

    return NextResponse.json({
      success: true,
      message: 'Anamnese enviada com sucesso',
      correlationId
    })
  } catch (error) {
    console.error('Erro interno ao enviar anamnese:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', correlationId },
      { status: 500 }
    )
  }
}