/**
 * Estratégia Recorrente para Âncoras de Relacionamento
 * 
 * Processa âncoras que se repetem em intervalos regulares:
 * - Birthday: aniversários dos alunos
 * - Weekly Followup: acompanhamento semanal baseado no último treino
 * - Monthly Review: revisão mensal baseada no aniversário do primeiro treino
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
 * Estratégia para âncoras baseadas em aniversários
 */
export class BirthdayStrategy extends BaseAnchorStrategy {
  readonly type = 'recurrent' as const
  readonly anchorCode = 'birthday'

  async shouldCreateTaskForStudent(
    student: StudentData, 
    config: AnchorConfig
  ): Promise<AnchorResult> {
    if (!student.birth_date) {
      return {
        shouldCreate: false,
        scheduledDate: null,
        anchorData: null,
        reason: 'Aluno não tem data de nascimento'
      }
    }

    const today = new Date()
    const birthDate = new Date(student.birth_date)
    
    // Verificar se hoje é o aniversário
    if (birthDate.getMonth() !== today.getMonth() || birthDate.getDate() !== today.getDate()) {
      return {
        shouldCreate: false,
        scheduledDate: null,
        anchorData: null,
        reason: 'Hoje não é o aniversário do aluno'
      }
    }

    const age = this.calculateAge(student.birth_date)
    const scheduledDate = new Date() // Enviar hoje

    return {
      shouldCreate: true,
      scheduledDate,
      anchorData: {
        anchor_date: student.birth_date,
        anchor_type: 'birthday',
        additional_data: {
          birth_date: student.birth_date,
          age: age,
          birthday_message: `Parabéns pelos seus ${age} anos!`
        }
      }
    }
  }

  async fetchEligibleStudents(orgId: string, config?: AnchorConfig): Promise<StudentData[]> {
    const today = new Date()
    const month = today.getMonth() + 1
    const day = today.getDate()

    const { data, error } = await supabase
      .from('students')
      .select('id, name, email, phone, created_at, org_id, status, trainer_id, birth_date')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .not('birth_date', 'is', null)

    if (error) {
      console.error('Erro ao buscar alunos para birthday:', error)
      return []
    }

    // Filtrar alunos que fazem aniversário hoje
    const birthdayStudents = (data || []).filter((student: any) => {
      if (!student.birth_date) return false
      
      const birthDate = new Date(student.birth_date)
      return birthDate.getMonth() + 1 === month && birthDate.getDate() === day
    })

    return birthdayStudents.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      created_at: s.created_at,
      org_id: s.org_id,
      status: s.status,
      trainer_id: s.trainer_id,
      birth_date: s.birth_date
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
            const result = await this.shouldCreateTaskForStudent(student, config || {})

            if (!result.shouldCreate) {
              stats.tasks_skipped++
              continue
            }

            // Verificar se já existe tarefa para hoje
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)

            const { data: existingTask } = await supabase
              .from('relationship_tasks')
              .select('id')
              .eq('student_id', student.id)
              .eq('template_code', template.code)
              .eq('anchor', this.anchorCode)
              .gte('scheduled_for', today.toISOString())
              .lt('scheduled_for', tomorrow.toISOString())
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
                created_by: 'system_recurrent_strategy'
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
      birth_date: anchorData.anchor_date,
      age: anchorData.additional_data?.age,
      birthday_message: anchorData.additional_data?.birthday_message,
      birth_date_formatted: this.formatDateBR(anchorData.anchor_date)
    }
  }
}

/**
 * Estratégia para acompanhamento de treino (flexível por configuração de dias)
 */
export class TrainingFollowupStrategy extends BaseAnchorStrategy {
  readonly type = 'recurrent' as const
  readonly anchorCode = 'training_followup'

  async shouldCreateTaskForStudent(
    student: StudentData, 
    config: AnchorConfig
  ): Promise<AnchorResult> {
    if (!student.last_workout_date) {
      return {
        shouldCreate: false,
        scheduledDate: null,
        anchorData: null,
        reason: 'Aluno não tem data do último treino'
      }
    }

    const today = new Date()
    const lastWorkoutDate = new Date(student.last_workout_date)
    const daysSinceLastWorkout = this.calculateDaysSince(student.last_workout_date)

    // Obter intervalo de dias da configuração do template
    const targetDays = config.offsetDays || 7 // Default: 7 dias
    const toleranceDays = 1 // Tolerância de ±1 dia

    // Verificar se está no período correto para envio
    if (daysSinceLastWorkout < targetDays - toleranceDays || daysSinceLastWorkout > targetDays + toleranceDays) {
      return {
        shouldCreate: false,
        scheduledDate: null,
        anchorData: null,
        reason: `Não está no período para envio (${daysSinceLastWorkout} dias, esperado: ${targetDays}±${toleranceDays})`
      }
    }

    const scheduledDate = new Date() // Enviar hoje

    return {
      shouldCreate: true,
      scheduledDate,
      anchorData: {
        anchor_date: student.last_workout_date,
        anchor_type: 'training_followup',
        additional_data: {
          last_workout_date: student.last_workout_date,
          days_since_last_workout: daysSinceLastWorkout,
          target_interval_days: targetDays,
          training_frequency: this.calculateTrainingFrequency(student)
        }
      }
    }
  }

  async fetchEligibleStudents(orgId: string, config?: AnchorConfig): Promise<StudentData[]> {
    const targetDays = config?.offsetDays || 7
    const toleranceDays = 1
    
    // Buscar alunos que tiveram último treino no período de interesse
    const minDaysAgo = targetDays - toleranceDays
    const maxDaysAgo = targetDays + toleranceDays
    
    const minDate = new Date()
    minDate.setDate(minDate.getDate() - maxDaysAgo)
    minDate.setHours(0, 0, 0, 0)
    
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() - minDaysAgo)
    maxDate.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('students')
      .select('id, name, email, phone, created_at, org_id, status, trainer_id, last_workout_date')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .not('last_workout_date', 'is', null)
      .gte('last_workout_date', minDate.toISOString())
      .lte('last_workout_date', maxDate.toISOString())

    if (error) {
      console.error('Erro ao buscar alunos para training_followup:', error)
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
      last_workout_date: s.last_workout_date
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
            const result = await this.shouldCreateTaskForStudent(student, config || {})

            if (!result.shouldCreate) {
              stats.tasks_skipped++
              continue
            }

            // Verificar se já existe tarefa para esta semana
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)

            const { data: existingTask } = await supabase
              .from('relationship_tasks')
              .select('id')
              .eq('student_id', student.id)
              .eq('template_code', template.code)
              .eq('anchor', this.anchorCode)
              .gte('scheduled_for', today.toISOString())
              .lt('scheduled_for', tomorrow.toISOString())
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
                created_by: 'system_recurrent_strategy'
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
      last_workout_date: anchorData.anchor_date,
      days_since_last_workout: anchorData.additional_data?.days_since_last_workout,
      target_interval_days: anchorData.additional_data?.target_interval_days,
      training_frequency: anchorData.additional_data?.training_frequency,
      last_workout_date_formatted: this.formatDateBR(anchorData.anchor_date)
    }
  }

  /**
   * Calcula frequência de treinos do aluno (placeholder)
   */
  private calculateTrainingFrequency(student: StudentData): string {
    // Placeholder - pode ser calculado baseado na frequência real de treinos
    return '3x/semana'
  }
}

