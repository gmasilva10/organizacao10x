import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Listar tarefas por stage_code

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const stageCode = searchParams.get('stage_code')
    
    if (!stageCode) {
      return NextResponse.json({ error: 'stage_code é obrigatório' }, { status: 400 })
    }

    // Buscar org_id do usuário
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Usuário não pertence a uma organização' }, { status: 403 })
    }

    // Buscar tarefas do catálogo para esta coluna (excluir soft deleted com order_index = -1)
    const { data: tasks, error: tasksError } = await supabase
      .from('service_onboarding_tasks')
      .select('*')
      .eq('stage_code', stageCode)
      .eq('org_id', membership.org_id)
      .neq('order_index', -1)  // Filtrar tarefas soft deleted
      .order('order_index')

    if (tasksError) {
      console.error('Erro ao buscar tarefas:', tasksError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      tasks: tasks || [],
      stage_code: stageCode
    })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Criar nova tarefa
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API POST /api/services/onboarding/tasks iniciada')
    
    const supabase = await createClient()
    console.log('✅ Supabase client criado')
    
    // Verificar autenticação com mais detalhes
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🔍 Auth check result:', { 
      user: user?.id, 
      error: authError,
      hasUser: !!user,
      userEmail: user?.email
    })
    
    if (authError) {
      console.error('❌ Erro de autenticação:', authError)
      return NextResponse.json({ 
        error: 'Authentication error', 
        details: authError.message,
        code: authError.status 
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('❌ Usuário não encontrado na sessão')
      return NextResponse.json({ 
        error: 'No user session found',
        details: 'User not authenticated'
      }, { status: 401 })
    }
    console.log('✅ Usuário autenticado:', user.id)

    const { title, description, is_required, stage_code, order_index, sla_hours } = await request.json()
    console.log('📝 Dados recebidos:', { title, description, is_required, stage_code, order_index, sla_hours })
    
    if (!title || !stage_code) {
      console.error('❌ Dados obrigatórios faltando')
      return NextResponse.json({ error: 'Título e stage_code são obrigatórios' }, { status: 400 })
    }

    // Buscar org_id do usuário
    console.log('🔍 Buscando membership para usuário:', user.id)
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    console.log('🔍 Resultado da busca de membership:', { 
      membership, 
      membershipError,
      hasMembership: !!membership,
      orgId: membership?.org_id
    })

    if (membershipError) {
      console.error('❌ Erro ao buscar membership:', membershipError)
      return NextResponse.json({ 
        error: 'Erro ao buscar membership', 
        details: membershipError.message 
      }, { status: 500 })
    }
    
    if (!membership) {
      console.error('❌ Usuário não tem membership')
      return NextResponse.json({ error: 'Usuário não pertence a uma organização' }, { status: 403 })
    }
    console.log('✅ Membership encontrado:', membership.org_id)

    // Buscar próximo order_index disponível para esta coluna
    console.log('🔍 Buscando próximo order_index para stage_code:', stage_code)
    const { data: existingTasks, error: countError } = await supabase
      .from('service_onboarding_tasks')
      .select('order_index')
      .eq('org_id', membership.org_id)
      .eq('stage_code', stage_code)
      .order('order_index', { ascending: false })
      .limit(1)

    if (countError) {
      console.error('❌ Erro ao contar tarefas existentes:', countError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    const nextOrderIndex = existingTasks && existingTasks.length > 0 
      ? (existingTasks[0].order_index || 0) + 1 
      : 1

    // Gerar task_code único usando timestamp para evitar duplicatas
    const taskCode = `${stage_code}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    console.log('🔑 Task code gerado:', taskCode, 'para order_index:', nextOrderIndex)

    // Criar nova tarefa
    console.log('🔄 Inserindo tarefa na tabela service_onboarding_tasks')
    const { data: task, error: createError } = await supabase
      .from('service_onboarding_tasks')
      .insert({
        org_id: membership.org_id,
        title: title.trim(),
        description: description?.trim() || '',
        is_required: is_required !== undefined ? is_required : true,
        stage_code,
        order_index: nextOrderIndex,
        task_code: taskCode,
        sla_hours: sla_hours || null
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Erro ao criar tarefa:', createError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
    console.log('✅ Tarefa criada com sucesso:', task.id)

    // Log da criação
    console.log('🔄 Inserindo log na tabela kanban_logs')
    try {
      const { error: logError } = await supabase
        .from('kanban_logs')
        .insert({
          org_id: membership.org_id,
          user_id: user.id,
          action: 'task_catalog_created',
          entity_type: 'service_onboarding_task',
          entity_id: task.id,
          payload: {
            task_id: task.id,
            task_code: task.task_code,
            title: task.title,
            stage_code: task.stage_code,
            is_required: task.is_required,
            order_index: task.order_index
          }
        })
      
      if (logError) {
        console.error('❌ Erro ao criar log:', logError)
      } else {
        console.log('✅ Log criado com sucesso')
      }
    } catch (logError) {
      console.error('❌ Erro ao criar log:', logError)
      // Não falha a operação se o log falhar
    }

    console.log('🎉 Retornando sucesso para cliente')
    return NextResponse.json({ 
      success: true, 
      message: 'Tarefa criada com sucesso',
      task,
      invalidateCache: true  // Flag para o frontend invalidar cache
    })

  } catch (error) {
    console.error('❌ Erro inesperado na API:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

