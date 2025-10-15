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
        org_id
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
          org_id: invite.org_id,
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
            org_id: invite.org_id,
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
              org_id: invite.org_id,
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

    // Criar ocorrência no módulo de ocorrências
    try {
      console.log(`🔄 [ANAMNESE SUBMIT] Criando ocorrência de anamnese...`)
      
      // Buscar professional responsável pelo aluno
      const { data: responsible } = await admin
        .from('student_responsibles')
        .select('professional_id, professionals(user_id)')
        .eq('student_id', invite.student_id)
        .limit(1)
        .maybeSingle()

      const ownerUserId = responsible?.professionals?.user_id

      if (ownerUserId) {
        // Buscar grupo "Saúde"
        const { data: healthGroup } = await admin
          .from('occurrence_groups')
          .select('id')
          .eq('name', 'Saúde')
          .eq('org_id', invite.org_id)
          .maybeSingle()

        // Buscar tipo "Anamnese Respondida"
        const { data: occType } = await admin
          .from('occurrence_types')
          .select('id')
          .ilike('name', '%anamnese%')
          .eq('org_id', invite.org_id)
          .limit(1)
          .maybeSingle()

        if (healthGroup && occType) {
          // Criar ocorrência
          const { error: occError } = await admin
            .from('student_occurrences')
            .insert({
              student_id: invite.student_id,
              group_id: healthGroup.id,
              type_id: occType.id,
              occurred_at: new Date().toISOString().split('T')[0],
              notes: `Anamnese ${version?.code || ''} respondida com sucesso. PDF disponível em: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/p/anamnese/${token}`,
              owner_user_id: ownerUserId,
              status: 'DONE',
              priority: 'medium',
              org_id: invite.org_id
            })

          if (occError) {
            console.error('Erro ao criar ocorrência:', occError)
          } else {
            console.log(`✅ [ANAMNESE SUBMIT] Ocorrência criada com sucesso`)
          }
        } else {
          console.log(`⚠️ [ANAMNESE SUBMIT] Grupo/tipo de ocorrência não encontrado`)
        }
      } else {
        console.log(`⚠️ [ANAMNESE SUBMIT] Professional responsável não encontrado`)
      }
    } catch (occurrenceError) {
      console.error('Erro ao criar ocorrência:', occurrenceError)
      // Não falhar a submissão por erro de ocorrência
    }

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