// Forcar execucao dinamica para evitar problemas de renderizacao estatica
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GATE 10.6.3 - API para Tarefas de Relacionamento
 * 
 * Funcionalidades:
 * - Listar tarefas com filtros avancados
 * - Paginacao e ordenacao
 * - Filtros por status, ancora, template, canal, datas
 * - Performance otimizada com indices
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createClientAdmin } from '@/utils/supabase/server'
import { resolveRequestContext } from '@/server/context'
import { normalizePagination, normalizeDateFilters, normalizeStringFilters } from '@/lib/query-utils'

interface TaskFilters {
  status?: string
  anchor?: string
  template_code?: string
  channel?: string
  student_id?: string
  scheduled_from?: string
  scheduled_to?: string
  created_from?: string
  created_to?: string
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

interface TaskResponse {
  tasks: any[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
  filters: TaskFilters
  performance: {
    query_time_ms: number
    total_time_ms: number
  }
}

/**
 * Construir query com filtros
 */
function buildTaskQuery(supabase: any, filters: TaskFilters, tenantId: string) {
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
      created_at,
      updated_at,
      created_by,
      student:students!inner(
        id,
        name,
        email,
        phone
      )
    `, { count: 'exact' })
    .eq('org_id', tenantId)

  // Filtros opcionais
  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.anchor) {
    query = query.eq('anchor', filters.anchor)
  }

  if (filters.template_code) {
    query = query.eq('template_code', filters.template_code)
  }

  if (filters.channel) {
    query = query.eq('channel', filters.channel)
  }

  if (filters.student_id) {
    query = query.eq('student_id', filters.student_id)
  }

  if (filters.scheduled_from) {
    query = query.gte('scheduled_for', filters.scheduled_from)
  }

  if (filters.scheduled_to) {
    query = query.lte('scheduled_for', filters.scheduled_to)
  }

  if (filters.created_from) {
    query = query.gte('created_at', filters.created_from)
  }

  if (filters.created_to) {
    query = query.lte('created_at', filters.created_to)
  }

  // Ordenacao
  const sortBy = filters.sort_by || 'scheduled_for'
  const sortOrder = filters.sort_order || 'asc'
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Paginacao
  const { page, limit, offset } = normalizePagination(filters.page, filters.limit)
  const from = offset
  const to = from + limit - 1

  query = query.range(from, to)

  return { query, page, limit }
}

/**
 * Buscar estatisticas de tarefas
 */
async function getTaskStats(supabase: any, tenantId: string) {
  const [totalResult, statusResult, anchorResult] = await Promise.all([
    supabase
      .from('relationship_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', tenantId),
    
    supabase
      .from('relationship_tasks')
      .select('status')
      .eq('org_id', tenantId),
    
    supabase
      .from('relationship_tasks')
      .select('anchor')
      .eq('org_id', tenantId)
  ])

  const total = totalResult.count || 0
  const statusCounts: Record<string, number> = {}
  const anchorCounts: Record<string, number> = {}

  // Contar por status
  if (statusResult.data) {
    statusResult.data.forEach((task: any) => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1
    })
  }

  // Contar por ancora
  if (anchorResult.data) {
    anchorResult.data.forEach((task: any) => {
      anchorCounts[task.anchor] = (anchorCounts[task.anchor] || 0) + 1
    })
  }

  return {
    total,
    by_status: statusCounts,
    by_anchor: anchorCounts
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Resolver contexto de autenticacao
    const ctx = await resolveRequestContext(request)
    
    if (!ctx || !ctx.org_id) {
      return NextResponse.json(
        { error: "unauthorized", message: "Tenant nao resolvido no contexto da requisicao." },
        { status: 401 }
      )
    }

    // Parsear filtros da query string com normalização segura
    const url = new URL(request.url)
    const rawFilters = {
      status: url.searchParams.get('status'),
      anchor: url.searchParams.get('anchor'),
      template_code: url.searchParams.get('template_code'),
      channel: url.searchParams.get('channel'),
      student_id: url.searchParams.get('student_id'),
      scheduled_from: url.searchParams.get('scheduled_from'),
      scheduled_to: url.searchParams.get('scheduled_to'),
      created_from: url.searchParams.get('created_from'),
      created_to: url.searchParams.get('created_to'),
      page: url.searchParams.get('page'),
      limit: url.searchParams.get('limit'),
      sort_by: url.searchParams.get('sort_by'),
      sort_order: url.searchParams.get('sort_order')
    }

    // Normalizar filtros de string
    const stringFilters = normalizeStringFilters(rawFilters)
    
    // Normalizar filtros de data
    const dateFilters = normalizeDateFilters(rawFilters.scheduled_from, rawFilters.scheduled_to)
    const createdDateFilters = normalizeDateFilters(rawFilters.created_from, rawFilters.created_to)
    
    // Normalizar paginação
    const pagination = normalizePagination(rawFilters.page, rawFilters.limit)

    const filters: TaskFilters = {
      ...stringFilters,
      ...dateFilters,
      created_from: createdDateFilters.date_from,
      created_to: createdDateFilters.date_to,
      page: pagination.page,
      limit: pagination.limit,
      sort_order: (rawFilters.sort_order as 'asc' | 'desc') || undefined
    }

    // Criar cliente Supabase
    const supabase = await createClientAdmin()

    // Construir query
    const { query, page, limit } = buildTaskQuery(supabase, filters, ctx.org_id)

    // Executar query
    const queryStartTime = Date.now()
    const { data: tasks, error, count } = await query
    const queryTime = Date.now() - queryStartTime

    if (error) {
      console.error('Erro ao buscar tarefas:', error)
      return NextResponse.json(
        { error: "Erro ao buscar tarefas", details: error.message },
        { status: 500 }
      )
    }

    // Buscar estatisticas
    const stats = await getTaskStats(supabase, ctx.org_id)

    // Calcular paginacao
    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    // Preparar resposta
    const response: TaskResponse = {
      tasks: tasks || [],
      pagination: {
        page,
        page_size: limit,
        total,
        total_pages: totalPages
      },
      filters,
      performance: {
        query_time_ms: queryTime,
        total_time_ms: Date.now() - startTime
      }
    }

    return NextResponse.json(response, {
      headers: {
        'X-Query-Time': queryTime.toString(),
        'X-Total-Count': total.toString(),
        'X-Page': page.toString(),
        'X-Total-Pages': totalPages.toString(),
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache'
      }
    })

  } catch (error) {
    console.error("Erro na API de tarefas de relacionamento:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: (error as any)?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Resolver contexto de autenticacao
    const ctx = await resolveRequestContext(request)
    
    if (!ctx || !ctx.org_id) {
      return NextResponse.json(
        { error: "unauthorized", message: "Tenant nao resolvido no contexto da requisicao." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      student_id,
      template_code,
      anchor,
      scheduled_for,
      channel = 'whatsapp',
      status = 'pending',
      payload = {},
      variables_used = [],
      created_by = 'manual'
    } = body

    // Validacoes obrigatorias
    if (!student_id || !template_code || !anchor || !scheduled_for) {
      return NextResponse.json(
        { error: "Campos obrigatorios: student_id, template_code, anchor, scheduled_for" },
        { status: 400 }
      )
    }

    // Criar cliente Supabase
    const supabase = await createClientAdmin()

    // Verificar se o aluno existe
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, email, phone')
      .eq('id', student_id)
      .eq('org_id', ctx.org_id)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: "Aluno nao encontrado" },
        { status: 404 }
      )
    }

    // Criar tarefa
    const { data: task, error: createError } = await supabase
      .from('relationship_tasks')
      .insert({
        org_id: ctx.org_id,
        student_id,
        template_code,
        anchor,
        scheduled_for,
        channel,
        status,
        payload: {
          message: payload.message || '',
          student_name: student.name,
          student_email: student.email,
          student_phone: student.phone,
          ...payload
        },
        variables_used,
        created_by
      })
      .select()
      .single()

    if (createError) {
      console.error('Erro ao criar tarefa:', createError)
      return NextResponse.json(
        { error: "Erro ao criar tarefa", details: createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      task,
      performance: {
        total_time_ms: Date.now() - startTime
      }
    })

  } catch (error) {
    console.error("Erro na API de criacao de tarefa:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: (error as any)?.message },
      { status: 500 }
    )
  }
}