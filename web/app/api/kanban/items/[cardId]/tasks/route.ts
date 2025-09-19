import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const t0 = Date.now()
    const { cardId } = await params
    
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Erro de autenticação:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // auth ok
    
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

    // card ok

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

    // stage ok

    // Buscar todas as tarefas do estágio (obrigatórias + opcionais) usando stage_code
    // Filtrar tarefas soft deleted (order_index = -1)
    const { data: stageTasks, error: stageTasksError } = await supabase
      .from('service_onboarding_tasks')
      .select('id, title, description, is_required, order_index')
      .eq('stage_code', stageData.stage_code)
      .or(`org_id.eq.${cardData.org_id},org_id.is.null`)
      .neq('order_index', -1)  // Filtrar tarefas soft deleted
      .order('order_index', { ascending: true })

    if (stageTasksError) {
      console.error('❌ Erro ao buscar tarefas do estágio:', stageTasksError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // stage tasks loaded

    // Buscar instâncias de tarefas do card (se existirem)
    const { data: rawCardTasks, error: cardTasksError } = await supabase
      .from('card_tasks')
      .select('id, task_id, is_completed, completed_at')
      .eq('card_id', cardId)

    if (cardTasksError) {
      console.error('❌ Erro ao buscar instâncias de tarefas:', cardTasksError)
      // Continuar mesmo com erro, retornando apenas as tarefas do estágio
    }

    // instances loaded

    // Combinar tarefas do estágio com instâncias do card
    const cardTasksMap = new Map()
    if (rawCardTasks) {
      rawCardTasks.forEach((ct: any) => {
        cardTasksMap.set(ct.task_id, ct)
      })
    }

    // Unificar: incluir tarefas definidas no estágio e também instâncias órfãs (task_id sem definição)
    const byId: Record<string, any> = {}
    for (const task of stageTasks || []) {
      const cardTask = cardTasksMap.get(task.id)
      byId[task.id] = {
        id: cardTask?.id || `temp_${task.id}`,
        task_id: task.id,
        status: cardTask?.is_completed ? 'completed' : 'pending',
        completed_at: cardTask?.completed_at || null,
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          is_required: task.is_required,
          order_index: task.order_index
        }
      }
    }
    // órfãs: existem em card_tasks mas não em service_onboarding_tasks (ex.: legado ou tasks globais)
    for (const ct of rawCardTasks || []) {
      if (!byId[ct.task_id]) {
        byId[ct.task_id] = {
          id: ct.id || `ct_${ct.task_id}`,
          task_id: ct.task_id,
          status: ct.is_completed ? 'completed' : 'pending',
          completed_at: ct.completed_at || null,
          task: {
            id: ct.task_id,
            title: 'Tarefa',
            description: null,
            is_required: false,
            order_index: 9999
          }
        }
      }
    }
    const tasks = Object.values(byId).sort((a:any,b:any)=> (a.task?.order_index||0) - (b.task?.order_index||0))

    const ms = Date.now() - t0
    return NextResponse.json({ tasks }, { headers: { 'X-Query-Time': String(ms), 'Cache-Control': 'private, max-age=10' } })

  } catch (error) {
    console.error('💥 Erro inesperado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}