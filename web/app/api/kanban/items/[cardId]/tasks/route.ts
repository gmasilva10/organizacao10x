import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params
    console.log('🔍 Buscando tarefas do card:', cardId)
    
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Erro de autenticação:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ Usuário autenticado:', user.id)
    
    // Primeiro, buscar o card para obter o stage_id
    const { data: cardData, error: cardError } = await supabase
      .from('kanban_items')
      .select('stage_id, org_id')
      .eq('id', cardId)
      .single()

    if (cardError || !cardData) {
      console.error('❌ Erro ao buscar card:', cardError)
      return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 })
    }

    console.log('🔍 Card encontrado:', { stage_id: cardData.stage_id, org_id: cardData.org_id })

    // Agora buscar o stage_code da tabela kanban_stages
    const { data: stageData, error: stageError } = await supabase
      .from('kanban_stages')
      .select('stage_code')
      .eq('id', cardData.stage_id)
      .single()

    if (stageError || !stageData) {
      console.error('❌ Erro ao buscar stage_code:', stageError)
      return NextResponse.json({ error: 'Stage não encontrado' }, { status: 404 })
    }

    console.log('🔍 Stage encontrado:', { stage_code: stageData.stage_code })

    // Buscar todas as tarefas do estágio (obrigatórias + opcionais) usando stage_code
    const { data: stageTasks, error: stageTasksError } = await supabase
      .from('service_onboarding_tasks')
      .select('id, title, description, is_required, order_index')
      .eq('stage_code', stageData.stage_code)
      .eq('org_id', cardData.org_id)
      .order('order_index', { ascending: true })

    if (stageTasksError) {
      console.error('❌ Erro ao buscar tarefas do estágio:', stageTasksError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    console.log('🔍 Tarefas do estágio encontradas:', stageTasks?.length || 0)
    console.log('📋 Detalhes das tarefas:', stageTasks)

    // Buscar instâncias de tarefas do card (se existirem)
    const { data: rawCardTasks, error: cardTasksError } = await supabase
      .from('card_tasks')
      .select('task_id, is_completed, completed_at')
      .eq('card_id', cardId)

    if (cardTasksError) {
      console.error('❌ Erro ao buscar instâncias de tarefas:', cardTasksError)
      // Continuar mesmo com erro, retornando apenas as tarefas do estágio
    }

    console.log('🔍 Instâncias de tarefas do card encontradas:', rawCardTasks?.length || 0)
    console.log('📋 Detalhes das instâncias:', rawCardTasks)

    // Combinar tarefas do estágio com instâncias do card
    const cardTasksMap = new Map()
    if (rawCardTasks) {
      rawCardTasks.forEach((ct: any) => {
        cardTasksMap.set(ct.task_id, ct)
      })
    }

    const tasks = stageTasks.map((task: any) => {
      const cardTask = cardTasksMap.get(task.id)
      return {
        id: cardTask?.id || `temp_${task.id}`,
        task_id: task.id,
        status: cardTask?.is_completed ? 'completed' : 'pending',
        completed_at: cardTask?.completed_at,
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          is_required: task.is_required,
          order_index: task.order_index
        }
      }
    })

    console.log('✅ Tarefas encontradas:', tasks.length)
    return NextResponse.json({ tasks })

  } catch (error) {
    console.error('💥 Erro inesperado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}