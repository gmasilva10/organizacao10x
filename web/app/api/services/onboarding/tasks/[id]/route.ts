import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// PATCH - Atualizar tarefa existente
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 API PATCH /api/services/onboarding/tasks/[id] iniciada')
    
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id
    const updates = await request.json()
    console.log('📝 Atualizações recebidas:', updates)

    // Buscar org_id do usuário
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Usuário não pertence a uma organização' }, { status: 403 })
    }

    // Verificar se a tarefa pertence à organização do usuário
    const { data: existingTask, error: taskError } = await supabase
      .from('service_onboarding_tasks')
      .select('id, org_id')
      .eq('id', taskId)
      .eq('org_id', membership.org_id)
      .single()

    if (taskError || !existingTask) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }

    // Preparar dados para atualização
    const updateData: any = {}
    
    if (updates.title !== undefined) {
      updateData.title = updates.title.trim()
    }
    
    if (updates.description !== undefined) {
      updateData.description = updates.description.trim()
    }
    
    if (updates.is_required !== undefined) {
      updateData.is_required = updates.is_required
    }
    
    if (updates.order_index !== undefined) {
      updateData.order_index = updates.order_index
    }
    
    if (updates.sla_hours !== undefined) {
      updateData.sla_hours = updates.sla_hours || null
    }

    // Atualizar tarefa
    console.log('🔄 Atualizando tarefa:', updateData)
    const { data: updatedTask, error: updateError } = await supabase
      .from('service_onboarding_tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('org_id', membership.org_id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erro ao atualizar tarefa:', updateError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    console.log('✅ Tarefa atualizada com sucesso:', updatedTask.id)

    // Log da atualização
    try {
      const { error: logError } = await supabase
        .from('kanban_logs')
        .insert({
          org_id: membership.org_id,
          user_id: user.id,
          action: 'task_catalog_updated',
          entity_type: 'service_onboarding_task',
          entity_id: taskId,
          payload: {
            task_id: taskId,
            updates: updateData,
            updated_at: new Date().toISOString()
          }
        })
      
      if (logError) {
        console.error('❌ Erro ao criar log:', logError)
      } else {
        console.log('✅ Log criado com sucesso')
      }
    } catch (logError) {
      console.error('❌ Erro ao criar log:', logError)
    }

    console.log('🎉 Retornando sucesso para cliente')
    return NextResponse.json({ 
      success: true, 
      message: 'Tarefa atualizada com sucesso',
      task: updatedTask,
      invalidateCache: true
    })

  } catch (error) {
    console.error('❌ Erro inesperado na API:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Excluir tarefa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 API DELETE /api/services/onboarding/tasks/[id] iniciada')
    
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id

    // Buscar org_id do usuário
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Usuário não pertence a uma organização' }, { status: 403 })
    }

    // Verificar se a tarefa pertence à organização do usuário
    const { data: existingTask, error: taskError } = await supabase
      .from('service_onboarding_tasks')
      .select('id, org_id, title, stage_code')
      .eq('id', taskId)
      .eq('org_id', membership.org_id)
      .single()

    if (taskError || !existingTask) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }

    // Excluir tarefa (soft delete - marcar order_index como -1)
    console.log('🔄 Excluindo tarefa (soft delete):', taskId)
    const { error: deleteError } = await supabase
      .from('service_onboarding_tasks')
      .update({ order_index: -1 })
      .eq('id', taskId)
      .eq('org_id', membership.org_id)

    if (deleteError) {
      console.error('❌ Erro ao excluir tarefa:', deleteError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    console.log('✅ Tarefa excluída com sucesso:', taskId)

    // Log da exclusão
    try {
      const { error: logError } = await supabase
        .from('kanban_logs')
        .insert({
          org_id: membership.org_id,
          user_id: user.id,
          action: 'task_catalog_deleted',
          entity_type: 'service_onboarding_task',
          entity_id: taskId,
          payload: {
            task_id: taskId,
            task_title: existingTask.title,
            stage_code: existingTask.stage_code,
            deleted_at: new Date().toISOString()
          }
        })
      
      if (logError) {
        console.error('❌ Erro ao criar log:', logError)
      } else {
        console.log('✅ Log criado com sucesso')
      }
    } catch (logError) {
      console.error('❌ Erro ao criar log:', logError)
    }

    console.log('🎉 Retornando sucesso para cliente')
    return NextResponse.json({ 
      success: true, 
      message: 'Tarefa excluída com sucesso',
      invalidateCache: true
    })

  } catch (error) {
    console.error('❌ Erro inesperado na API:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}