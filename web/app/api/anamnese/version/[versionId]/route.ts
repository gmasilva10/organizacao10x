import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { versionId: string } }
) {
  const { versionId } = params
  const correlationId = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}-anamnese-version`

  try {
    const supabase = await createClient()
    const { createAdminClient } = await import('@/utils/supabase/admin')
    const admin = createAdminClient()

    // Buscar versão da anamnese
    const { data: version, error: versionError } = await admin
      .from('anamnese_versions')
      .select(`
        id,
        code,
        status,
        service_id,
        token,
        token_expires_at,
        created_at
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

    // Buscar perguntas da versão
    const { data: questions, error: questionsError } = await admin
      .from('anamnese_questions_snapshot')
      .select('*')
      .eq('anamnese_version_id', versionId)
      .order('ord')

    if (questionsError) {
      console.error('Erro ao buscar perguntas:', questionsError)
      return NextResponse.json(
        { error: 'Erro ao buscar perguntas' },
        { status: 500 }
      )
    }

    // Buscar respostas da versão
    const { data: answers, error: answersError } = await admin
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

    // Formatar respostas
    const formattedAnswers = answers?.reduce((acc, answer) => {
      acc[answer.key] = answer.value
      return acc
    }, {} as Record<string, any>) || {}

    console.log(`✅ [ANAMNESE VERSION] Versão ${version.code} carregada`)

    return NextResponse.json({
      success: true,
      version: {
        id: version.id,
        code: version.code,
        status: version.status,
        service_id: version.service_id,
        token: version.token,
        token_expires_at: version.token_expires_at,
        created_at: version.created_at,
        updated_at: null,
        service_name: null,
        questions: questions || [],
        answers: formattedAnswers
      },
      correlationId
    })
  } catch (error) {
    console.error('Erro interno ao buscar versão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', correlationId },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { versionId: string } }
) {
  const { versionId } = params
  const correlationId = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}-anamnese-version-update`

  try {
    const payload = await request.json()
    const supabase = await createClient()

    // Atualizar versão
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (payload.status) {
      updateData.status = payload.status
    }

    const { error: versionError } = await supabase
      .from('anamnese_versions')
      .update(updateData)
      .eq('id', versionId)

    if (versionError) {
      console.error('Erro ao atualizar versão:', versionError)
      return NextResponse.json(
        { error: 'Erro ao atualizar versão' },
        { status: 500 }
      )
    }

    // Atualizar respostas se fornecidas
    if (payload.answers) {
      // Deletar respostas existentes
      await supabase
        .from('anamnese_answers')
        .delete()
        .eq('anamnese_version_id', versionId)

      // Inserir novas respostas
      const answersData = Object.entries(payload.answers).map(([key, value]) => ({
        anamnese_version_id: versionId,
        key,
        value,
        answered_at: new Date().toISOString(),
        answered_by: 'user' // TODO: Pegar do contexto de auth
      }))

      if (answersData.length > 0) {
        const { error: answersError } = await supabase
          .from('anamnese_answers')
          .insert(answersData)

        if (answersError) {
          console.error('Erro ao salvar respostas:', answersError)
          return NextResponse.json(
            { error: 'Erro ao salvar respostas' },
            { status: 500 }
          )
        }
      }
    }

    console.log(`✅ [ANAMNESE VERSION UPDATE] Versão ${versionId} atualizada`)

    return NextResponse.json({
      success: true,
      correlationId
    })
  } catch (error) {
    console.error('Erro interno ao atualizar versão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', correlationId },
      { status: 500 }
    )
  }
}