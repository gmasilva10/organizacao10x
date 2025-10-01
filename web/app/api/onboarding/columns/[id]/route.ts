import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Alias de compatibilidade para DELETE /api/onboarding/columns/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'ID da coluna é obrigatório' }, { status: 400 })
    }

    // Tenant do usuário
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()
    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Usuário não pertence a uma organização' }, { status: 403 })
    }

    // Encontrar stage equivalente (kanban_stages)
    const { data: existingColumn, error: fetchError } = await supabase
      .from('kanban_stages')
      .select('*')
      .eq('id', id)
      .eq('org_id', membership.tenant_id)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: 'Erro ao buscar coluna' }, { status: 500 })
    }

    if (!existingColumn) {
      return NextResponse.json({ error: 'Coluna não encontrada' }, { status: 404 })
    }

    // Regras de bloqueio
    if (existingColumn.is_fixed) {
      return NextResponse.json({ error: 'Não é possível excluir colunas fixas' }, { status: 403 })
    }
    if (existingColumn.position === 1 || existingColumn.position === 99) {
      return NextResponse.json({ error: 'Não é possível excluir as colunas padrão (1 e 99)' }, { status: 403 })
    }

    // Coluna padrão para receber itens
    const { data: defaultStage } = await supabase
      .from('kanban_stages')
      .select('id, name, position, is_fixed')
      .eq('org_id', membership.tenant_id)
      .or('position.eq.1,name.eq.Novo Aluno')
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle()
    const defaultStageId = defaultStage?.id

    if (defaultStageId) {
      const { error: moveErr } = await supabase
        .from('kanban_items')
        .update({ stage_id: defaultStageId })
        .eq('stage_id', id)
        .eq('org_id', membership.tenant_id)
      if (moveErr) {
        return NextResponse.json({ error: 'Erro ao mover cards para a coluna padrão' }, { status: 500 })
      }
    } else {
      const { count } = await supabase
        .from('kanban_items')
        .select('id', { count: 'exact', head: true })
        .eq('stage_id', id)
        .eq('org_id', membership.tenant_id)
      if ((count || 0) > 0) {
        return NextResponse.json({ error: 'not_empty', message: 'Não há coluna padrão para receber os cards' }, { status: 422 })
      }
    }

    const { error: deleteError } = await supabase
      .from('kanban_stages')
      .delete()
      .eq('id', id)
      .eq('org_id', membership.tenant_id)
    if (deleteError) {
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    try {
      await supabase
        .from('kanban_logs')
        .insert({
          org_id: membership.tenant_id,
          user_id: user.id,
          action: 'column_deleted',
          entity_type: 'kanban_stage',
          entity_id: id,
          payload: { column_id: id, deleted_column: existingColumn }
        })
    } catch {}

    return NextResponse.json({ success: true, message: 'Coluna excluída com sucesso', movedTo: defaultStageId || null })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}


