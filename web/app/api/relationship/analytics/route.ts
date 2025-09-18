/**
 * GATE 10.6.7.5 - API de Analytics para Relacionamento
 * 
 * Funcionalidades:
 * - Métricas por âncora (incluindo 'manual')
 * - Filtros por classification_tag
 * - Volume por período
 * - Performance otimizada
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { resolveRequestContext } from '@/utils/context/request-context'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { user, tenant_id } = await resolveRequestContext(request)
    if (!user || !tenant_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Filtros
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, 1y
    const anchor = searchParams.get('anchor') // Filtrar por âncora específica
    const classification_tag = searchParams.get('classification_tag') // Filtrar por tag
    
    // Calcular data de início baseada no período
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Construir query base
    let query = supabase
      .from('relationship_tasks')
      .select('id, anchor, classification_tag, status, created_at, sent_at')
      .eq('tenant_id', tenant_id)
      .gte('created_at', startDate.toISOString())

    // Aplicar filtros
    if (anchor) {
      query = query.eq('anchor', anchor)
    }
    
    if (classification_tag) {
      query = query.eq('classification_tag', classification_tag)
    }

    const { data: tasks, error: tasksError } = await query

    if (tasksError) {
      return NextResponse.json({ 
        error: 'Failed to fetch tasks', 
        details: tasksError.message 
      }, { status: 500 })
    }

    // Processar métricas
    const metrics = {
      total_tasks: tasks?.length || 0,
      by_anchor: {} as Record<string, number>,
      by_classification: {} as Record<string, number>,
      by_status: {} as Record<string, number>,
      by_period: {} as Record<string, number>,
      manual_tasks: 0,
      template_tasks: 0,
      free_text_tasks: 0
    }

    // Agrupar por âncora
    tasks?.forEach(task => {
      const taskAnchor = task.anchor || 'unknown'
      metrics.by_anchor[taskAnchor] = (metrics.by_anchor[taskAnchor] || 0) + 1
      
      // Contar tarefas manuais
      if (taskAnchor === 'manual') {
        metrics.manual_tasks++
      }
    })

    // Agrupar por classificação
    tasks?.forEach(task => {
      const tag = task.classification_tag || 'Sem classificação'
      metrics.by_classification[tag] = (metrics.by_classification[tag] || 0) + 1
    })

    // Agrupar por status
    tasks?.forEach(task => {
      const status = task.status || 'unknown'
      metrics.by_status[status] = (metrics.by_status[status] || 0) + 1
    })

    // Agrupar por período (últimos 7 dias)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      return date.toISOString().split('T')[0]
    })

    last7Days.forEach(date => {
      const dayTasks = tasks?.filter(task => 
        task.created_at?.startsWith(date)
      ) || []
      metrics.by_period[date] = dayTasks.length
    })

    // Buscar logs para métricas adicionais
    const { data: logs, error: logsError } = await supabase
      .from('relationship_logs')
      .select('action, channel, created_at')
      .eq('tenant_id', tenant_id)
      .gte('created_at', startDate.toISOString())

    if (!logsError && logs) {
      const logMetrics = {
        total_logs: logs.length,
        by_action: {} as Record<string, number>,
        by_channel: {} as Record<string, number>
      }

      logs.forEach(log => {
        logMetrics.by_action[log.action] = (logMetrics.by_action[log.action] || 0) + 1
        logMetrics.by_channel[log.channel] = (logMetrics.by_channel[log.channel] || 0) + 1
      })

      // Adicionar métricas de logs
      Object.assign(metrics, logMetrics)
    }

    return NextResponse.json({
      success: true,
      data: {
        period,
        start_date: startDate.toISOString(),
        end_date: now.toISOString(),
        metrics,
        performance: {
          duration_ms: Date.now() - startTime,
          tasks_processed: tasks?.length || 0,
          logs_processed: logs?.length || 0
        }
      }
    })

  } catch (error) {
    console.error('Analytics error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      duration_ms: Date.now() - startTime
    }, { status: 500 })
  }
}
