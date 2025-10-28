export async function POST(request: Request) {
  try {
    const { cardId } = await request.json()
    
    if (!cardId) {
      return Response.json({ error: 'Card ID é obrigatório' }, { status: 400 })
    }

    // Importar Supabase client de forma dinâmica
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = await createClient()

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

    if (cardError || !card) {
      return Response.json({ error: 'Card não encontrado' }, { status: 404 })
    }

    // Verificar se está na coluna de entrega
    const stageInfo: any = Array.isArray((card as any).kanban_stages)
      ? (card as any).kanban_stages[0]
      : (card as any).kanban_stages
    
    if (stageInfo?.position !== 99 && !(stageInfo?.name || '').toLowerCase().includes('entrega')) {
      return Response.json({ error: 'Só é possível encerrar cards na coluna de entrega' }, { status: 403 })
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
      return Response.json({ error: 'Erro interno' }, { status: 500 })
    }

    const incompleteRequired = requiredTasks?.some((task: any) => task.status !== 'completed')
    if (incompleteRequired) {
      return Response.json({ error: 'Todas as tarefas obrigatórias devem estar concluídas' }, { status: 400 })
    }

    // Atualizar card como completo
    const { error: updateError } = await supabase
      .from('kanban_items')
      .update({ 
        completed_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', cardId)

    if (updateError) {
      return Response.json({ error: 'Erro interno' }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: "Onboarding encerrado com sucesso",
      cardId: cardId
    })
    
  } catch (error) {
    return Response.json({ error: 'Erro interno' }, { status: 500 })
  }
}
