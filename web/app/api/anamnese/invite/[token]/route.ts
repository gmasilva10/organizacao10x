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
    const supabase = await createClient()

    // Buscar convite pelo token
    const { data: invite, error: inviteError } = await supabase
      .from('anamnese_invites')
      .select(`
        id,
        token,
        student_id,
        service_id,
        status,
        expires_at,
        sent_at,
        opened_at,
        phone,
        students!inner(name)
      `)
      .eq('token', token)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Convite não encontrado ou expirado' },
        { status: 404 }
      )
    }

    // Verificar se o convite expirou
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)
    
    if (now > expiresAt) {
      // Atualizar status para expirado
      await supabase
        .from('anamnese_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id)

      return NextResponse.json(
        { error: 'Convite expirado' },
        { status: 410 }
      )
    }

    // Se ainda não foi aberto, marcar como aberto
    if (invite.status === 'sent') {
      await supabase
        .from('anamnese_invites')
        .update({ 
          status: 'opened',
          opened_at: new Date().toISOString()
        })
        .eq('id', invite.id)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: invite.id,
        student_id: invite.student_id,
        service_id: invite.service_id,
        status: invite.status,
        expires_at: invite.expires_at,
        student_name: invite.students?.name,
        phone: invite.phone
      },
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
