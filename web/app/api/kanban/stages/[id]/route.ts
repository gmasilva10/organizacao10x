import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// PATCH - Atualizar coluna

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const { title, position, color } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: 'ID da coluna é obrigatório' }, { status: 400 })
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

    // Verificar se a coluna existe e pertence à organização
    const { data: existingColumn, error: fetchError } = await supabase
      .from('kanban_stages')
      .select('*')
      .eq('id', id)
      .eq('org_id', membership.org_id)
      .single()

    if (fetchError || !existingColumn) {
      return NextResponse.json({ error: 'Coluna não encontrada' }, { status: 404 })
    }

    // Validar formato de cor se fornecida
    if (color !== undefined && color !== null && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json({ error: 'Formato de cor inválido. Use formato hex (#RRGGBB)' }, { status: 400 })
    }

    // Preparar dados para atualização
    const updateData: any = {}
    if (title !== undefined) updateData.name = title.trim()
    if (color !== undefined) updateData.color = color
    
    // Para colunas fixas, permitir renomeação e cor (mas não mudança de posição)
    if (existingColumn.is_fixed || existingColumn.position === 1 || existingColumn.position === 99) {
      if (position !== undefined) {
        return NextResponse.json({ error: 'Não é possível alterar a posição de colunas fixas' }, { status: 403 })
      }
      // Permitir renomeação e alteração de cor para colunas fixas
      if (title === undefined && color === undefined) {
        return NextResponse.json({ error: 'Forneça o nome ou cor para atualizar a coluna fixa' }, { status: 400 })
      }
    } else {
      // Para colunas não-fixas, permitir alteração de posição
      if (position !== undefined) updateData.position = position
    }

    // Atualizar coluna com fallback para campo color
    let updatedColumn, updateError
    
    try {
      // Tentar atualizar com todos os campos
      const result = await supabase
        .from('kanban_stages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      updatedColumn = result.data
      updateError = result.error
    } catch (err) {
      // Se falhar, pode ser porque o campo color não existe
      if (updateData.color) {
        console.log('Campo color não existe, tentando sem ele...')
        const fallbackData: any = { name: updateData.name }
        if (updateData.position !== undefined) fallbackData.position = updateData.position
        
        const result = await supabase
          .from('kanban_stages')
          .update(fallbackData)
          .eq('id', id)
          .select()
          .single()
        
        updatedColumn = result.data
        updateError = result.error
        
        // Log informativo
        console.log('Campo color ignorado - migration não aplicada')
      } else {
        console.error('Erro inesperado:', err)
        throw err
      }
    }

    if (updateError) {
      console.error('Erro ao atualizar coluna:', updateError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Log da atualização
    try {
      await supabase
        .from('kanban_logs')
        .insert({
          org_id: membership.org_id,
          user_id: user.id,
          action: 'column_updated',
          entity_type: 'kanban_stage',
          entity_id: id,
          payload: {
            column_id: id,
            old_values: existingColumn,
            new_values: updatedColumn
          }
        })
    } catch (logError) {
      console.error('Erro ao criar log:', logError)
      // Não falha a operação se o log falhar
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Coluna atualizada com sucesso',
      column: updatedColumn
    })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Excluir coluna
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
      return NextResponse.json({ error: 'ID da coluna é obrigatório' }, { status: 400 })
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

    // Verificar se a coluna existe e pertence à organização
    const { data: existingColumn, error: fetchError } = await supabase
      .from('kanban_stages')
      .select('*')
      .eq('id', id)
      .eq('org_id', membership.org_id)
      .single()

    if (fetchError || !existingColumn) {
      return NextResponse.json({ error: 'Coluna não encontrada' }, { status: 404 })
    }

    // Verificar se é uma coluna fixa
    if (existingColumn.is_fixed) {
      return NextResponse.json({ error: 'Não é possível excluir colunas fixas' }, { status: 403 })
    }

    // Bloquear exclusão das posições 1 e 99
    if (existingColumn.position === 1 || existingColumn.position === 99) {
      return NextResponse.json({ error: 'Não é possível excluir as colunas padrão (1 e 99)' }, { status: 403 })
    }

    // Encontrar coluna padrão ("Novo Aluno" ou posição 1)
    const { data: defaultStage } = await supabase
      .from('kanban_stages')
      .select('id, name, position, is_fixed')
      .eq('org_id', membership.org_id)
      .or('position.eq.1,name.eq.Novo Aluno')
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle()

    const defaultStageId = defaultStage?.id

    // Se houver cards na coluna, mover para a coluna padrão antes de excluir
    if (defaultStageId) {
      const { error: moveErr } = await supabase
        .from('kanban_items')
        .update({ stage_id: defaultStageId })
        .eq('stage_id', id)
        .eq('org_id', membership.org_id)
      if (moveErr) {
        console.error('Erro ao mover cards para coluna padrão:', moveErr)
        return NextResponse.json({ error: 'Erro ao mover cards para a coluna padrão' }, { status: 500 })
      }
    } else {
      // Se não houver coluna padrão, impedir exclusão caso existam cards
      const { count } = await supabase
        .from('kanban_items')
        .select('id', { count: 'exact', head: true })
        .eq('stage_id', id)
        .eq('org_id', membership.org_id)
      if ((count || 0) > 0) {
        return NextResponse.json({ error: 'not_empty', message: 'Não há coluna padrão para receber os cards' }, { status: 422 })
      }
    }

    // Excluir coluna
    const { error: deleteError } = await supabase
      .from('kanban_stages')
      .delete()
      .eq('id', id)
      .eq('org_id', membership.org_id)

    if (deleteError) {
      console.error('Erro ao excluir coluna:', deleteError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Log da exclusão
    try {
      await supabase
        .from('kanban_logs')
        .insert({
          org_id: membership.org_id,
          user_id: user.id,
          action: 'column_deleted',
          entity_type: 'kanban_stage',
          entity_id: id,
          payload: {
            column_id: id,
            deleted_column: existingColumn
          }
        })
    } catch (logError) {
      console.error('Erro ao criar log:', logError)
      // Não falha a operação se o log falhar
    }

    return NextResponse.json({ success: true, message: 'Coluna excluída com sucesso', movedTo: defaultStageId || null })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}


