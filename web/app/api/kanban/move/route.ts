import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  console.log('🔍 API /api/kanban/move POST chamada')
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.warn('⚠️ Auth falhou:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { cardId, fromColumnId, toColumnId } = body || {}
    console.log('📝 Payload recebido:', body)
    
    if (!cardId || !fromColumnId || !toColumnId) {
      console.warn('⚠️ Dados inválidos:', { cardId, fromColumnId, toColumnId })
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Buscar informações do card e colunas
    const { data: card, error: cardError } = await supabase
      .from('kanban_items')
      .select('id, org_id, student_id, stage_id')
      .eq('id', cardId)
      .single()

    if (cardError || !card) {
      console.error('❌ Card não encontrado:', { cardError, card })
      return NextResponse.json({ error: 'Card não encontrado', detail: cardError?.message }, { status: 404 })
    }
    console.log('✅ Card carregado:', card)

    const { data: fromStage, error: fromStageError } = await supabase
      .from('kanban_stages')
      .select('id, name, position, stage_code')
      .eq('id', fromColumnId)
      .single()

    if (fromStageError || !fromStage) {
      console.error('❌ fromStage não encontrado:', { fromColumnId, fromStageError, fromStage })
      return NextResponse.json({ error: 'Coluna origem não encontrada', detail: fromStageError?.message }, { status: 404 })
    }

    const { data: toStage, error: toStageError } = await supabase
      .from('kanban_stages')
      .select('id, name, position, stage_code')
      .eq('id', toColumnId)
      .single()

    if (toStageError || !toStage) {
      console.error('❌ toStage não encontrado:', { toColumnId, toStageError, toStage })
      return NextResponse.json({ error: 'Coluna destino não encontrada', detail: toStageError?.message }, { status: 404 })
    }

    console.log('✅ Stages carregados:', { fromStage, toStage })

    // Verificar se é uma coluna fixa (1 ou 99)
    // Removido: bloqueio de colunas fixas (1 e 99) — regra atual permite mover de qualquer coluna

    // Atualizar o card para a nova coluna
    const { error: updateError } = await supabase
      .from('kanban_items')
      .update({ stage_id: toColumnId })
      .eq('id', cardId)

    if (updateError) {
      console.error('❌ Erro ao atualizar card:', updateError)
      return NextResponse.json({ error: 'Erro interno', detail: updateError.message }, { status: 500 })
    }

    // O trigger trigger_instantiate_tasks_on_card_move já instancia automaticamente
    // as tarefas da nova coluna quando o card é movido

    // Log da movimentação
    try {
      await supabase
        .from('kanban_logs')
        .insert({
          org_id: card.org_id,
          card_id: cardId,
          stage_id: toColumnId,
          action: 'card_moved',
          payload: {
            from_column_id: fromColumnId,
            to_column_id: toColumnId,
            from_stage: fromStage.name,
            to_stage: toStage.name,
            from_position: fromStage.position,
            to_position: toStage.position,
            student_id: card.student_id,
            actor_id: user.id,
            timestamp: new Date().toISOString(),
            // added_templates será preenchido pelos logs de card_task_instantiated
            added_templates: []
          },
          created_by: user.id
        })
    } catch (logError) {
      console.error('⚠️ Erro ao criar log (ignorado):', logError)
      // Não falha a operação se o log falhar
    }

    console.log('✅ Card movido com sucesso:', { cardId, from: fromStage.id, to: toStage.id })
    return NextResponse.json({ 
      success: true, 
      message: `Card movido de "${fromStage.name}" para "${toStage.name}"`
    })

  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
