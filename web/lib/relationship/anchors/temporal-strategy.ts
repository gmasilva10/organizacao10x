/**
 * Estratégia Temporal para Âncoras de Relacionamento
 * 
 * Processa âncoras baseadas em datas específicas do aluno (venda, primeiro treino, renovação).
 * Executa apenas quando há eventos específicos ou datas de referência.
 */

import { createClient } from '@supabase/supabase-js'
import { 
  BaseAnchorStrategy, 
  AnchorConfig, 
  AnchorResult, 
  AnchorStats, 
  AnchorSpecificData 
} from './base-strategy'
import { StudentData } from '../variable-context'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Estratégia para âncoras baseadas em fechamento de venda
 */
export class SaleCloseStrategy extends BaseAnchorStrategy {
  readonly type = 'temporal' as const
  readonly anchorCode = 'sale_close'

  async shouldCreateTaskForStudent(
    student: StudentData, 
    config: AnchorConfig
  ): Promise<AnchorResult> {
    const today = new Date()
    const createdDate = new Date(student.created_at)
    
    // Verificar se o aluno foi criado hoje (fechamento de venda hoje)
    if (createdDate.toDateString() !== today.toDateString()) {
      return {
        shouldCreate: false,
        scheduledDate: null,
        anchorData: null,
        reason: 'Aluno não foi criado hoje'
      }
    }

    const offsetDays = config.offsetDays ?? 0
    const scheduledDate = this.calculateScheduledDate(student.created_at, offsetDays)

    return {
      shouldCreate: true,
      scheduledDate,
      anchorData: {
        anchor_date: student.created_at,
        anchor_type: 'sale_close',
        additional_data: {
          sale_date: student.created_at,
          days_since_sale: 0
        }
      }
    }
  }

  async fetchEligibleStudents(orgId: string, config?: AnchorConfig): Promise<StudentData[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data, error } = await supabase
      .from('students')
      .select('id, name, email, phone, created_at, org_id, status, trainer_id')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())

    if (error) {
      console.error('Erro ao buscar alunos para sale_close:', error)
      return []
    }

    return (data || []).map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      created_at: s.created_at,
      org_id: s.org_id,
      status: s.status,
      trainer_id: s.trainer_id
    }))
  }

  async processAnchor(
    orgId: string, 
    templates: any[], 
    config?: AnchorConfig
  ): Promise<AnchorStats> {
    const startTime = Date.now()
    const stats: AnchorStats = {
      students_found: 0,
      tasks_created: 0,
      tasks_updated: 0,
      tasks_skipped: 0,
      errors: [],
      duration_ms: 0
    }

    try {
      const students = await this.fetchEligibleStudents(orgId, config)
      stats.students_found = students.length

      for (const template of templates) {
        if (template.anchor !== this.anchorCode) continue

        for (const student of students) {
          try {
            const result = await this.shouldCreateTaskForStudent(student, {
              ...config,
              offsetDays: template.temporal_offset_days ?? config?.offsetDays
            })

            if (!result.shouldCreate) {
              stats.tasks_skipped++
              continue
            }

            // Verificar se já existe tarefa
            const { data: existingTask } = await supabase
              .from('relationship_tasks')
              .select('id')
              .eq('student_id', student.id)
              .eq('template_code', template.code)
              .eq('anchor', this.anchorCode)
              .gte('scheduled_for', new Date(result.scheduledDate!.setHours(0, 0, 0, 0)).toISOString())
              .lt('scheduled_for', new Date(result.scheduledDate!.setHours(23, 59, 59, 999)).toISOString())
              .single()

            if (existingTask) {
              stats.tasks_skipped++
              continue
            }

            // Criar nova tarefa
            const { error: insertError } = await supabase
              .from('relationship_tasks')
              .insert({
                student_id: student.id,
                template_code: template.code,
                anchor: this.anchorCode,
                scheduled_for: result.scheduledDate!.toISOString(),
                channel: template.channel_default || 'whatsapp',
                status: 'pending',
                payload: {
                  message: template.message_v1, // Será renderizado posteriormente
                  student_name: student.name,
                  student_email: student.email,
                  student_phone: student.phone,
                  ...this.generateAnchorContext(student, result.anchorData!)
                },
                variables_used: template.variables || [],
                created_by: 'system_temporal_strategy'
              })

            if (insertError) {
              stats.errors.push(`Erro ao criar tarefa para ${student.name}: ${insertError.message}`)
            } else {
              stats.tasks_created++
            }
          } catch (error) {
            stats.errors.push(`Erro ao processar aluno ${student.name}: ${(error as any)?.message || String(error)}`)
          }
        }
      }
    } catch (error) {
      stats.errors.push(`Erro geral na estratégia ${this.anchorCode}: ${(error as any)?.message || String(error)}`)
    }

    stats.duration_ms = Date.now() - startTime
    return stats
  }

  generateAnchorContext(
    student: StudentData, 
    anchorData: AnchorSpecificData
  ): Record<string, any> {
    return {
      sale_date: anchorData.anchor_date,
      days_since_sale: this.calculateDaysSince(anchorData.anchor_date),
      sale_date_formatted: this.formatDateBR(anchorData.anchor_date)
    }
  }
}

/**
 * Estratégia para âncoras baseadas no primeiro treino
 */
export class FirstWorkoutStrategy extends BaseAnchorStrategy {
  readonly type = 'temporal' as const
  readonly anchorCode = 'first_workout'

  async shouldCreateTaskForStudent(
    student: StudentData, 
    config: AnchorConfig
  ): Promise<AnchorResult> {
    // Verificar se tem data do primeiro treino
    if (!student.first_workout_date) {
      return {
        shouldCreate: false,
        scheduledDate: null,
        anchorData: null,
        reason: 'Aluno não tem data de primeiro treino'
      }
    }

    const offsetDays = config.offsetDays ?? 1
    const scheduledDate = this.calculateScheduledDate(student.first_workout_date, offsetDays)

    return {
      shouldCreate: true,
      scheduledDate,
      anchorData: {
        anchor_date: student.first_workout_date,
        anchor_type: 'first_workout',
        additional_data: {
          first_workout_date: student.first_workout_date,
          days_since_first_workout: this.calculateDaysSince(student.first_workout_date)
        }
      }
    }
  }

  async fetchEligibleStudents(orgId: string, config?: AnchorConfig): Promise<StudentData[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data, error } = await supabase
      .from('students')
      .select('id, name, email, phone, created_at, org_id, status, trainer_id, first_workout_date')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .not('first_workout_date', 'is', null)
      .gte('first_workout_date', today.toISOString())
      .lt('first_workout_date', tomorrow.toISOString())

    if (error) {
      console.error('Erro ao buscar alunos para first_workout:', error)
      return []
    }

    return (data || []).map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      created_at: s.created_at,
      org_id: s.org_id,
      status: s.status,
      trainer_id: s.trainer_id,
      first_workout_date: s.first_workout_date
    }))
  }

  async processAnchor(
    orgId: string, 
    templates: any[], 
    config?: AnchorConfig
  ): Promise<AnchorStats> {
    const startTime = Date.now()
    const stats: AnchorStats = {
      students_found: 0,
      tasks_created: 0,
      tasks_updated: 0,
      tasks_skipped: 0,
      errors: [],
      duration_ms: 0
    }

    try {
      const students = await this.fetchEligibleStudents(orgId, config)
      stats.students_found = students.length

      for (const template of templates) {
        if (template.anchor !== this.anchorCode) continue

        for (const student of students) {
          try {
            const result = await this.shouldCreateTaskForStudent(student, {
              ...config,
              offsetDays: template.temporal_offset_days ?? config?.offsetDays
            })

            if (!result.shouldCreate) {
              stats.tasks_skipped++
              continue
            }

            // Verificar se já existe tarefa
            const { data: existingTask } = await supabase
              .from('relationship_tasks')
              .select('id')
              .eq('student_id', student.id)
              .eq('template_code', template.code)
              .eq('anchor', this.anchorCode)
              .gte('scheduled_for', new Date(result.scheduledDate!.setHours(0, 0, 0, 0)).toISOString())
              .lt('scheduled_for', new Date(result.scheduledDate!.setHours(23, 59, 59, 999)).toISOString())
              .single()

            if (existingTask) {
              stats.tasks_skipped++
              continue
            }

            // Criar nova tarefa
            const { error: insertError } = await supabase
              .from('relationship_tasks')
              .insert({
                student_id: student.id,
                template_code: template.code,
                anchor: this.anchorCode,
                scheduled_for: result.scheduledDate!.toISOString(),
                channel: template.channel_default || 'whatsapp',
                status: 'pending',
                payload: {
                  message: template.message_v1,
                  student_name: student.name,
                  student_email: student.email,
                  student_phone: student.phone,
                  ...this.generateAnchorContext(student, result.anchorData!)
                },
                variables_used: template.variables || [],
                created_by: 'system_temporal_strategy'
              })

            if (insertError) {
              stats.errors.push(`Erro ao criar tarefa para ${student.name}: ${insertError.message}`)
            } else {
              stats.tasks_created++
            }
          } catch (error) {
            stats.errors.push(`Erro ao processar aluno ${student.name}: ${(error as any)?.message || String(error)}`)
          }
        }
      }
    } catch (error) {
      stats.errors.push(`Erro geral na estratégia ${this.anchorCode}: ${(error as any)?.message || String(error)}`)
    }

    stats.duration_ms = Date.now() - startTime
    return stats
  }

  generateAnchorContext(
    student: StudentData, 
    anchorData: AnchorSpecificData
  ): Record<string, any> {
    return {
      first_workout_date: anchorData.anchor_date,
      days_since_first_workout: this.calculateDaysSince(anchorData.anchor_date),
      first_workout_date_formatted: this.formatDateBR(anchorData.anchor_date)
    }
  }
}

/**
 * Estratégia para âncoras baseadas em janela de renovação
 */
export class RenewalWindowStrategy extends BaseAnchorStrategy {
  readonly type = 'temporal' as const
  readonly anchorCode = 'renewal_window'

  async shouldCreateTaskForStudent(
    student: StudentData, 
    config: AnchorConfig
  ): Promise<AnchorResult> {
    // Para renewal_window, precisamos buscar dados de serviço
    // Por simplicidade, assumimos que já temos a data de renovação
    const renewalDate = config.additionalFilters?.renewal_date
    
    if (!renewalDate) {
      return {
        shouldCreate: false,
        scheduledDate: null,
        anchorData: null,
        reason: 'Data de renovação não encontrada'
      }
    }

    const offsetDays = config.offsetDays ?? -7 // 7 dias antes da renovação
    const scheduledDate = this.calculateScheduledDate(renewalDate, offsetDays)

    return {
      shouldCreate: true,
      scheduledDate,
      anchorData: {
        anchor_date: renewalDate,
        anchor_type: 'renewal_window',
        additional_data: {
          renewal_date: renewalDate,
          days_until_renewal: this.calculateDaysUntil(renewalDate)
        }
      }
    }
  }

  async fetchEligibleStudents(orgId: string, config?: AnchorConfig): Promise<StudentData[]> {
    const today = new Date()
    const in7Days = new Date(today)
    in7Days.setDate(in7Days.getDate() + 7)

    const { data, error } = await supabase
      .from('student_services')
      .select('student_id, next_renewal_date, org_id, students(id, name, email, phone, created_at, org_id, status, trainer_id)')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .eq('renewal_status', 'ativo')
      .not('next_renewal_date', 'is', null)
      .gte('next_renewal_date', today.toISOString())
      .lte('next_renewal_date', in7Days.toISOString())

    if (error) {
      console.error('Erro ao buscar alunos para renewal_window:', error)
      return []
    }

    return (data || [])
      .filter(s => s.students)
      .map(s => ({
        id: (s.students as any).id,
        name: (s.students as any).name,
        email: (s.students as any).email,
        phone: (s.students as any).phone,
        created_at: (s.students as any).created_at,
        org_id: (s.students as any).org_id,
        status: (s.students as any).status,
        trainer_id: (s.students as any).trainer_id,
        renewal_date: s.next_renewal_date
      }))
  }

  async processAnchor(
    orgId: string, 
    templates: any[], 
    config?: AnchorConfig
  ): Promise<AnchorStats> {
    const startTime = Date.now()
    const stats: AnchorStats = {
      students_found: 0,
      tasks_created: 0,
      tasks_updated: 0,
      tasks_skipped: 0,
      errors: [],
      duration_ms: 0
    }

    try {
      const students = await this.fetchEligibleStudents(orgId, config)
      stats.students_found = students.length

      for (const template of templates) {
        if (template.anchor !== this.anchorCode) continue

        for (const student of students) {
          try {
            const renewalDate = (student as any).renewal_date
            const result = await this.shouldCreateTaskForStudent(student, {
              ...config,
              offsetDays: template.temporal_offset_days ?? config?.offsetDays,
              additionalFilters: { renewal_date: renewalDate }
            })

            if (!result.shouldCreate) {
              stats.tasks_skipped++
              continue
            }

            // Verificar se já existe tarefa
            const { data: existingTask } = await supabase
              .from('relationship_tasks')
              .select('id')
              .eq('student_id', student.id)
              .eq('template_code', template.code)
              .eq('anchor', this.anchorCode)
              .gte('scheduled_for', new Date(result.scheduledDate!.setHours(0, 0, 0, 0)).toISOString())
              .lt('scheduled_for', new Date(result.scheduledDate!.setHours(23, 59, 59, 999)).toISOString())
              .single()

            if (existingTask) {
              stats.tasks_skipped++
              continue
            }

            // Criar nova tarefa
            const { error: insertError } = await supabase
              .from('relationship_tasks')
              .insert({
                student_id: student.id,
                template_code: template.code,
                anchor: this.anchorCode,
                scheduled_for: result.scheduledDate!.toISOString(),
                channel: template.channel_default || 'whatsapp',
                status: 'pending',
                payload: {
                  message: template.message_v1,
                  student_name: student.name,
                  student_email: student.email,
                  student_phone: student.phone,
                  ...this.generateAnchorContext(student, result.anchorData!)
                },
                variables_used: template.variables || [],
                created_by: 'system_temporal_strategy'
              })

            if (insertError) {
              stats.errors.push(`Erro ao criar tarefa para ${student.name}: ${insertError.message}`)
            } else {
              stats.tasks_created++
            }
          } catch (error) {
            stats.errors.push(`Erro ao processar aluno ${student.name}: ${(error as any)?.message || String(error)}`)
          }
        }
      }
    } catch (error) {
      stats.errors.push(`Erro geral na estratégia ${this.anchorCode}: ${(error as any)?.message || String(error)}`)
    }

    stats.duration_ms = Date.now() - startTime
    return stats
  }

  generateAnchorContext(
    student: StudentData, 
    anchorData: AnchorSpecificData
  ): Record<string, any> {
    return {
      renewal_date: anchorData.anchor_date,
      days_until_renewal: this.calculateDaysUntil(anchorData.anchor_date),
      renewal_date_formatted: this.formatDateBR(anchorData.anchor_date)
    }
  }
}
