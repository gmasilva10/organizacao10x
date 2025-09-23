import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateAnamnesePDF } from '@/lib/anamnese/pdf-generator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { versionId: string } }
) {
  const { versionId } = params
  const correlationId = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}-anamnese-pdf`

  try {
    const supabase = await createClient()

    // Buscar versão da anamnese com respostas
    const { data: version, error: versionError } = await supabase
      .from('anamnese_versions')
      .select(`
        id,
        code,
        status,
        student_id,
        tenant_id,
        students!anamnese_versions_student_id_fkey (
          name
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

    // Buscar respostas
    const { data: answers, error: answersError } = await supabase
      .from('anamnese_answers')
      .select('key, value')
      .eq('anamnese_version_id', versionId)

    if (answersError) {
      console.error('Erro ao buscar respostas:', answersError)
      return NextResponse.json(
        { error: 'Erro ao buscar respostas' },
        { status: 500 }
      )
    }

    // Formatar respostas para o PDF
    const formData = answers?.reduce((acc, answer) => {
      acc[answer.key] = answer.value
      return acc
    }, {} as Record<string, any>) || {}

    const studentName = version.students?.name || 'Aluno'

    // Gerar PDF
    try {
      console.log(`🔄 [ANAMNESE PDF] Gerando PDF para ${studentName}...`)
      const pdfBuffer = await generateAnamnesePDF(formData, studentName)
      
      // Upload do PDF para storage
      const fileName = `anamnese_${studentName?.replace(/\s+/g, '_')}_${version.code}_${new Date().toISOString().split('T')[0]}.pdf`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('anexos')
        .upload(`students/${version.student_id}/anamnese/${fileName}`, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        })

      if (uploadError) {
        console.error('Erro ao fazer upload do PDF:', uploadError)
        return NextResponse.json(
          { error: 'Erro ao fazer upload do PDF' },
          { status: 500 }
        )
      }

      // Criar registro na tabela de anexos
      const { error: anexoError } = await supabase
        .from('anexos')
        .insert({
          student_id: version.student_id,
          tenant_id: version.tenant_id,
          tipo: 'ANAMNESE',
          nome_arquivo: fileName,
          caminho_arquivo: uploadData.path,
          tamanho_bytes: pdfBuffer.length,
          mime_type: 'application/pdf',
          created_by: 'system',
          metadata: {
            anamnese_version_id: versionId,
            anamnese_code: version.code
          }
        })

      if (anexoError) {
        console.error('Erro ao registrar anexo:', anexoError)
        return NextResponse.json(
          { error: 'Erro ao registrar anexo' },
          { status: 500 }
        )
      }

      console.log(`✅ [ANAMNESE PDF] PDF gerado e anexado: ${fileName}`)

      return NextResponse.json({
        success: true,
        message: 'PDF gerado com sucesso',
        fileName,
        correlationId
      })
    } catch (pdfError) {
      console.error('Erro ao gerar PDF:', pdfError)
      return NextResponse.json(
        { error: 'Erro ao gerar PDF' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro interno ao gerar PDF:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', correlationId },
      { status: 500 }
    )
  }
}