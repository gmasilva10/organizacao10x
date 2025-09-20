import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { processAnamnese } from '@/lib/anamnese/engine'
import { generatePdfHash } from '@/lib/anamnese/tokens'

// Forçar Node runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const correlationId = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}-anamnese-submit`
  
  try {
    const supabase = await createClient()

    // Buscar convite pelo token
    const { data: invite, error: inviteError } = await supabase
      .from('anamnese_invites')
      .select(`
        id,
        student_id,
        service_id,
        status,
        expires_at,
        tenant_id,
        students!inner(name)
      `)
      .eq('token', token)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Convite não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o convite ainda é válido
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)
    
    if (now > expiresAt || invite.status === 'submitted') {
      return NextResponse.json(
        { error: 'Convite expirado ou já utilizado' },
        { status: 410 }
      )
    }

    const body = await request.json()
    const responses = body

    // Processar anamnese com o motor existente
    let calculatedData = null
    try {
      const anamneseInput = {
        age: responses.age,
        weight: responses.weight,
        height: responses.height / 100, // Converter cm para m
        gender: responses.gender,
        fcr: responses.fcr,
        pse: responses.pse,
        vvo2: responses.vvo2,
        mfel: responses.mfel,
        rir: responses.rir,
        contraindications: responses.contraindications || [],
        observations: responses.observations || [],
        goals: responses.goals || []
      }

      calculatedData = processAnamnese(anamneseInput)
    } catch (calcError) {
      console.warn('Erro no cálculo da anamnese:', calcError)
    }

    // Gerar hash para rastreabilidade
    const pdfHash = generatePdfHash({
      studentId: invite.student_id,
      submittedAt: new Date().toISOString(),
      responses: responses
    })

    // Salvar resposta
    const { data: response, error: responseError } = await supabase
      .from('anamnese_responses')
      .insert({
        invite_id: invite.id,
        student_id: invite.student_id,
        service_id: invite.service_id,
        responses: responses,
        calculated_data: calculatedData,
        pdf_hash: pdfHash,
        status: 'submitted',
        tenant_id: invite.tenant_id
      })
      .select()
      .single()

    if (responseError) {
      console.error('Erro ao salvar resposta:', responseError)
      return NextResponse.json(
        { error: 'Erro ao salvar anamnese' },
        { status: 500 }
      )
    }

    // Atualizar convite como submetido
    await supabase
      .from('anamnese_invites')
      .update({ 
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', invite.id)

    // Criar ocorrência de anamnese respondida
    await supabase
      .from('occurrences')
      .insert({
        student_id: invite.student_id,
        type: 'anamnese_completed',
        title: 'Anamnese respondida',
        description: `Anamnese respondida por ${invite.students?.name} via formulário público`,
        status: 'open',
        tenant_id: invite.tenant_id
      })

    // TODO: Gerar PDF e anexar (implementar em seguida)
    // Por enquanto, apenas retornar sucesso

    return NextResponse.json({
      success: true,
      data: {
        responseId: response.id,
        studentName: invite.students?.name,
        pdfHash,
        calculatedData
      },
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
