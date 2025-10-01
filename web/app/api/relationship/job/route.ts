/**
 * GATE 10.6.2 - Motor de Relacionamento
 * Job diÃ¡rio 03:00 para gerar/atualizar tarefas em lote
 * 
 * Funcionalidades:
 * - Queries Ãºnicas por Ã¢ncora + Ã­ndices
 * - Rate limiting (mÃ¡x. N tarefas/dia por aluno)
 * - Dedup por chave lÃ³gica
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

// Rate limiting: mÃ¡ximo de tarefas por aluno por dia
const MAX_TASKS_PER_STUDENT_PER_DAY = 3

type EventCode =
  | 'sale_close'
  | 'first_workout'
  | 'weekly_followup'
  | 'monthly_review'
  | 'birthday'
  | 'renewal_window'
  | 'occurrence_followup'

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
  anchor: EventCode
  suggested_offset: string
  channel_default: string
  message_v1: string
  message_v2?: string
  audience_filter: any
  variables: string[]
  active: boolean
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
 * Aplicar filtros de audiÃªncia em memÃ³ria
 */
function applyAudienceFilter(students: StudentData[], filter: any): StudentData[] {
  if (!filter || Object.keys(filter).length === 0) {
    return students
  }

  return students.filter(student => {
    // Filtro por status (se especificado)
    if (filter.status && Array.isArray(filter.status)) {
      // Para simplificar, assumimos que todos os alunos retornados sÃ£o 'active'
      // Em implementaÃ§Ã£o real, vocÃª verificaria o status real do aluno
    }

    // Filtro por tags (se especificado)
    if (filter.tags && Array.isArray(filter.tags)) {
      // Implementar filtro por tags quando disponÃ­vel
    }

    // Filtro por trainer_id (se especificado)
    if (filter.trainer_id) {
      // Implementar filtro por trainer quando disponÃ­vel
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
 * Renderizar mensagem com variÃ¡veis
 */
function renderMessage(template: string, student: StudentData): string {
  let message = template
  
  // Substituir variÃ¡veis bÃ¡sicas
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

function startOfDayISO(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function endOfDayISO(date = new Date()) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

// Buscar alunos elegÃ­veis por Ã¢ncora sem usar RPCs
async function fetchStudentsForAnchor(anchor: EventCode, tenantId: string): Promise<StudentData[]> {
  // New implementation without RPC execute_sql
  const students = await fetchStudentsForAnchor(anchor, tenantId)
  if (!students || students.length === 0) {
    return { created, updated, skipped, errors }
  }

  for (const template of anchorTemplates) {
    const filteredStudents = applyAudienceFilter(students as any, template.audience_filter)
    for (const student of filteredStudents) {
      try {
        const canCreate = await checkRateLimit(student.id, tenantId)
        if (!canCreate) {
          skipped++
          continue
        }

        const scheduledDate = calculateScheduledDate(student.anchor_date, template.suggested_offset)

        const dayStart = new Date(scheduledDate)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(scheduledDate)
        dayEnd.setHours(23, 59, 59, 999)

        const { data: existingTask } = await supabase
          .from('relationship_tasks')
          .select('id')
          .eq('student_id', student.id)
          .eq('template_code', template.code)
          .eq('anchor', anchor)
          .gte('scheduled_for', dayStart.toISOString())
          .lt('scheduled_for', dayEnd.toISOString())
          .maybeSingle()

        if (existingTask) {
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
          const renderedMessage = renderMessage(template.message_v1, student)
          const { data: inserted, error: insertError } = await supabase
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
            .select('id')
            .single()
          if (insertError) {
            errors.push(`Erro ao criar tarefa para ${student.name}: ${insertError.message}`)
          } else {
            created++
            const taskId = inserted?.id
            if (taskId) {
              await supabase
                .from('relationship_logs')
                .insert({
                  student_id: student.id,
                  task_id: taskId,
                  action: 'created',
                  channel: template.channel_default,
                  template_code: template.code,
                  meta: { anchor, scheduled_for: scheduledDate.toISOString() }
                })
            }
          }
        }
      } catch (e: any) {
        errors.push(`Erro ao processar aluno ${student.name}: ${e?.message || String(e)}`)
      }
    }
  }

  return { created, updated, skipped, errors }
    if (anchor === 'sale_close') {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, email, phone, created_at, tenant_id')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .gte('created_at', startOfDayISO())
        .lte('created_at', endOfDayISO())
      if (error) return []
      return (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        anchor_date: s.created_at,
        tenant_id: s.tenant_id,
      }))
    }

    if (anchor === 'birthday') {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, email, phone, birth_date, tenant_id')
        .eq('tenant_id', tenantId)
        .not('birth_date', 'is', null)
      if (error) return []
      const today = new Date()
      const m = today.getMonth() + 1
      const d = today.getDate()
      return (data || [])
        .filter((s: any) => {
          if (!s.birth_date) return false
          const bd = new Date(s.birth_date)
          return bd.getMonth() + 1 === m && bd.getDate() === d
        })
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          anchor_date: s.birth_date,
          tenant_id: s.tenant_id,
        }))
    }

    if (anchor === 'occurrence_followup') {
      const { data: occs, error: occErr } = await supabase
        .from('student_occurrences')
        .select('student_id, reminder_at, tenant_id')
        .eq('tenant_id', tenantId)
        .gte('reminder_at', startOfDayISO())
        .lte('reminder_at', endOfDayISO())
      if (occErr || !occs || occs.length === 0) return []

      const studentIds = Array.from(new Set(occs.map((o: any) => o.student_id)))
      const { data: students, error: stuErr } = await supabase
        .from('students')
        .select('id, name, email, phone, tenant_id')
        .in('id', studentIds)
      if (stuErr) return []
      const map = new Map<string, any>()
      for (const s of students || []) map.set(s.id, s)

      return occs
        .map((o: any) => {
          const s = map.get(o.student_id)
          if (!s) return null
          return {
            id: s.id,
            name: s.name,
            email: s.email,
            phone: s.phone,
            anchor_date: o.reminder_at,
            tenant_id: s.tenant_id,
          } as StudentData
        })
        .filter(Boolean) as StudentData[]
    }

    // first_workout, weekly_followup, monthly_review, renewal_window
    // Campos podem nÃ£o existir ainda; retornar vazio
    return []
  } catch {
    return []
  }
}

// Carregar templates ativos da tabela MVP (JSON em content)
async function fetchActiveTemplates(tenantId: string): Promise<TemplateData[]> {
  const { data, error } = await supabase
    .from('relationship_templates')
    .select('id, tenant_id, content')
    .eq('tenant_id', tenantId)
  if (error || !data) return []

  const templates: TemplateData[] = []
  for (const row of data) {
    try {
      const parsed = JSON.parse((row as any).content || '{}')
      if (!parsed || parsed.active !== true) continue
      const anchor = parsed.anchor as EventCode
      const code = String(parsed.code || '')
      if (!code || !anchor) continue
      templates.push({
        id: (row as any).id,
        code,
        anchor,
        suggested_offset: String(parsed.suggested_offset || '+0d'),
        channel_default: String(parsed.channel_default || 'whatsapp'),
        message_v1: String(parsed.message_v1 || ''),
        message_v2: parsed.message_v2 ? String(parsed.message_v2) : undefined,
        audience_filter: parsed.audience_filter || {},
        variables: Array.isArray(parsed.variables) ? parsed.variables : [],
        active: true,
      })
    } catch {
      // ignora linhas invÃ¡lidas
    }
  }
  return templates
}

/**
 * Processar uma Ã¢ncora especÃ­fica
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
    // Buscar alunos para esta Ã¢ncora
    const { data: students, error: studentsError } = await supabase

    if (studentsError) {
      errors.push(`Erro ao buscar alunos para Ã¢ncora ${anchor}: ${studentsError.message}`)
      return { created, updated, skipped, errors }
    }

    if (!students || students.length === 0) {
      return { created, updated, skipped, errors }
    }

    // Processar cada template desta Ã¢ncora
    for (const template of anchorTemplates) {
      // Aplicar filtros de audiÃªncia
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
          
          // Verificar se jÃ¡ existe tarefa para este aluno/template/data
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
    errors.push(`Erro geral ao processar Ã¢ncora ${anchor}: ${error.message}`)
  }

  return { created, updated, skipped, errors }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verificar se Ã© chamada autorizada (cron job ou admin)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenant_id } = await request.json().catch(() => ({}))
    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })
    }

    // Buscar templates ativos (MVP via JSON em content)
    const templates = await fetchActiveTemplates(tenant_id)

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

    // Processar cada Ã¢ncora
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
      details: (error as any)?.message || String(error),
      duration_ms: Date.now() - startTime
    }, { status: 500 })
  }
}

