import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

// ForÃ§ar execuÃ§Ã£o dinÃ¢mica para evitar problemas de renderizaÃ§Ã£o estÃ¡tica
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient()
    
    // Verificar autenticaÃ§Ã£o
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardId } = await request.json()
    
    if (!cardId) {
      return NextResponse.json({ error: 'Card ID Ã© obrigatÃ³rio' }, { status: 400 })
    }

    // Buscar informaÃ§Ãµes do card
    const { data: card, error: cardError } = await supabase
      .from('kanban_items')
      .select(`
        id, 
        org_id, 
        student_id, 
        stage_id,
        kanban_stages!inner(title, position, stage_code)
      `)
      .eq('id', cardId)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card nÃ£o encontrado' }, { status: 404 })
    }

    // Verificar se estÃ¡ na coluna de entrega (99)
    const stageInfo: any = Array.isArray((card as any).kanban_stages)
      ? (card as any).kanban_stages[0]
      : (card as any).kanban_stages
    if (stageInfo?.position !== 99 && !(stageInfo?.title || '').toLowerCase().includes('entrega')) {
      return NextResponse.json({ error: 'SÃ³ Ã© possÃ­vel encerrar cards na coluna de entrega' }, { status: 403 })
    }

    // Verificar se todas as tarefas obrigatÃ³rias estÃ£o concluÃ­das
    const { data: requiredTasks, error: tasksError } = await supabase
      .from('card_tasks')
      .select(`
        is_completed,
        service_onboarding_tasks!inner(is_required)
      `)
      .eq('card_id', cardId)
      .eq('service_onboarding_tasks.is_required', true)

    if (tasksError) {
      console.error('Erro ao verificar tarefas:', tasksError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    const incompleteRequired = requiredTasks?.some((task: any) => task.is_completed !== true)
    if (incompleteRequired) {
      return NextResponse.json({ error: 'Todas as tarefas obrigatÃ³rias devem estar concluÃ­das' }, { status: 400 })
    }

    // Marcar o card como concluÃ­do (soft delete ou status)
    const { error: updateError } = await supabase
      .from('kanban_items')
      .update({ 
        completed_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', cardId)

    if (updateError) {
      console.error('Erro ao marcar card como concluÃ­do:', updateError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Log da conclusÃ£o
    try {
      await supabase
        .from('kanban_logs')
        .insert({
          org_id: card.org_id,
          card_id: cardId,
          stage_id: card.stage_id,
          action: 'card_completed',
          payload: {
            student_id: card.student_id,
            stage_title: (Array.isArray((card as any).kanban_stages) ? (card as any).kanban_stages[0]?.title : (card as any).kanban_stages?.title),
            completed_at: new Date().toISOString()
          },
          created_by: user.id
        })
    } catch (logError) {
      console.error('Erro ao criar log:', logError)
      // NÃ£o falha a operaÃ§Ã£o se o log falhar
    }

    return NextResponse.json({ 
      success: true, 
      message: `Onboarding do aluno concluÃ­do com sucesso`
    })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
