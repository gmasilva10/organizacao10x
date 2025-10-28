import { NextRequest, NextResponse } from 'next/server'

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] API Kanban Complete Full - Iniciando requisição')

    const { cardId } = await request.json()
    
    console.log('🔍 [DEBUG] API Kanban Complete Full - Request:', {
      cardId,
      hasCardId: !!cardId,
      cardIdType: typeof cardId
    })
    
    if (!cardId) {
      return NextResponse.json({ error: 'Card ID é obrigatório' }, { status: 400 })
    }

    // Importar Supabase client de forma dinâmica para evitar problemas
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = await createClient()
    console.log('🔍 [DEBUG] API Kanban Complete Full - Supabase client criado')

    // Verificar autenticação (opcional em dev)
    const { data: { user } } = await supabase.auth.getUser()
    console.log('🔍 [DEBUG] API Kanban Complete Full - User:', user?.id || 'anonymous')

    // Buscar informações do card
    const { data: card, error: cardError } = await supabase
      .from('kanban_items')
      .select(`
        id, 
        org_id, 
        student_id, 
        stage_id,
        title,
        created_at,
        kanban_stages!inner(id, name, position, stage_code)
      `)
      .eq('id', cardId)
      .single()

    console.log('🔍 [DEBUG] API Kanban Complete Full - Card encontrado:', {
      found: !!card,
      error: cardError?.message,
      cardData: card ? { id: card.id, title: card.title } : null
    })

    if (cardError || !card) {
      console.error('❌ [DEBUG] API Kanban Complete Full - Card não encontrado:', cardError?.message)
      return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 })
    }

    // Verificar se está na coluna de entrega
    const stageInfo: any = Array.isArray((card as any).kanban_stages)
      ? (card as any).kanban_stages[0]
      : (card as any).kanban_stages
    
    console.log('🔍 [DEBUG] API Kanban Complete Full - Stage info:', {
      position: stageInfo?.position,
      name: stageInfo?.name,
      stageCode: stageInfo?.stage_code
    })
    
    if (stageInfo?.position !== 99 && !(stageInfo?.name || '').toLowerCase().includes('entrega')) {
      return NextResponse.json({ error: 'Só é possível encerrar cards na coluna de entrega' }, { status: 403 })
    }

    // Verificar se todas as tarefas obrigatórias estão concluídas
    const { data: requiredTasks, error: tasksError } = await supabase
      .from('card_tasks')
      .select(`
        status,
        service_onboarding_tasks!inner(is_required)
      `)
      .eq('card_id', cardId)
      .eq('service_onboarding_tasks.is_required', true)

    if (tasksError) {
      console.error('Erro ao verificar tarefas:', tasksError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    const incompleteRequired = requiredTasks?.some((task: any) => task.status !== 'completed')
    if (incompleteRequired) {
      return NextResponse.json({ error: 'Todas as tarefas obrigatórias devem estar concluídas' }, { status: 400 })
    }

    // ===== COLETAR DADOS PARA HISTÓRICO =====
    
    // 1. Buscar histórico de logs para construir path_taken
    const { data: logs } = await supabase
      .from('kanban_logs')
      .select(`
        id,
        action,
        stage_id,
        created_at,
        payload,
        kanban_stages!inner(id, name, stage_code)
      `)
      .eq('card_id', cardId)
      .in('action', ['card_created', 'card_moved', 'stage_completed'])
      .order('created_at', { ascending: true })

    // Construir path_taken
    const pathTaken = logs?.map(log => ({
      stage_id: log.stage_id,
      stage_name: (log as any).kanban_stages.name,
      stage_code: (log as any).kanban_stages.stage_code,
      entered_at: log.created_at,
      action: log.action,
      tasks_completed: log.payload?.tasks_completed || []
    })) || []

    // 2. Buscar estágio inicial do card
    const { data: initialLog } = await supabase
      .from('kanban_logs')
      .select('stage_id')
      .eq('card_id', cardId)
      .eq('action', 'card_created')
      .single()

    // 3. Calcular métricas
    const totalDays = Math.ceil(
      (new Date().getTime() - new Date(card.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    const { data: tasks } = await supabase
      .from('card_tasks')
      .select('id')
      .eq('card_id', cardId)
      .eq('status', 'completed')

    const totalTasksCompleted = tasks?.length || 0

    // ===== INSERIR HISTÓRICO DE ONBOARDING =====
    
    // 4. Inserir em onboarding_history
    const { error: historyError } = await supabase
      .from('onboarding_history')
      .insert({
        org_id: card.org_id,
        student_id: card.student_id,
        kanban_item_id: cardId,
        completed_at: new Date().toISOString(),
        completed_by_user_id: user?.id || null,
        initial_stage_id: initialLog?.stage_id || card.stage_id,
        final_stage_id: card.stage_id,
        path_taken: pathTaken,
        total_days: totalDays,
        total_tasks_completed: totalTasksCompleted,
        metadata: {
          card_title: card.title,
          completion_notes: 'Onboarding concluído com sucesso',
          final_stage_name: stageInfo?.name
        }
      })

    if (historyError) {
      console.error('Erro ao criar histórico:', historyError)
      return NextResponse.json({ error: 'Erro ao salvar histórico de onboarding' }, { status: 500 })
    }

    // ===== ATUALIZAR CARD =====
    
    // 5. Atualizar kanban_items com status completed
    const { error: updateError } = await supabase
      .from('kanban_items')
      .update({ 
        completed_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', cardId)

    if (updateError) {
      console.error('Erro ao marcar card como concluído:', updateError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // ===== REGISTRAR LOG DE CONCLUSÃO =====
    
    // 6. Registrar log de conclusão
    try {
      await supabase
        .from('kanban_logs')
        .insert({
          org_id: card.org_id,
          card_id: cardId,
          stage_id: card.stage_id,
          action: 'card_archived',
          payload: {
            completed_by: user?.id || null,
            archived_to: 'history',
            total_days: totalDays,
            total_tasks: totalTasksCompleted,
            history_created: true
          },
          created_by: user?.id || null
        })
    } catch (logError) {
      console.error('Erro ao criar log:', logError)
      // Não falha a operação se o log falhar
    }

    console.log('✅ [DEBUG] API Kanban Complete Full - Onboarding concluído com sucesso')
    return NextResponse.json({ 
      success: true, 
      message: `Onboarding do aluno concluído com sucesso`
    })

  } catch (error) {
    console.error('❌ [DEBUG] API Kanban Complete Full - Erro inesperado:', error)
    return NextResponse.json({ 
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
