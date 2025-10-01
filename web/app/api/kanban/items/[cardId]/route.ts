import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// DELETE - Excluir card do Onboarding/Kanban (não Serviços)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { cardId } = params
    if (!cardId) return NextResponse.json({ error: 'ID do card é obrigatório' }, { status: 400 })

    // Descobrir tenant/org do usuário
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()
    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Usuário não pertence a uma organização' }, { status: 403 })
    }

    // Validar existência do card e se pertence à org
    const { data: card, error: cardErr } = await supabase
      .from('kanban_items')
      .select('id, org_id, student_id')
      .eq('id', cardId)
      .single()
    if (cardErr || !card) {
      return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 })
    }
    if (card.org_id !== membership.tenant_id) {
      return NextResponse.json({ error: 'Operação não permitida' }, { status: 403 })
    }

    // Exclusão
    const { error: delErr } = await supabase
      .from('kanban_items')
      .delete()
      .eq('id', cardId)
      .eq('org_id', membership.tenant_id)
    if (delErr) {
      console.error('Erro ao excluir card:', delErr)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Log
    try {
      await supabase
        .from('kanban_logs')
        .insert({
          org_id: membership.tenant_id,
          user_id: user.id,
          action: 'card_deleted',
          entity_type: 'kanban_item',
          entity_id: cardId,
          payload: { card_id: cardId, student_id: card.student_id }
        })
    } catch {}

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}


