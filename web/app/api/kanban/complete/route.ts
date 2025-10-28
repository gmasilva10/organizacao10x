import { invalidateCachePattern } from '@/lib/cache/redis';
import { withRateLimit, RateLimitMiddlewareConfigs } from '@/lib/rate-limit/middleware';

async function completeKanbanHandler(request: Request) {
  const startTime = Date.now()
  let statusCode = 500
  let error: string | undefined

  try {
    const { cardId } = await request.json()

    if (!cardId) {
      statusCode = 400
      return Response.json({ error: 'Card ID é obrigatório' }, { status: 400 })
    }

    // Importar Supabase client de forma dinâmica
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = await createClient()

    // Verificar autenticação e contexto (org)
    const { data: { user } } = await supabase.auth.getUser()
    const { resolveRequestContext } = await import('@/utils/context/request-context')
        const ctx = await resolveRequestContext()
        console.debug('🔍 [API COMPLETE] Início', { cardId, userId: user?.id, orgId: ctx.org_id })
        if (!ctx?.org_id) {
          statusCode = 401
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

    // Buscar informações básicas do card (sem joins para evitar falhas por relacionamento)
    let usingAdmin = false
    const { data: card, error: cardError } = await supabase
      .from('kanban_items')
      .select(`
        id,
        org_id,
        student_id,
        stage_id,
        position,
        completed_at,
        status
      `)
      .eq('id', cardId)
      .or(`org_id.eq.${ctx.org_id},org_id.is.null`)
      .single()

    let cardData = card as any
    if (cardError || !cardData) {
      console.debug('🔍 [API COMPLETE] Card não encontrado com sessão do usuário. Tentando admin probe...', { cardError: cardError?.message })
      const { createClientAdmin } = await import('@/utils/supabase/server')
      const admin = await createClientAdmin()
      const { data: cardProbe } = await admin
        .from('kanban_items')
        .select('id, org_id, student_id, stage_id, position, completed_at, status')
        .eq('id', cardId)
        .maybeSingle()
      if (!cardProbe) {
        statusCode = 404
        return Response.json({ error: 'Card não encontrado' }, { status: 404 })
      }
      // Se o card existir mas não foi visível pela sessão, é RLS. Validar org.
      if (cardProbe.org_id && cardProbe.org_id !== ctx.org_id) {
        statusCode = 403
        return Response.json({ error: 'Acesso negado ao card (org diferente)' }, { status: 403 })
      }
      usingAdmin = true
      cardData = cardProbe
      console.debug('🔍 [API COMPLETE] Prosseguindo via admin por RLS', { usingAdmin })
    }
    console.debug('🔍 [API COMPLETE] Card encontrado', { cardId: cardData.id, orgId: cardData.org_id, stageId: cardData.stage_id })

    // Buscar informações do estágio do card e validar coluna de entrega
    const clientForReads = usingAdmin ? (await (await import('@/utils/supabase/server')).createClientAdmin()) : supabase
    const { data: stageInfo, error: stageError } = await clientForReads
      .from('kanban_stages')
      .select('id, name, position, stage_code')
      .eq('id', cardData.stage_id)
      .or(`org_id.eq.${ctx.org_id},org_id.is.null`)
      .single()

    if (stageError || !stageInfo) {
      console.debug('🔍 [API COMPLETE] Estágio não encontrado', { stageError: stageError?.message, stageId: card?.stage_id })
      return Response.json({ error: 'Estágio do card não encontrado' }, { status: 404 })
    }

    const isEntrega = stageInfo?.position === 99 || (stageInfo?.name || '').toLowerCase().includes('entrega')
    if (!isEntrega) {
      return Response.json({ error: 'Só é possível encerrar cards na coluna de entrega' }, { status: 403 })
    }

    // Verificar se todas as tarefas obrigatórias estão concluídas (modelo atual usa is_completed)
    const { data: requiredTasks, error: tasksError } = await supabase
      .from('card_tasks')
      .select(`
        is_completed,
        service_onboarding_tasks!inner(is_required)
      `)
      .eq('card_id', cardId)
      .eq('service_onboarding_tasks.is_required', true)

    if (tasksError) {
      console.error('❌ [API COMPLETE] Erro ao buscar tarefas obrigatórias:', tasksError)
      return Response.json({ error: 'Erro interno' }, { status: 500 })
    }

    const incompleteRequired = requiredTasks?.some((task: any) => task.is_completed !== true)
    if (incompleteRequired) {
      return Response.json({ error: 'Todas as tarefas obrigatórias devem estar concluídas' }, { status: 400 })
    }

    // ===== ATUALIZAR CARD COMO COMPLETO =====
    
    const writeClient = usingAdmin ? await (await import('@/utils/supabase/server')).createClientAdmin() : supabase
    const { error: updateError } = await writeClient
      .from('kanban_items')
      .update({ 
        completed_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', cardId)

    if (updateError) {
      console.error('Erro ao marcar card como concluído:', updateError)
      return Response.json({ error: 'Erro interno' }, { status: 500 })
    }

    // ===== INSERIR HISTÓRICO DE ONBOARDING =====
    // Calcular métricas básicas (kanban_items não possui created_at)
    const totalDays = 0

    const { data: tasks } = await clientForReads
      .from('card_tasks')
      .select('id')
      .eq('card_id', cardId)
      .eq('is_completed', true)

    const totalTasksCompleted = tasks?.length || 0

    // Obter nome do aluno para título amigável
    let cardTitle: string = `kanban_item:${cardId}`
    if (cardData.student_id) {
      const { data: studentInfo } = await clientForReads
        .from('students')
        .select('name')
        .eq('id', cardData.student_id as string)
        .maybeSingle()
      if ((studentInfo as any)?.name) cardTitle = (studentInfo as any).name
    }

    // Inserir histórico básico
    const { error: historyError } = await writeClient
      .from('onboarding_history')
      .insert({
        org_id: cardData.org_id,
        student_id: cardData.student_id,
        kanban_item_id: cardId,
        completed_at: new Date().toISOString(),
        completed_by_user_id: user?.id || null,
        initial_stage_id: cardData.stage_id,
        final_stage_id: cardData.stage_id,
        path_taken: [],
        total_days: totalDays,
        total_tasks_completed: totalTasksCompleted,
        metadata: {
          card_title: cardTitle,
          completion_notes: 'Onboarding concluído com sucesso',
          final_stage_name: stageInfo?.name
        }
      })

        if (historyError) {
          console.error('Erro ao criar histórico:', historyError)
          // Não falha a operação se o histórico falhar
        } else {
          // Disparar trigger de onboarding completo para criar tarefa first_workout
          try {
            console.log('🔄 [kanban-complete] Disparando trigger de onboarding completo')
            
            const triggerResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/relationship/triggers/onboarding-complete`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${request.headers.get('authorization')?.replace('Bearer ', '') || ''}`
              },
              body: JSON.stringify({
                student_id: cardData.student_id,
                org_id: cardData.org_id,
                completed_at: new Date().toISOString()
              })
            })
            
            if (triggerResponse.ok) {
              const triggerResult = await triggerResponse.json()
              console.log('✅ [kanban-complete] Trigger executado com sucesso:', triggerResult)
            } else {
              console.warn('⚠️ [kanban-complete] Trigger falhou:', await triggerResponse.text())
            }
          } catch (triggerError) {
            console.warn('⚠️ [kanban-complete] Erro ao executar trigger (ignorado):', triggerError)
            // Não falha a operação se o trigger falhar
          }
        }

        // Invalidar cache relacionado ao kanban e histórico
        try {
          await Promise.all([
            invalidateCachePattern('kanban-board:*', { prefix: 'kanban' }),
            invalidateCachePattern(`onboarding-history:${cardData.student_id}:*`, { prefix: 'students' })
          ])
          console.log('✅ [kanban-complete] Cache invalidado para kanban e histórico')
        } catch (cacheError) {
          console.warn('⚠️ [kanban-complete] Erro ao invalidar cache:', cacheError)
          // Não falha a operação se a invalidação falhar
        }

            statusCode = 200
            return Response.json({
              success: true,
              message: "Onboarding concluído com sucesso - Card movido para histórico",
              cardId: cardId,
              history: {
                totalDays,
                totalTasksCompleted
              }
            })

      } catch (err) {
        console.error('Erro inesperado:', err)
        error = err instanceof Error ? err.message : 'Unknown error'
        statusCode = 500
        return Response.json({ error: 'Erro interno' }, { status: 500 })
      } finally {
        const duration = Date.now() - startTime
        // Temporariamente removido para corrigir erro de build
        // try {
        //   const { recordAPIMetric, createAPIMetric } = await import('@/lib/metrics/api-metrics')
        //   recordAPIMetric(
        //     createAPIMetric(
        //       '/api/kanban/complete',
        //       'POST',
        //       statusCode,
        //       duration,
        //       ctx?.userId,
        //       ctx?.org_id,
        //       error
        //     )
        //   )
        // } catch (metricsError) {
        //   console.warn('⚠️ [kanban-complete] Falha ao registrar métricas (ignorado):', metricsError)
        // }
      }
}

// Temporariamente removido rate limiting para corrigir erro de build
export const POST = completeKanbanHandler

