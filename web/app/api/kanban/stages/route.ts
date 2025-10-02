import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Listar todas as colunas do Kanban

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

    // Buscar tenant_id do usuário
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Usuário não pertence a uma organização' }, { status: 403 })
    }

    // Buscar todas as colunas do Kanban
    const { data: columns, error: columnsError } = await supabase
      .from('kanban_stages')
      .select('*')
      .eq('org_id', membership.tenant_id)
      .order('position')

    if (columnsError) {
      console.error('Erro ao buscar colunas:', columnsError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      columns: columns || []
    })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Criar nova coluna
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, position, stage_code, is_fixed } = await request.json()
    
    if (!title || position === undefined) {
      return NextResponse.json({ error: 'Título e posição são obrigatórios' }, { status: 400 })
    }

    // Buscar tenant_id do usuário
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Usuário não pertence a uma organização' }, { status: 403 })
    }

    // Verificar se a posição já existe
    const { data: existingColumn, error: checkError } = await supabase
      .from('kanban_stages')
      .select('id')
      .eq('org_id', membership.tenant_id)
      .eq('position', position)
      .single()

    if (existingColumn && !checkError) {
      return NextResponse.json({ error: 'Já existe uma coluna nesta posição' }, { status: 400 })
    }

    // Criar nova coluna
    const { data: column, error: createError } = await supabase
      .from('kanban_stages')
      .insert({
        org_id: membership.tenant_id,
        name: title.trim(),
        position: position,
        stage_code: stage_code || `stage_${position}`,
        is_fixed: is_fixed || false
      })
      .select()
      .single()

    if (createError) {
      console.error('Erro ao criar coluna:', createError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Log da criação
    try {
      await supabase
        .from('kanban_logs')
        .insert({
          org_id: membership.tenant_id,
          user_id: user.id,
          action: 'column_created',
          entity_type: 'kanban_stage',
          entity_id: column.id,
          payload: {
            column_id: column.id,
            title: column.name,
            position: column.position,
            stage_code: column.stage_code,
            is_fixed: column.is_fixed
          }
        })
    } catch (logError) {
      console.error('Erro ao criar log:', logError)
      // Não falha a operação se o log falhar
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Coluna criada com sucesso',
      column
    })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}



