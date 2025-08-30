import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// PATCH - Atualizar tarefa
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { title, description, is_required, order_index, apply_to_existing } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: 'ID da tarefa é obrigatório' }, { status: 400 })
    }

    // Buscar org_id do usuário
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Usuário não pertence a uma organização' }, { status: 403 })
    }

    // Verificar se a tarefa existe e pertence à organização
    const { data: existingTask, error: fetchError } = await supabase
      .from('service_onboarding_tasks')
      .select('*')
      .eq('id', id)
      .eq('org_id', membership.tenant_id)
      .single()

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }

    // Preparar dados para atualização
    const updateData: any = {}
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || ''
    if (is_required !== undefined) updateData.is_required = is_required
    if (order_index !== undefined) updateData.order_index = order_index

    // Atualizar tarefa
    const { data: updatedTask, error: updateError } = await supabase
      .from('service_onboarding_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar tarefa:', updateError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Se solicitado, aplicar aos cards existentes
    if (apply_to_existing) {
      try {
        // Chamar função PostgreSQL para aplicar aos cards existentes
        const { data: applyResult, error: applyError } = await supabase.rpc(
          'apply_catalog_to_existing_cards',
          {
            p_stage_code: existingTask.stage_code,
            p_org_id: membership.tenant_id,
            p_apply_to_existing: true
          }
        )

        if (applyError) {
          console.error('Erro ao aplicar aos cards existentes:', applyError)
        }
      } catch (applyError) {
        console.error('Erro ao aplicar aos cards existentes:', applyError)
      }
    }

    // Log da atualização
    try {
      await supabase
        .from('kanban_logs')
        .insert({
          org_id: membership.tenant_id,
          user_id: user.id,
          action: 'task_catalog_updated',
          entity_type: 'service_onboarding_task',
          entity_id: id,
          payload: {
            task_id: id,
            old_values: existingTask,
            new_values: updatedTask,
            apply_to_existing: apply_to_existing || false
          }
        })
    } catch (logError) {
      console.error('Erro ao criar log:', logError)
      // Não falha a operação se o log falhar
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tarefa atualizada com sucesso',
      task: updatedTask,
      applied_to_existing: apply_to_existing || false
    })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Excluir tarefa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    
    if (!id) {
      return NextResponse.json({ error: 'ID da tarefa é obrigatório' }, { status: 400 })
    }

    // Buscar org_id do usuário
    const { data: membership, error: membershipError } = await supabase.auth.getUser()
    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Usuário não pertence a uma organização' }, { status: 403 })
    }

    // Verificar se a tarefa existe e pertence à organização
    const { data: existingTask, error: fetchError } = await supabase
      .from('service_onboarding_tasks')
      .select('*')
      .eq('id', id)
      .eq('org_id', membership.org_id)
      .single()

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }

    // Verificar se há cards com esta tarefa
    const { data: cardTasks, error: cardTasksError } = await supabase
      .from('card_tasks')
      .select('id')
      .eq('task_id', id)
      .limit(1)

    if (cardTasksError) {
      console.error('Erro ao verificar cards com tarefa:', cardTasksError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    if (cardTasks && cardTasks.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir tarefa que está sendo usada em cards',
        card_count: cardTasks.length
      }, { status: 400 })
    }

    // Excluir tarefa
    const { error: deleteError } = await supabase
      .from('service_onboarding_tasks')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao excluir tarefa:', deleteError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Log da exclusão
    try {
      await supabase
        .from('kanban_logs')
        .insert({
          org_id: membership.org_id,
          action: 'task_catalog_deleted',
          payload: {
            task_id: id,
            task_title: existingTask.title,
            stage_code: existingTask.stage_code
          },
          created_by: user.id
        })
    } catch (logError) {
      console.error('Erro ao criar log:', logError)
      // Não falha a operação se o log falhar
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tarefa excluída com sucesso'
    })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
