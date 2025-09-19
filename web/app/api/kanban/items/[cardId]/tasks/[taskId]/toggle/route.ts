import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string; taskId: string }> }
) {
  try {
    const { cardId, taskId } = await params
    console.log('🔍 Toggle task iniciado:', { cardId, taskId })
    
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Erro de autenticação:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ Usuário autenticado:', user.id)

    const body = await request.json()
    const { status } = body // 'completed' ou 'pending'
    
    if (!status || !['completed', 'pending'].includes(status)) {
      console.error('❌ Status inválido:', status)
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    // Buscar dados do card (org_id e stage_id) de uma vez
    console.log('🔍 Buscando dados do card...')
    const { data: cardData, error: cardDataError } = await supabase
      .from('kanban_items')
      .select('org_id, stage_id')
      .eq('id', cardId)
      .single()

    if (cardDataError || !cardData) {
      console.error('❌ Erro ao buscar dados do card:', cardDataError)
      return NextResponse.json({ error: 'Card não encontrado ou erro interno' }, { status: 500 })
    }
    console.log('✅ Dados do card encontrados:', cardData)

    const { org_id, stage_id } = cardData

    // Buscar tarefa existente
    console.log('🔍 Buscando tarefa existente...')
    const { data: existingTask, error: fetchError } = await supabase
      .from('card_tasks')
      .select('id, is_completed')
      .eq('card_id', cardId)
      .eq('task_id', taskId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means "no rows found"
      console.error('❌ Erro ao buscar tarefa:', fetchError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    let result
    if (existingTask) {
      // Atualizar tarefa existente
      console.log('🔄 Atualizando tarefa existente...')
      result = await supabase
        .from('card_tasks')
        .update({
          is_completed: status === 'completed',
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTask.id)
        .select()
        .single()
    } else {
      // Upsert por (card_id, task_id)
      console.log('➕ Criando/atualizando instância via upsert...')
      const { data: upsertData, error: upsertError } = await supabase
        .from('card_tasks')
        .upsert({
          card_id: cardId,
          task_id: taskId,
          org_id: org_id,
          is_completed: status === 'completed',
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'card_id,task_id' })
        .select()
        .single()

      if (upsertError) {
        console.error('❌ Erro no upsert:', upsertError)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
      }
      result = { data: upsertData, error: null } as any
    }

    if (result.error) {
      console.error('❌ Erro ao atualizar/criar tarefa:', result.error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
    console.log('✅ Tarefa processada com sucesso:', result.data)

    // Log da ação
    try {
      console.log('📝 Criando log da ação...')
      await supabase
        .from('kanban_logs')
        .insert({
          card_id: cardId,
          stage_id: stage_id, // Usar stage_id já buscado
          action: status === 'completed' ? 'task_completed' : 'task_started',
          payload: {
            task_id: taskId,
            status,
            card_id: cardId
          },
          created_by: user.id,
          org_id: org_id // Usar org_id já buscado
        })
      console.log('✅ Log criado com sucesso')
    } catch (logError) {
      console.error('⚠️ Erro ao criar log:', logError)
      // Não falha a operação se o log falhar
    }

    console.log('🎉 Operação concluída com sucesso!')
    return NextResponse.json({ success: true, task: result.data })

  } catch (error) {
    console.error('💥 Erro inesperado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}