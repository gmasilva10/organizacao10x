import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateAnamneseToken } from '@/lib/anamnese/tokens'

// Forçar Node runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Função para normalizar telefone E.164
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('55')) {
    return `+${cleaned}`
  } else if (cleaned.startsWith('11')) {
    return `+55${cleaned}`
  } else {
    return `+5511${cleaned}`
  }
}

// Função para gerar mensagem WhatsApp
function generateWhatsAppMessage(studentName: string, anamneseUrl: string): string {
  return `Olá, ${studentName}! Sou da Personal Global.

Para personalizarmos seu treino, responda sua Anamnese neste link:
${anamneseUrl}

Leva ~7–10 min. Qualquer dúvida, nos chame aqui. Obrigado!`
}

export async function POST(request: NextRequest) {
  const correlationId = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}-anamnese-invite`
  
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { studentId, serviceId, phone } = body

    // Validação de parâmetros obrigatórios
    if (!studentId || !phone) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: studentId, phone' },
        { status: 400 }
      )
    }

    // Buscar dados do aluno
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, tenant_id')
      .eq('id', studentId)
      .eq('tenant_id', user.user_metadata?.tenant_id)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Aluno não encontrado' },
        { status: 404 }
      )
    }

    // Normalizar telefone
    const normalizedPhone = normalizePhone(phone)
    
    // Gerar token único
    const token = generateAnamneseToken()
    
    // URL pública do formulário
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const anamneseUrl = `${baseUrl}/p/anamnese/${token}`

    // Criar convite
    const { data: invite, error: inviteError } = await supabase
      .from('anamnese_invites')
      .insert({
        token,
        student_id: studentId,
        service_id: serviceId || null,
        phone: normalizedPhone,
        tenant_id: student.tenant_id
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Erro ao criar convite:', inviteError)
      return NextResponse.json(
        { error: 'Erro ao criar convite de anamnese' },
        { status: 500 }
      )
    }

    // Gerar mensagem WhatsApp
    const message = generateWhatsAppMessage(student.name, anamneseUrl)

    // Enviar via WhatsApp (usando a nova API interna)
    try {
      const waResponse = await fetch(`${baseUrl}/api/wa/send-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          template: message,
          instance: process.env.NEXT_PUBLIC_ZAPI_INSTANCE,
          token: process.env.NEXT_PUBLIC_ZAPI_TOKEN
        })
      })

      if (!waResponse.ok) {
        console.warn('Erro ao enviar WhatsApp, mas convite criado:', await waResponse.text())
      }
    } catch (waError) {
      console.warn('Erro ao enviar WhatsApp, mas convite criado:', waError)
    }

    // Atualizar convite com mensagem enviada
    await supabase
      .from('anamnese_invites')
      .update({ 
        message_sent: message,
        status: 'sent'
      })
      .eq('id', invite.id)

    // Criar ocorrência de anamnese enviada
    await supabase
      .from('occurrences')
      .insert({
        student_id: studentId,
        type: 'anamnese_sent',
        title: 'Anamnese enviada',
        description: `Convite de anamnese enviado para ${student.name} via WhatsApp`,
        status: 'open',
        tenant_id: student.tenant_id
      })

    return NextResponse.json({
      success: true,
      data: {
        inviteId: invite.id,
        token,
        anamneseUrl,
        phone: normalizedPhone,
        expiresAt: invite.expires_at
      },
      correlationId
    })

  } catch (error) {
    console.error('Erro na API de convite de anamnese:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        correlationId 
      },
      { status: 500 }
    )
  }
}
