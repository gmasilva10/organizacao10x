/**
 * GATE 10.6.2 - Motor de Relacionamento
 * Job diario 03:00 para gerar/atualizar tarefas em lote
 * 
 * Funcionalidades:
 * - Queries unicas por ancora + indices
 * - Rate limiting (max. N tarefas/dia por aluno)
 * - Dedup por chave logica
 * - Telemetria e logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  calculateTemporalSchedule, 
  extractAnchorDate, 
  shouldCreateTaskForStudent,
  getAnchorFieldForAnchor,
  generateTemporalDescription,
  type StudentData as TemporalStudentData,
  type TemporalConfig
} from '@/lib/relationship/temporal-processor'
import { renderMessage as renderMessageWithVariables, type RenderContext } from '@/lib/relationship/variable-renderer'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Rate limiting: maximo de tarefas por aluno por dia
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
  org_id: string
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
  temporal_offset_days?: number | null
  temporal_anchor_field?: string | null
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
 * Aplicar filtros de audiencia em memoria
 */
function applyAudienceFilter(students: StudentData[], filter: any): StudentData[] {
  if (!filter || Object.keys(filter).length === 0) {
    return students
  }

  return students.filter(student => {
    // Filtro por status (se especificado)
    if (filter.status && Array.isArray(filter.status)) {
      // Para simplificar, assumimos que todos os alunos retornados sao 'active'
      // Em implementacao real, voce verificaria o status real do aluno
    }

    // Filtro por tags (se especificado)
    if (filter.tags && Array.isArray(filter.tags)) {
      // Implementar filtro por tags quando disponivel
    }

    // Filtro por trainer_id (se especificado)
    if (filter.trainer_id) {
      // Implementar filtro por trainer quando disponivel
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
 * Renderizar mensagem com variáveis (wrapper para o novo sistema)
 */
async function renderMessage(template: string, student: StudentData): Promise<string> {
  const context: RenderContext = {
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      created_at: student.anchor_date,
      org_id: student.org_id
    }
  }
  
  return await renderMessageWithVariables(template, context)
}

/**
 * Verificar rate limiting
 */
async function checkRateLimit(studentId: string, orgId: string): Promise<boolean> {
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

// Buscar alunos elegiveis por ancora sem usar RPCs (sem recursao)
async function fetchStudentsForAnchor(anchor: EventCode, orgId: string): Promise<StudentData[]> {
  try {
    if (anchor === 'sale_close') {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, email, phone, created_at, org_id')
        .eq('org_id', orgId)
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
        org_id: s.org_id,
      }))
    }

    if (anchor === 'birthday') {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, email, phone, birth_date, org_id')
        .eq('org_id', orgId)
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
          org_id: s.org_id,
        }))
    }

    if (anchor === 'occurrence_followup') {
      const { data: occs, error: occErr } = await supabase
        .from('student_occurrences')
        .select('student_id, reminder_at, org_id')
        .eq('org_id', orgId)
        .gte('reminder_at', startOfDayISO())
        .lte('reminder_at', endOfDayISO())
      if (occErr || !occs || occs.length === 0) return []

      const studentIds = Array.from(new Set(occs.map((o: any) => o.student_id)))
      const { data: students, error: stuErr } = await supabase
        .from('students')
        .select('id, name, email, phone, org_id')
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
            org_id: s.org_id,
          } as StudentData
        })
        .filter(Boolean) as StudentData[]
    }

    // first_workout - alunos com primeiro treino agendado para hoje
    if (anchor === 'first_workout') {
      const { data, error} = await supabase
        .from('students')
        .select('id, name, email, phone, first_workout_date, org_id')
        .eq('org_id', orgId)
        .not('first_workout_date', 'is', null)
        .gte('first_workout_date', startOfDayISO())
        .lte('first_workout_date', endOfDayISO())
      if (error) return []
      return (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        anchor_date: s.first_workout_date,
        org_id: s.org_id,
      }))
    }

    // weekly_followup - alunos ativos para acompanhamento semanal
    if (anchor === 'weekly_followup') {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, email, phone, last_workout_date, org_id')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .not('last_workout_date', 'is', null)
      if (error) return []
      // Filtrar alunos que tiveram último treino há 7 dias
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]
      
      return (data || [])
        .filter((s: any) => {
          if (!s.last_workout_date) return false
          const lastWorkout = new Date(s.last_workout_date).toISOString().split('T')[0]
          return lastWorkout === sevenDaysAgoStr
        })
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          anchor_date: s.last_workout_date,
          org_id: s.org_id,
        }))
    }

    // monthly_review - alunos ativos para revisão mensal (aniversário do primeiro treino)
    if (anchor === 'monthly_review') {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, email, phone, first_workout_date, org_id')
        .eq('org_id', orgId)
        .eq('status', 'active')
      if (error) return []
      
      const today = new Date()
      const currentDay = today.getDate()
      
      return (data || [])
        .filter((s: any) => {
          if (!s.first_workout_date) return false
          const first = new Date(s.first_workout_date)
          return first.getDate() === currentDay
        })
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          anchor_date: s.first_workout_date,
          org_id: s.org_id,
        }))
    }

    // renewal_window - alunos com renovação próxima (próximos 7 dias)
    if (anchor === 'renewal_window') {
      const today = new Date()
      const in7Days = new Date(today)
      in7Days.setDate(in7Days.getDate() + 7)
      
      const { data, error } = await supabase
        .from('student_services')
        .select('student_id, next_renewal_date, org_id, students(id, name, email, phone, org_id)')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .eq('renewal_status', 'ativo')
        .not('next_renewal_date', 'is', null)
        .gte('next_renewal_date', startOfDayISO())
        .lte('next_renewal_date', in7Days.toISOString())
      
      if (error) return []
      
      return (data || [])
        .filter((s: any) => s.students)
        .map((s: any) => ({
          id: s.students.id,
          name: s.students.name,
          email: s.students.email,
          phone: s.students.phone,
          anchor_date: s.next_renewal_date,
          org_id: s.students.org_id,
        }))
    }

    // Âncora não implementada
    return []
  } catch {
    return []
  }
}

// Carregar templates ativos da tabela V2
async function fetchActiveTemplates(orgId: string): Promise<TemplateData[]> {
  const { data, error } = await supabase
    .from('relationship_templates_v2')
    .select('*')
    .eq('org_id', orgId)
    .eq('active', true)
  
  if (error || !data) return []

  return data.map((row: any) => ({
    id: row.id,
    code: row.code,
    anchor: row.anchor as EventCode,
    suggested_offset: row.suggested_offset || '+0d',
    channel_default: row.channel_default || 'whatsapp',
    message_v1: row.message_v1 || '',
    message_v2: row.message_v2 || undefined,
    audience_filter: row.audience_filter || {},
    variables: Array.isArray(row.variables) ? row.variables : [],
    active: row.active,
    temporal_offset_days: row.temporal_offset_days,
    temporal_anchor_field: row.temporal_anchor_field
  }))
}

/**
 * Processar uma ancora especifica com lógica temporal
 */
async function processAnchor(
  anchor: EventCode,
  templates: TemplateData[],
  orgId: string
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
    // Buscar alunos para esta ancora
    const students = await fetchStudentsForAnchor(anchor, orgId)

    if (!students || students.length === 0) {
      return { created, updated, skipped, errors }
    }

    // Processar cada template desta ancora
    for (const template of anchorTemplates) {
      // Aplicar filtros de audiencia
      const filteredStudents = applyAudienceFilter(students, template.audience_filter)

      for (const student of filteredStudents) {
        try {
          // Verificar rate limiting
          const canCreate = await checkRateLimit(student.id, orgId)
          if (!canCreate) {
            skipped++
            continue
          }

          // NOVA LÓGICA TEMPORAL
          // Determinar campo de âncora temporal
          const temporalAnchorField = template.temporal_anchor_field || getAnchorFieldForAnchor(anchor)
          
          // Criar configuração temporal
          const temporalConfig: TemporalConfig = {
            offsetDays: template.temporal_offset_days,
            anchorField: temporalAnchorField,
            anchorDate: null
          }

          // Verificar se deve criar tarefa baseado no offset temporal
          const shouldCreate = shouldCreateTaskForStudent(
            {
              id: student.id,
              first_workout_date: student.anchor_date, // Mapear conforme necessário
              last_workout_date: student.anchor_date,
              birth_date: student.anchor_date,
              start_date: student.anchor_date,
              end_date: student.anchor_date,
              next_renewal_date: student.anchor_date,
              created_at: student.anchor_date
            },
            temporalConfig
          )

          if (!shouldCreate) {
            skipped++
            continue
          }

          // Calcular data agendada usando lógica temporal
          let scheduledDate: Date
          if (template.temporal_offset_days !== null && temporalAnchorField) {
            const anchorDate = extractAnchorDate({
              id: student.id,
              first_workout_date: student.anchor_date,
              last_workout_date: student.anchor_date,
              birth_date: student.anchor_date,
              start_date: student.anchor_date,
              end_date: student.anchor_date,
              next_renewal_date: student.anchor_date,
              created_at: student.anchor_date
            }, temporalAnchorField)
            
            scheduledDate = calculateTemporalSchedule(anchorDate, template.temporal_offset_days) || new Date()
          } else {
            // Fallback para lógica antiga
            scheduledDate = calculateScheduledDate(student.anchor_date, template.suggested_offset)
          }
          
          // Verificar se ja existe tarefa para este aluno/template/data
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
            const renderedMessage = await renderMessage(template.message_v1, student)
            
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
            const renderedMessage = await renderMessage(template.message_v1, student)
            
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
          errors.push(`Erro ao processar aluno ${student.name}: ${(error as any)?.message || String(error)}`)
        }
      }
    }
  } catch (error) {
    errors.push(`Erro geral ao processar ancora ${anchor}: ${(error as any)?.message || String(error)}`)
  }

  return { created, updated, skipped, errors }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verificar se e chamada autorizada (cron job ou admin)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { org_id } = await request.json().catch(() => ({}))
    if (!org_id) {
      return NextResponse.json({ error: 'org_id required' }, { status: 400 })
    }

    // Buscar templates ativos (MVP via JSON em content)
    const templates = await fetchActiveTemplates(org_id)

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

    // Processar cada ancora
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
      const result = await processAnchor(anchor, templates, org_id)
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