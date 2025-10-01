
// ForÃ§ar execuÃ§Ã£o dinÃ¢mica para evitar problemas de renderizaÃ§Ã£o estÃ¡tica
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GATE 10.6.5 - API para Logs de Relacionamento do Aluno
 * 
 * Funcionalidades:
 * - Listar logs de relacionamento de um aluno especÃ­fico
 * - Filtros por aÃ§Ã£o, canal, template, perÃ­odo
 * - PaginaÃ§Ã£o e ordenaÃ§Ã£o cronolÃ³gica
 * - Performance otimizada
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withOccurrencesRBAC } from '@/server/withOccurrencesRBAC'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOccurrencesRBAC(request, 'occurrences.read', async (request, { user, membership, tenant_id }) => {
    try {
      const { id: studentId } = await params
      const supabase = await createClient()
      const startTime = Date.now()

      const { searchParams } = new URL(request.url)
      
      // Filtros
      const action = searchParams.get('action') // created, sent, snoozed, skipped, failed, recalculated
      const channel = searchParams.get('channel') // whatsapp, email, manual, system
      const template_code = searchParams.get('template_code') // MSG1, MSG2, etc.
      const date_from = searchParams.get('date_from')
      const date_to = searchParams.get('date_to')
      
      // PaginaÃ§Ã£o e ordenaÃ§Ã£o
      const sort_by = searchParams.get('sort_by') || 'at'
      const sort_order = searchParams.get('sort_order') || 'desc'
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
      const page_size = Math.min(100, Math.max(1, parseInt(searchParams.get('page_size') || '20', 10)))

      // Verificar se o aluno pertence ao tenant
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, name')
        .eq('id', studentId)
        .eq('tenant_id', tenant_id)
        .single()

      if (studentError || !student) {
        return NextResponse.json({ error: 'Aluno nÃ£o encontrado' }, { status: 404 })
      }


      // Construir query base
      let query = supabase
        .from('relationship_logs')
        .select(`
          id,
          student_id,
          task_id,
          action,
          channel,
          template_code,
          meta,
          at
        `, { count: 'exact' })
        .eq('student_id', studentId)
        .not('action', 'eq', 'deleted') // Excluir logs de tarefas deletadas

      // Aplicar filtros
      if (action && action !== 'all') {
        query = query.eq('action', action)
      }
      if (channel && channel !== 'all') {
        query = query.eq('channel', channel)
      }
      if (template_code && template_code !== 'all') {
        query = query.eq('template_code', template_code)
      }
      if (date_from) {
        query = query.gte('at', date_from)
      }
      if (date_to) {
        query = query.lte('at', date_to)
      }

      // Aplicar paginaÃ§Ã£o e ordenaÃ§Ã£o
      const from_idx = (page - 1) * page_size
      const to_idx = from_idx + page_size - 1

      console.log('ðŸ” [DEBUG] Executando query com filtros:', {
        studentId,
        action,
        channel,
        template_code,
        date_from,
        date_to,
        page,
        page_size
      })

      // Log da query SQL que serÃ¡ executada
      console.log('ðŸ” [DEBUG] Query SQL final:', {
        table: 'relationship_logs',
        select: 'id, student_id, task_id, action, channel, template_code, meta, at',
        where: `student_id = '${studentId}'`,
        order: `${sort_by} ${sort_order === 'asc' ? 'ASC' : 'DESC'}`,
        range: `${from_idx} to ${to_idx}`
      })

      const { data: logs, error, count } = await query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(from_idx, to_idx)

      console.log('ðŸ” [DEBUG] API - Resultado da query:', {
        logsCount: logs?.length || 0,
        totalCount: count,
        error: error?.message,
        studentId,
        tenant_id
      })

      // Log detalhado dos dados retornados
      if (logs && logs.length > 0) {
        console.log('ðŸ” [DEBUG] API - Dados encontrados:', logs.slice(0, 2))
      } else {
        console.log('ðŸ” [DEBUG] API - Nenhum dado encontrado, verificando RLS...')
        
        // Testar query sem RLS para debug
        const { data: debugLogs, error: debugError } = await supabase
          .from('relationship_logs')
          .select('id, student_id, action, at')
          .eq('student_id', studentId)
          .limit(5)
        
        console.log('ðŸ” [DEBUG] API - Query de debug (sem RLS):', {
          debugLogsCount: debugLogs?.length || 0,
          debugError: debugError?.message,
          debugLogs: debugLogs?.slice(0, 2)
        })

        // Testar query ainda mais simples - apenas contar registros
        const { count: totalCount, error: countError } = await supabase
          .from('relationship_logs')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', studentId)
        
        console.log('ðŸ” [DEBUG] API - Contagem total de logs:', {
          totalCount,
          countError: countError?.message
        })

        // Testar query sem filtro de student_id
        const { data: allLogs, error: allError } = await supabase
          .from('relationship_logs')
          .select('id, student_id, action, at')
          .limit(3)
        
        console.log('ðŸ” [DEBUG] API - Todos os logs (sem filtro):', {
          allLogsCount: allLogs?.length || 0,
          allError: allError?.message,
          allLogs: allLogs?.slice(0, 2)
        })
      }

      if (error) {
        console.error('âŒ [DEBUG] API - Erro na query:', error)
        return NextResponse.json({ error: 'Erro ao buscar logs' }, { status: 500 })
      }

      // Enriquecer logs com informaÃ§Ãµes da tarefa (se disponÃ­vel)
      const taskIds = Array.from(new Set((logs || []).map(log => log.task_id).filter(Boolean)))
      const taskMap: Record<string, any> = {}
      
      if (taskIds.length > 0) {
        const { data: tasks } = await supabase
          .from('relationship_tasks')
          .select('id, template_code, anchor, scheduled_for, status, payload')
          .in('id', taskIds)
        
        for (const task of tasks || []) {
          taskMap[task.id] = task
        }
      }

      // Enriquecer dados com informaÃ§Ãµes da tarefa
      const enriched_logs = (logs || []).map(log => ({
        ...log,
        task: log.task_id ? taskMap[log.task_id] : null,
        student_name: student.name
      }))

      const end_time = Date.now()
      const query_time = end_time - startTime

      return NextResponse.json({
        data: enriched_logs,
        pagination: {
          page,
          page_size,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / page_size)
        },
        filters: {
          action,
          channel,
          template_code,
          date_from,
          date_to
        },
        student: {
          id: student.id,
          name: student.name
        }
      }, {
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
          'X-Query-Time': String(query_time),
          'X-Row-Count': String(enriched_logs.length)
        }
      })

    } catch (error) {
      console.error('Erro na API /students/[id]/relationship-logs:', error)
      return NextResponse.json({ 
        error: 'Erro interno do servidor',
        details: (error as any)?.message || String(error) 
      }, { status: 500 })
    }
  })
}
