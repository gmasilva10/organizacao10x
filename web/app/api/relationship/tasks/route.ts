
// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GATE 10.6.3 - API para Tarefas de Relacionamento
 * 
 * Funcionalidades:
 * - Listar tarefas com filtros avançados
 * - Paginação e ordenação
 * - Filtros por status, âncora, template, canal, datas
 * - Performance otimizada com índices
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createClientAdmin } from '@/utils/supabase/server'
import { resolveRequestContext } from '@/server/context'

export async function GET(request: NextRequest) {
  try {
    // Para desenvolvimento, usar tenant fixo
    const tenant_id = 'fb381d42-9cf8-41d9-b0ab-fdb706a85ae7'
    
    // TODO: Implementar autenticação real em produção
    // const ctx = await resolveRequestContext(request)
    // if (!ctx) {
    //   return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    // }
    // const { tenant_id } = ctx
    try {
      // Para desenvolvimento, usar cliente admin que bypassa RLS
      const supabase = await createClientAdmin()
      const startTime = Date.now()

      const { searchParams } = new URL(request.url)
      
      // Filtros
      const status = searchParams.get('status') // pending, due_today, sent, snoozed, skipped, failed
      const anchor = searchParams.get('anchor') // sale_close, first_workout, etc.
      const template_code = searchParams.get('template_code') // MSG1, MSG2, etc.
      const channel = searchParams.get('channel') // whatsapp, email, manual
      const date_from = searchParams.get('date_from')
      const date_to = searchParams.get('date_to')
      const student_id = searchParams.get('student_id')
      const q = searchParams.get('q')?.trim() || ''
      
      // Paginação e ordenação
      const sort_by = searchParams.get('sort_by') || 'created_at'
      const sort_order = searchParams.get('sort_order') || 'desc'
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
      const page_size = Math.min(100, Math.max(1, parseInt(searchParams.get('page_size') || '20', 10)))

      // Para desenvolvimento, buscar todas as tarefas (sem filtro de estudante)
      let query = supabase
        .from('relationship_tasks')
        .select(`
          id,
          student_id,
          template_code,
          anchor,
          scheduled_for,
          channel,
          status,
          payload,
          variables_used,
          created_by,
          sent_at,
          notes,
          occurrence_id,
          created_at,
          updated_at
        `, { count: 'exact' })

      // Aplicar filtros
      if (status && status !== 'all') {
        query = query.eq('status', status)
      }
      if (anchor && anchor !== 'all') {
        query = query.eq('anchor', anchor)
      }
      if (template_code && template_code !== 'all') {
        query = query.eq('template_code', template_code)
      }
      if (channel && channel !== 'all') {
        query = query.eq('channel', channel)
      }
      if (date_from) {
        query = query.gte('scheduled_for', date_from)
      }
      if (date_to) {
        query = query.lte('scheduled_for', date_to)
      }
      if (student_id) {
        query = query.eq('student_id', student_id)
      }
      if (q) {
        // Busca por ID da tarefa ou notas
        const isNum = /^\d+$/.test(q)
        if (isNum) {
          query = query.or(`id.eq.${q},notes.ilike.%${q}%`)
        } else {
          query = query.ilike('notes', `%${q}%`)
        }
      }

      // Aplicar paginação e ordenação
      const from_idx = (page - 1) * page_size
      const to_idx = from_idx + page_size - 1

      const { data: tasks, error, count } = await query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(from_idx, to_idx)

      if (error) {
        console.error('Erro ao buscar tarefas:', error)
        return NextResponse.json({ error: 'Erro ao buscar tarefas' }, { status: 500 })
      }

      // Buscar dados dos alunos para enriquecer a resposta
      const student_ids = Array.from(new Set((tasks || []).map(t => t.student_id).filter(Boolean)))
      const student_map: Record<string, any> = {}
      
      if (student_ids.length > 0) {
        const { data: students } = await supabase
          .from('students')
          .select('id, name, email, phone, status')
          .in('id', student_ids)
          .eq('tenant_id', tenant_id)
        
        for (const student of students || []) {
          student_map[student.id] = student
        }
      }

      // Enriquecer dados com informações do aluno
      const enriched_tasks = (tasks || []).map(task => ({
        ...task,
        student: student_map[task.student_id] || null
      }))

      const end_time = Date.now()
      const query_time = end_time - startTime

      return NextResponse.json({
        items: enriched_tasks,
        data: enriched_tasks, // Compatibilidade
        pagination: {
          page,
          page_size,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / page_size)
        },
        filters: {
          status,
          anchor,
          template_code,
          channel,
          date_from,
          date_to,
          student_id,
          q
        }
      }, {
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
          'X-Query-Time': String(query_time),
          'X-Row-Count': String(enriched_tasks.length)
        }
      })

    } catch (error) {
      console.error('Erro na API /relationship/tasks:', error)
      return NextResponse.json({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Erro na autenticação /relationship/tasks:', error)
    return NextResponse.json({ 
      error: 'Erro de autenticação',
      details: error.message 
    }, { status: 401 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Para desenvolvimento, usar tenant fixo
    const tenant_id = 'fb381d42-9cf8-41d9-b0ab-fdb706a85ae7'
    const userId = 'dev-user-id'
    
    // TODO: Implementar autenticação real em produção
    // const ctx = await resolveRequestContext(request)
    // if (!ctx) {
    //   return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    // }
    // const { tenant_id, userId } = ctx
    try {
      // Para desenvolvimento, usar cliente admin que bypassa RLS
      const supabase = await createClientAdmin()
      const { task_id, status, notes } = await request.json()

      if (!task_id) {
        return NextResponse.json({ error: 'task_id é obrigatório' }, { status: 400 })
      }

      // Verificar se a tarefa pertence ao tenant
      const { data: task, error: taskError } = await supabase
        .from('relationship_tasks')
        .select(`
          id,
          student_id,
          status,
          payload,
          template_code,
          channel
        `)
        .eq('id', task_id)
        .in('student_id', 
          supabase
            .from('students')
            .select('id')
            .eq('tenant_id', tenant_id)
        )
        .single()

      if (taskError || !task) {
        return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
      }

      // Preparar dados de atualização
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (status) {
        updateData.status = status
        if (status === 'sent') {
          updateData.sent_at = new Date().toISOString()
        }
      }

      if (notes !== undefined) {
        updateData.notes = notes
      }

      // Atualizar tarefa
      const { error: updateError } = await supabase
        .from('relationship_tasks')
        .update(updateData)
        .eq('id', task_id)

      if (updateError) {
        console.error('Erro ao atualizar tarefa:', updateError)
        return NextResponse.json({ error: 'Erro ao atualizar tarefa' }, { status: 500 })
      }

      // Log da ação
      await supabase
        .from('relationship_logs')
        .insert({
          student_id: task.student_id,
          task_id: task_id,
          action: status === 'sent' ? 'sent' : 'updated',
          channel: task.channel,
          template_code: task.template_code,
          meta: {
            updated_by: userId,
            old_status: task.status,
            new_status: status,
            notes: notes
          }
        })

      return NextResponse.json({
        message: 'Tarefa atualizada com sucesso',
        task_id: task_id,
        status: status || task.status,
        notes: notes
      })

    } catch (error) {
      console.error('Erro na API PATCH /relationship/tasks:', error)
      return NextResponse.json({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Erro na autenticação PATCH /relationship/tasks:', error)
    return NextResponse.json({ 
      error: 'Erro de autenticação',
      details: error.message 
    }, { status: 401 })
  }
}
