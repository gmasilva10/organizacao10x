import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateAnamnesePDF } from '@/lib/anamnese/pdf-generator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const correlationId = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}-anamnese-submit`
  
  try {
    const payload = await request.json()
    console.log(`🔍 [ANAMNESE SUBMIT] Token: ${token}, Payload:`, payload)

    // Usar admin client para bypass RLS
    const { createAdminClient } = await import('@/utils/supabase/admin')
    const admin = createAdminClient()

    // Buscar convite pelo token
    const { data: invite, error: inviteError } = await admin
      .from('anamnese_invites')
      .select(`
        id,
        token,
        student_id,
        service_id,
        status,
        expires_at,
        tenant_id
      `)
      .eq('token', token)
      .maybeSingle()

    if (inviteError || !invite) {
      console.log(`❌ [ANAMNESE SUBMIT] Convite não encontrado:`, inviteError)
      return NextResponse.json(
        { error: 'Convite não encontrado ou expirado' },
        { status: 404 }
      )
    }

    // Verificar se expirou
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Convite expirado' },
        { status: 410 }
      )
    }

    // Atualizar status do convite para concluído
    await admin
      .from('anamnese_invites')
      .update({ 
        status: 'submitted',
        updated_at: new Date().toISOString()
      })
      .eq('id', invite.id)

    // Buscar versão da anamnese e nome do aluno
    const { data: version } = await admin
      .from('anamnese_versions')
      .select('id')
      .eq('token', token)
      .maybeSingle()

    // Buscar nome do aluno
    const { data: student } = await admin
      .from('students')
      .select('name')
      .eq('id', invite.student_id)
      .maybeSingle()

    const studentName = student?.name || 'Aluno'

    if (version) {
      // Atualizar status da versão para concluído
      await admin
        .from('anamnese_versions')
        .update({ 
          status: 'CONCLUIDO',
          updated_at: new Date().toISOString()
        })
        .eq('id', version.id)

      // Salvar respostas em anamnese_responses
      const { error: responseError } = await admin
        .from('anamnese_responses')
        .insert({
          anamnese_version_id: version.id,
          student_id: invite.student_id,
          tenant_id: invite.tenant_id,
          responses: payload
        })

      if (responseError) {
        console.error('Erro ao salvar respostas:', responseError)
        return NextResponse.json(
          { error: 'Erro ao salvar respostas da anamnese' },
          { status: 500 }
        )
      }

      console.log(`✅ [ANAMNESE SUBMIT] Respostas salvas com sucesso`)

      // Sincronizar também em anamnese_answers para edição interna
      try {
        const entries = Object.entries(payload || {})
        if (entries.length > 0) {
          // Limpa respostas anteriores desta versão
          await admin.from('anamnese_answers').delete().eq('anamnese_version_id', version.id)
          const rows = entries.map(([key, value]) => ({
            tenant_id: invite.tenant_id,
            anamnese_version_id: version.id,
            key,
            value,
            answered_at: new Date().toISOString(),
            answered_by: invite.student_id
          }))
          if (rows.length > 0) await admin.from('anamnese_answers').insert(rows)
        }
      } catch (syncErr) {
        console.error('Erro ao sincronizar anamnese_answers:', syncErr)
      }

      // Gerar PDF
      try {
        console.log(`🔄 [ANAMNESE SUBMIT] Gerando PDF...`)
        const pdfBuffer = await generateAnamnesePDF(payload, studentName || 'Aluno')
        
        // Upload do PDF para storage
        const fileName = `anamnese_${studentName?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
        const { data: uploadData, error: uploadError } = await admin.storage
          .from('anexos')
          .upload(`students/${invite.student_id}/anamnese/${fileName}`, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
          })

        if (uploadError) {
          console.error('Erro ao fazer upload do PDF:', uploadError)
        } else {
          console.log(`✅ [ANAMNESE SUBMIT] PDF gerado e anexado: ${fileName}`)
          
          // Criar registro na tabela de anexos
          const { error: anexoError } = await admin
            .from('anexos')
            .insert({
              student_id: invite.student_id,
              tenant_id: invite.tenant_id,
              tipo: 'ANAMNESE',
              nome_arquivo: fileName,
              caminho_arquivo: uploadData.path,
              tamanho_bytes: pdfBuffer.length,
              mime_type: 'application/pdf',
              created_by: 'system',
              metadata: {
                anamnese_version_id: version.id,
                answers_count: Object.keys(payload || {}).length
              }
            })

          if (anexoError) {
            console.error('Erro ao registrar anexo:', anexoError)
          } else {
            console.log(`✅ [ANAMNESE SUBMIT] Anexo registrado na tabela`)
          }
        }
      } catch (pdfError) {
        console.error('Erro ao gerar PDF:', pdfError)
        // Não falhar a submissão por erro de PDF
      }
    }

    // Criar ocorrência no aluno (temporariamente desativado até ajustar owner_user_id)
    /*try {
      console.log(`🔄 [ANAMNESE SUBMIT] Criando ocorrência...`)
      
      // Buscar grupo e tipo de ocorrência apropriados
      const { data: occurrenceGroup } = await admin
        .from('occurrence_groups')
        .select('id')
        .eq('name', 'Saúde')
        .eq('org_id', 'fb381d42-9cf8-41d9-b0ab-fdb706a85ae7') // Tenant fixo por enquanto
        .maybeSingle()

      const { data: occurrenceType } = await admin
        .from('occurrence_types')
        .select('id')
        .eq('name', 'Anamnese Respondida')
        .eq('group_id', occurrenceGroup?.id)
        .eq('org_id', 'fb381d42-9cf8-41d9-b0ab-fdb706a85ae7') // Tenant fixo por enquanto
        .maybeSingle()

      if (occurrenceGroup && occurrenceType) {
        const { error: ocorrenciaError } = await admin
          .from('student_occurrences')
          .insert({
            student_id: invite.student_id,
            tenant_id: invite.tenant_id,
            group_id: occurrenceGroup.id,
            type_id: occurrenceType.id,
            occurred_at: new Date().toISOString().split('T')[0],
            notes: `O aluno ${studentName} respondeu à anamnese via formulário público. Todas as respostas foram salvas e o PDF foi gerado automaticamente.`,
            owner_user_id: invite.student_id, // Usar student_id como fallback
            status: 'DONE',
            priority: 'medium',
            resolved_at: new Date().toISOString(),
            resolved_by: invite.student_id,
            resolution_outcome: 'resolved',
            resolution_notes: 'Anamnese respondida e processada automaticamente'
          })

        if (ocorrenciaError) {
          console.error('Erro ao criar ocorrência:', ocorrenciaError)
        } else {
          console.log(`✅ [ANAMNESE SUBMIT] Ocorrência criada com sucesso`)
        }
      } else {
        console.log(`⚠️ [ANAMNESE SUBMIT] Grupo ou tipo de ocorrência não encontrado, pulando criação`)
      }
    } catch (ocorrenciaError) {
      console.error('Erro ao criar ocorrência:', ocorrenciaError)
      // Não falhar a submissão por erro de ocorrência
    }*/

    console.log(`✅ [ANAMNESE SUBMIT] Anamnese submetida com sucesso`)

    return NextResponse.json({
      success: true,
      message: 'Anamnese enviada com sucesso!',
      correlationId
    })

  } catch (error) {
    console.error('Erro ao submeter anamnese:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        correlationId 
      },
      { status: 500 }
    )
  }
}