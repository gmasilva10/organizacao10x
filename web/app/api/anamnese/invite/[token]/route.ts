import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Forçar Node runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const correlationId = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}-anamnese-invite-get`
  
  try {
    console.log(`🔍 [ANAMNESE INVITE] Buscando token: ${token}`)
    
    // Em página pública não há JWT; para evitar 404 por RLS, usar admin
    const { createAdminClient } = await import('@/utils/supabase/admin')
    const admin = createAdminClient()

    // Buscar convite pelo token
    // 1) Buscar somente o convite (sem join) para evitar erro de relacionamento
    const { data: invite, error: inviteError } = await admin
      .from('anamnese_invites')
      .select(`
        id,
        token,
        student_id,
        service_id,
        status,
        expires_at,
        phone,
        message_sent,
        created_at
      `)
      .eq('token', token)
      .maybeSingle()

    console.log(`🔍 [ANAMNESE INVITE] Resultado da busca:`, { invite, inviteError })

    if (inviteError || !invite) {
      console.log(`❌ [ANAMNESE INVITE] Convite não encontrado. Erro:`, inviteError)
      return NextResponse.json(
        { error: 'Convite não encontrado ou expirado' },
        { status: 404 }
      )
    }

    // 2) Buscar nome do aluno separadamente (robusto mesmo sem FK declarada)
    let studentName: string | null = null
    if (invite.student_id) {
      const { data: studentRow } = await admin
        .from('students')
        .select('name')
        .eq('id', invite.student_id)
        .maybeSingle()
      studentName = studentRow?.name ?? null
    }

    // Verificar se o convite expirou
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)
    
    if (now > expiresAt) {
      // Atualizar status para expirado
      await admin
        .from('anamnese_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id)

      return NextResponse.json(
        { error: 'Convite expirado' },
        { status: 410 }
      )
    }

    // Se ainda não foi aberto, marcar como aberto
    if (invite.status === 'sent' || invite.status === 'draft') {
      await admin
        .from('anamnese_invites')
        .update({ 
          status: 'opened',
          updated_at: new Date().toISOString()
        })
        .eq('id', invite.id)
    }

    // Responder no formato esperado pela página pública (campos no topo)
    return NextResponse.json({
      id: invite.id,
      student_id: invite.student_id,
      service_id: invite.service_id,
      status: invite.status,
      expires_at: invite.expires_at,
      student_name: studentName,
      phone: invite.phone,
      correlationId
    })

  } catch (error) {
    console.error('Erro ao buscar convite:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        correlationId 
      },
      { status: 500 }
    )
  }
}
