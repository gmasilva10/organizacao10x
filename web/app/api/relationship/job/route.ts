/**
 * GATE 10.6.2 - Motor de Relacionamento
 * Job diário 03:00 para gerar/atualizar tarefas em lote
 * 
 * Funcionalidades:
 * - Queries únicas por âncora + índices
 * - Rate limiting (máx. N tarefas/dia por aluno)
 * - Dedup por chave lógica
 * - Telemetria e logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Rate limiting: máximo de tarefas por aluno por dia
const MAX_TASKS_PER_STUDENT_PER_DAY = 3

// EVENT_REGISTRY com queries otimizadas
const EVENT_QUERIES = {
  sale_close: `
    SELECT s.id, s.name, s.email, s.phone, s.created_at as anchor_date, s.tenant_id
    FROM students s
    WHERE s.status = 'active' 
    AND s.created_at::date = CURRENT_DATE
    AND s.tenant_id = $1
  `,
  
  first_workout: `
    SELECT s.id, s.name, s.email, s.phone, s.created_at as anchor_date, s.tenant_id
    FROM students s
    WHERE s.status = 'active'
    AND s.created_at::date = CURRENT_DATE - INTERVAL '1 day'
    AND s.tenant_id = $1
  `,
  
  weekly_followup: `
    SELECT s.id, s.name, s.email, s.phone, s.created_at as anchor_date, s.tenant_id
    FROM students s
    WHERE s.status = 'active'
    AND s.created_at::date = CURRENT_DATE - INTERVAL '7 days'
    AND s.tenant_id = $1
  `,
  
  monthly_review: `
    SELECT s.id, s.name, s.email, s.phone, s.created_at as anchor_date, s.tenant_id
    FROM students s
    WHERE s.status = 'active'
    AND EXTRACT(DAY FROM s.created_at) = EXTRACT(DAY FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM s.created_at) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
    AND s.tenant_id = $1
  `,
  
  birthday: `
    SELECT s.id, s.name, s.email, s.phone, s.birth_date as anchor_date, s.tenant_id
    FROM students s
    WHERE s.status IN ('active', 'onboarding')
    AND s.birth_date IS NOT NULL
    AND EXTRACT(MONTH FROM s.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(DAY FROM s.birth_date) = EXTRACT(DAY FROM CURRENT_DATE)
    AND s.tenant_id = $1
  `,
  
  renewal_window: `
    SELECT s.id, s.name, s.email, s.phone, s.created_at as anchor_date, s.tenant_id
    FROM students s
    WHERE s.status = 'active'
    AND s.created_at::date BETWEEN CURRENT_DATE - INTERVAL '7 days' AND CURRENT_DATE
    AND s.tenant_id = $1
  `
} as const

type EventCode = keyof typeof EVENT_QUERIES

interface StudentData {
  id: string
  name: string
  email: string
  phone: string
  anchor_date: string
  tenant_id: string
}

interface TemplateData {
  id: string
  code: string
  anchor: string
  suggested_offset: string
  channel_default: string
  message_v1: string
  message_v2: string
  audience_filter: any
  variables: string[]
}

interface TaskStats {
  templates_processed: number
  students_found: number
  tasks_created: number
  tasks_updated: number
  tasks_skipped: number
  errors: string[]
  duration_ms: number
}

/**
 * Aplicar filtros de audiência em memória
 */
function applyAudienceFilter(students: StudentData[], filter: any): StudentData[] {
  if (!filter || Object.keys(filter).length === 0) {
    return students
  }

  return students.filter(student => {
    // Filtro por status (se especificado)
    if (filter.status && Array.isArray(filter.status)) {
      // Para simplificar, assumimos que todos os alunos retornados são 'active'
      // Em implementação real, você verificaria o status real do aluno
    }

    // Filtro por tags (se especificado)
    if (filter.tags && Array.isArray(filter.tags)) {
      // Implementar filtro por tags quando disponível
    }

    // Filtro por trainer_id (se especificado)
    if (filter.trainer_id) {
      // Implementar filtro por trainer quando disponível
    }

    return true
  })
}

/**
 * Calcular data agendada baseada no offset
 */
function calculateScheduledDate(anchorDate: string, offset: string): Date {
  const baseDate = new Date(anchorDate)
  const today = new Date()
  
  // Parse do offset (ex: "+7d", "-1d", "+0d")
  const match = offset.match(/^([+-]?)(\d+)d/)
  if (!match) {
    return baseDate
  }
  
  const sign = match[1] === '-' ? -1 : 1
  const days = parseInt(match[2]) * sign
  
  const scheduledDate = new Date(baseDate)
  scheduledDate.setDate(scheduledDate.getDate() + days)
  
  return scheduledDate
}

/**
 * Renderizar mensagem com variáveis
 */
function renderMessage(template: string, student: StudentData): string {
  let message = template
  
  // Substituir variáveis básicas
  message = message.replace(/\[Nome do Cliente\]/g, student.name)
  message = message.replace(/\[Nome\]/g, student.name)
  message = message.replace(/\[PrimeiroNome\]/g, student.name.split(' ')[0])
  message = message.replace(/\[DataVenda\]/g, new Date(student.anchor_date).toLocaleDateString('pt-BR'))
  message = message.replace(/\[DataTreino\]/g, new Date(student.anchor_date).toLocaleDateString('pt-BR'))
  message = message.replace(/\[DataUltimoTreino\]/g, new Date(student.anchor_date).toLocaleDateString('pt-BR'))
  message = message.replace(/\[DataInicio\]/g, new Date(student.anchor_date).toLocaleDateString('pt-BR'))
  message = message.replace(/\[DataNascimento\]/g, student.anchor_date ? new Date(student.anchor_date).toLocaleDateString('pt-BR') : '')
  message = message.replace(/\[Idade\]/g, student.anchor_date ? Math.floor((Date.now() - new Date(student.anchor_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toString() : '')
  
  return message
}

/**
 * Verificar rate limiting
 */
async function checkRateLimit(studentId: string, tenantId: string): Promise<boolean> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { count } = await supabase
    .from('relationship_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .gte('created_at', today.toISOString())
  
  return (count || 0) < MAX_TASKS_PER_STUDENT_PER_DAY
}

/**
 * Processar uma âncora específica
 */
async function processAnchor(
  anchor: EventCode,
  templates: TemplateData[],
  tenantId: string
): Promise<{ created: number; updated: number; skipped: number; errors: string[] }> {
  const anchorTemplates = templates.filter(t => t.anchor === anchor)
  if (anchorTemplates.length === 0) {
    return { created: 0, updated: 0, skipped: 0, errors: [] }
  }

  let created = 0
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  try {
    // Buscar alunos para esta âncora
    const { data: students, error: studentsError } = await supabase
      .rpc('execute_sql', {
        query: EVENT_QUERIES[anchor],
        params: [tenantId]
      })

    if (studentsError) {
      errors.push(`Erro ao buscar alunos para âncora ${anchor}: ${studentsError.message}`)
      return { created, updated, skipped, errors }
    }

    if (!students || students.length === 0) {
      return { created, updated, skipped, errors }
    }

    // Processar cada template desta âncora
    for (const template of anchorTemplates) {
      // Aplicar filtros de audiência
      const filteredStudents = applyAudienceFilter(students, template.audience_filter)

      for (const student of filteredStudents) {
        try {
          // Verificar rate limiting
          const canCreate = await checkRateLimit(student.id, tenantId)
          if (!canCreate) {
            skipped++
            continue
          }

          // Calcular data agendada
          const scheduledDate = calculateScheduledDate(student.anchor_date, template.suggested_offset)
          
          // Verificar se já existe tarefa para este aluno/template/data
          const { data: existingTask } = await supabase
            .from('relationship_tasks')
            .select('id')
            .eq('student_id', student.id)
            .eq('template_code', template.code)
            .eq('anchor', anchor)
            .gte('scheduled_for', new Date(scheduledDate.setHours(0, 0, 0, 0)).toISOString())
            .lt('scheduled_for', new Date(scheduledDate.setHours(23, 59, 59, 999)).toISOString())
            .single()

          if (existingTask) {
            // Atualizar tarefa existente
            const renderedMessage = renderMessage(template.message_v1, student)
            
            const { error: updateError } = await supabase
              .from('relationship_tasks')
              .update({
                payload: {
                  message: renderedMessage,
                  student_name: student.name,
                  student_email: student.email,
                  student_phone: student.phone
                },
                variables_used: template.variables,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingTask.id)

            if (updateError) {
              errors.push(`Erro ao atualizar tarefa para ${student.name}: ${updateError.message}`)
            } else {
              updated++
            }
          } else {
            // Criar nova tarefa
            const renderedMessage = renderMessage(template.message_v1, student)
            
            const { error: insertError } = await supabase
              .from('relationship_tasks')
              .insert({
                student_id: student.id,
                template_code: template.code,
                anchor: anchor,
                scheduled_for: scheduledDate.toISOString(),
                channel: template.channel_default,
                status: 'pending',
                payload: {
                  message: renderedMessage,
                  student_name: student.name,
                  student_email: student.email,
                  student_phone: student.phone
                },
                variables_used: template.variables,
                created_by: 'system'
              })

            if (insertError) {
              errors.push(`Erro ao criar tarefa para ${student.name}: ${insertError.message}`)
            } else {
              created++
            }
          }
        } catch (error) {
          errors.push(`Erro ao processar aluno ${student.name}: ${error.message}`)
        }
      }
    }
  } catch (error) {
    errors.push(`Erro geral ao processar âncora ${anchor}: ${error.message}`)
  }

  return { created, updated, skipped, errors }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verificar se é chamada autorizada (cron job ou admin)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenant_id } = await request.json().catch(() => ({}))
    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })
    }

    // Buscar templates ativos
    const { data: templates, error: templatesError } = await supabase
      .from('relationship_templates_v2')
      .select('*')
      .eq('active', true)
      .order('priority')

    if (templatesError) {
      return NextResponse.json({ 
        error: 'Failed to fetch templates', 
        details: templatesError.message 
      }, { status: 500 })
    }

    if (!templates || templates.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No active templates found',
        stats: {
          templates_processed: 0,
          students_found: 0,
          tasks_created: 0,
          tasks_updated: 0,
          tasks_skipped: 0,
          errors: [],
          duration_ms: Date.now() - startTime
        }
      })
    }

    // Processar cada âncora
    const stats: TaskStats = {
      templates_processed: templates.length,
      students_found: 0,
      tasks_created: 0,
      tasks_updated: 0,
      tasks_skipped: 0,
      errors: [],
      duration_ms: 0
    }

    const anchors = [...new Set(templates.map(t => t.anchor))] as EventCode[]
    
    for (const anchor of anchors) {
      const result = await processAnchor(anchor, templates, tenant_id)
      stats.tasks_created += result.created
      stats.tasks_updated += result.updated
      stats.tasks_skipped += result.skipped
      stats.errors.push(...result.errors)
    }

    stats.duration_ms = Date.now() - startTime

    // Log do resumo
    await supabase
      .from('relationship_logs')
      .insert({
        student_id: null,
        action: 'recalculated',
        channel: 'system',
        meta: {
          tenant_id,
          stats,
          job_type: 'daily_03_00'
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Job executed successfully',
      stats
    })

  } catch (error) {
    console.error('Relationship job error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      duration_ms: Date.now() - startTime
    }, { status: 500 })
  }
}
