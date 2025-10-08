import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateAnamneseToken } from '@/lib/anamnese/tokens'

// Forçar Node runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Função para normalizar telefone E.164
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('55')) return `+${cleaned}`
  if (cleaned.startsWith('11')) return `+55${cleaned}`
  return `+5511${cleaned}`
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

    // Usaremos client admin para contornar variações de tenant_id no JWT durante o DEV
    const { createAdminClient } = await import('@/utils/supabase/admin')
    const admin = createAdminClient()

    const body = await request.json()
    const { studentId, serviceId, phone, destination = 'group', groupId = null, customMessage = null, generateOnly = false } = body || {}

    // Validação principal
    if (!studentId) {
      return NextResponse.json({ error: 'Parâmetro obrigatório: studentId' }, { status: 400 })
    }
    if (destination === 'student' && !phone) {
      return NextResponse.json({ error: 'Telefone é obrigatório para destino Aluno' }, { status: 400 })
    }
    if (destination === 'group' && !groupId) {
      // permitimos gerar sem grupo (gera rascunho) — mas para enviar é obrigatório
      if (!generateOnly) {
        return NextResponse.json({ error: 'groupId é obrigatório para enviar ao Grupo' }, { status: 400 })
      }
    }

    // Buscar aluno
    const { data: student, error: studentError } = await admin
      .from('students')
      .select('id, name, org_id, phone')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
    }

    // Determinar próxima sequência
    const { data: maxSeqData } = await admin
      .from('anamnese_versions')
      .select('seq')
      .eq('org_id', student.org_id)
      .eq('student_id', studentId)
      .order('seq', { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextSeq = (maxSeqData?.seq || 0) + 1
    const code = `ANM-${String(nextSeq).padStart(4, '0')}`

    // Token
    const token = generateAnamneseToken()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const anamneseUrl = `${baseUrl}/p/anamnese/${token}`

    // Criar versão RASCUNHO
    const status = generateOnly ? 'RASCUHO' : 'ENVIADO'
    const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-fA-F-]{36}$/.test(v)
    const { data: version, error: versionError } = await admin
      .from('anamnese_versions')
      .insert({
        org_id: student.org_id,
        student_id: studentId,
        seq: nextSeq,
        code,
        status,
        service_id: isUuid(serviceId) ? serviceId : null,
        token,
        token_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        created_by: user.id
      })
      .select('id')
      .single()

    if (versionError || !version) {
      console.error('Erro ao criar versão:', versionError)
      return NextResponse.json({ error: 'Erro ao criar versão da anamnese', details: versionError?.message }, { status: 500 })
    }

    // Snapshot mínimo (placeholder: será preenchido pelo motor atual quando abrir o editor)
    // Mantemos compatível: nenhuma pergunta obrigatória aqui

    // Criar convite (compat com fluxo público atual)
    // phone é NOT NULL na tabela; se não informado, usamos o phone do aluno
    const fallbackPhone = (student as any)?.phone ? String((student as any).phone) : ''
    const normalizedPhone = (phone ? normalizePhone(phone) : (fallbackPhone ? normalizePhone(fallbackPhone) : null))
    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Telefone ausente para o convite' }, { status: 400 })
    }
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
    const inviteStatus = generateOnly ? 'draft' : 'sent'
    const { data: invite, error: inviteError } = await admin
      .from('anamnese_invites')
      .insert({
        token,
        student_id: studentId,
        service_id: isUuid(serviceId) ? serviceId : null,
        phone: normalizedPhone,
        status: inviteStatus,
        expires_at: expiresAt,
        org_id: student.org_id
      })
      .select('id, expires_at')
      .single()

    if (inviteError) {
      console.error('Erro ao criar convite:', inviteError)
      return NextResponse.json({ error: 'Erro ao criar convite de anamnese', details: inviteError?.message }, { status: 500 })
    }

    // Envio via WhatsApp apenas se não for generateOnly
    let waOk = true
    let waErrorText: string | null = null
    if (!generateOnly) {
      try {
        const message = (customMessage && String(customMessage).trim().length > 0)
          ? String(customMessage)
          : generateWhatsAppMessage(student.name, anamneseUrl)

        if (destination === 'student' && normalizedPhone) {
          const waResponse = await fetch(`${baseUrl}/api/wa/send-template`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: normalizedPhone, template: message })
          })
          waOk = waResponse.ok
          if (!waOk) waErrorText = await waResponse.text().catch(() => null)
        } else if (destination === 'group' && groupId) {
          const waResponse = await fetch(`${baseUrl}/api/wa/send-template`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId, template: message })
          })
          waOk = waResponse.ok
          if (!waOk) waErrorText = await waResponse.text().catch(() => null)
        }

        // Log no relacionamento_messages
        await admin.from('relacionamento_messages').insert({
          org_id: student.org_id,
          student_id: studentId,
          channel: 'whatsapp',
          direction: 'outbound',
          to_text: destination === 'student' ? normalizedPhone : null,
          group_id: destination === 'group' ? groupId : null,
          template_id: 'anamnese_invite_v1',
          status: waOk ? 'sent' : 'failed',
          payload: { version_id: version.id, invite_id: invite.id, url: anamneseUrl }
        })
      } catch (waError) {
        console.warn('Erro ao enviar WhatsApp:', waError)
      }
    }

    // Atualizar convite com status
    await supabase
      .from('anamnese_invites')
      .update({ 
        message_sent: generateOnly ? null : 'template: anamnese_invite_v1',
        status: generateOnly ? 'draft' : 'sent'
      })
      .eq('id', invite.id)

    const responseBody = {
      success: true,
      data: {
        inviteId: invite.id,
        versionId: version.id,
        token,
        anamneseUrl,
        code,
        status,
        expiresAt: invite.expires_at
      },
      correlationId
    }

    if (!generateOnly && !waOk) {
      return NextResponse.json({
        error: 'Convite criado, mas envio via WhatsApp falhou',
        details: waErrorText ? waErrorText.substring(0, 300) : null,
        ...responseBody
      }, { status: 502 })
    }

    return NextResponse.json(responseBody)
  } catch (error) {
    console.error('Erro na API de convite de anamnese:', error)
    return NextResponse.json({ error: 'Erro interno do servidor', correlationId }, { status: 500 })
  }
}

