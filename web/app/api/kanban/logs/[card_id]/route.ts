import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET(
  request: NextRequest,
  { params }: { params: { card_id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { card_id } = params
    
    // Buscar logs do card ordenados por data (mais recente primeiro)
    const { data: logs, error } = await supabase
      .from('kanban_logs')
      .select(`
        id,
        action,
        payload,
        created_at,
        created_by,
        stage_id,
        profiles!kanban_logs_created_by_fkey(name)
      `)
      .eq('card_id', card_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar logs:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json({ logs: logs || [] })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { card_id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { card_id } = params
    const { action, payload } = await request.json()
    
    if (!action) {
      return NextResponse.json({ error: 'Ação é obrigatória' }, { status: 400 })
    }

    // Buscar informações do card para o log
    const { data: card, error: cardError } = await supabase
      .from('kanban_items')
      .select('org_id, stage_id')
      .eq('id', card_id)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 })
    }

    // Criar log
    const { error: logError } = await supabase
      .from('kanban_logs')
      .insert({
        org_id: card.org_id,
        card_id: card_id,
        stage_id: card.stage_id,
        action: action,
        payload: payload || {},
        created_by: user.id
      })

    if (logError) {
      console.error('Erro ao criar log:', logError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
