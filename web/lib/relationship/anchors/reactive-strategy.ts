/**
 * Estratégia Reativa para Âncoras de Relacionamento
 * 
 * Processa âncoras que são disparadas por eventos específicos:
 * - Occurrence Followup: seguimento após ocorrências (falta, lesão, etc.)
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
 * Estratégia para seguimento de ocorrências
 */
export class OccurrenceFollowupStrategy extends BaseAnchorStrategy {
  readonly type = 'reactive' as const
  readonly anchorCode = 'occurrence_followup'

  async shouldCreateTaskForStudent(
    student: StudentData, 
    config: AnchorConfig
  ): Promise<AnchorResult> {
    const occurrenceId = config.additionalFilters?.occurrence_id
    
    if (!occurrenceId) {
      return {
        shouldCreate: false,
        scheduledDate: null,
        anchorData: null,
        reason: 'ID da ocorrência não fornecido'
      }
    }

    // Buscar dados da ocorrência
    const { data: occurrence, error } = await supabase
      .from('student_occurrences')
      .select('id, type, description, created_at, student_id, org_id')
      .eq('id', occurrenceId)
      .eq('student_id', student.id)
      .single()

    if (error || !occurrence) {
      return {
        shouldCreate: false,
        scheduledDate: null,
        anchorData: null,
        reason: 'Ocorrência não encontrada'
      }
    }

    // Verificar se já existe tarefa para esta ocorrência
    const { data: existingTask } = await supabase
      .from('relationship_tasks')
      .select('id')
      .eq('student_id', student.id)
      .eq('anchor', this.anchorCode)
      .eq('payload->>occurrence_id', occurrenceId)
      .single()

    if (existingTask) {
      return {
        shouldCreate: false,
        scheduledDate: null,
        anchorData: null,
        reason: 'Tarefa já existe para esta ocorrência'
      }
    }

    // Calcular data de envio baseada no tipo de ocorrência
    const occurrenceDate = new Date(occurrence.created_at)
    let offsetDays = 1 // Default: 1 dia após a ocorrência

    // Diferentes tipos de ocorrência podem ter diferentes tempos de seguimento
    switch (occurrence.type) {
      case 'falta':
        offsetDays = 1 // Seguir no dia seguinte
        break
      case 'lesão':
        offsetDays = 3 // Aguardar alguns dias
        break
      case 'cancelamento':
        offsetDays = 0 // Seguir no mesmo dia
        break
      case 'reclamação':
        offsetDays = 1 // Seguir rapidamente
        break
      default:
        offsetDays = 1
    }

    const scheduledDate = this.calculateScheduledDate(occurrence.created_at, offsetDays)

    return {
      shouldCreate: true,
      scheduledDate,
      anchorData: {
        anchor_date: occurrence.created_at,
        anchor_type: 'occurrence_followup',
        additional_data: {
          occurrence_id: occurrence.id,
          occurrence_type: occurrence.type,
          occurrence_description: occurrence.description,
          occurrence_date: occurrence.created_at,
          days_since_occurrence: this.calculateDaysSince(occurrence.created_at)
        }
      }
    }
  }

  async fetchEligibleStudents(orgId: string, config?: AnchorConfig): Promise<StudentData[]> {
    // Para estratégias reativas, normalmente recebemos os alunos específicos
    // através do config.additionalFilters.student_ids
    const studentIds = config?.additionalFilters?.student_ids
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from('students')
      .select('id, name, email, phone, created_at, org_id, status, trainer_id')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .in('id', studentIds)

    if (error) {
      console.error('Erro ao buscar alunos para occurrence_followup:', error)
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
            const result = await this.shouldCreateTaskForStudent(student, config || {})

            if (!result.shouldCreate) {
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
                  occurrence_id: config?.additionalFilters?.occurrence_id,
                  ...this.generateAnchorContext(student, result.anchorData!)
                },
                variables_used: template.variables || [],
                created_by: 'system_reactive_strategy'
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
      occurrence_id: anchorData.additional_data?.occurrence_id,
      occurrence_type: anchorData.additional_data?.occurrence_type,
      occurrence_description: anchorData.additional_data?.occurrence_description,
      occurrence_date: anchorData.additional_data?.occurrence_date,
      days_since_occurrence: anchorData.additional_data?.days_since_occurrence,
      occurrence_date_formatted: this.formatDateBR(anchorData.anchor_date)
    }
  }

  /**
   * Método específico para disparar seguimento de ocorrência
   */
  async triggerOccurrenceFollowup(
    occurrenceId: string,
    studentId: string,
    orgId: string,
    templates: any[]
  ): Promise<{ success: boolean; tasksCreated: number; errors: string[] }> {
    const config: AnchorConfig = {
      additionalFilters: {
        occurrence_id: occurrenceId,
        student_ids: [studentId]
      }
    }

    const stats = await this.processAnchor(orgId, templates, config)

    return {
      success: stats.errors.length === 0,
      tasksCreated: stats.tasks_created,
      errors: stats.errors
    }
  }
}

/**
 * Trigger para criar tarefa de seguimento quando uma ocorrência é criada
 */
export async function createOccurrenceFollowupTrigger(
  occurrenceId: string,
  studentId: string,
  orgId: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔄 [occurrence-trigger] Disparando seguimento de ocorrência:', {
      occurrenceId,
      studentId,
      orgId
    })

    // Buscar templates ativos para occurrence_followup
    const { data: templates, error: templatesError } = await supabase
      .from('relationship_templates_v2')
      .select('*')
      .eq('org_id', orgId)
      .eq('active', true)
      .eq('anchor', 'occurrence_followup')

    if (templatesError) {
      console.error('❌ [occurrence-trigger] Erro ao buscar templates:', templatesError)
      return { success: false, message: 'Erro ao buscar templates' }
    }

    if (!templates || templates.length === 0) {
      console.log('⚠️ [occurrence-trigger] Nenhum template ativo encontrado para occurrence_followup')
      return { success: true, message: 'Nenhum template ativo encontrado' }
    }

    // Buscar dados do aluno
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, email, phone, org_id')
      .eq('id', studentId)
      .eq('org_id', orgId)
      .single()

    if (studentError || !student) {
      console.error('❌ [occurrence-trigger] Erro ao buscar aluno:', studentError)
      return { success: false, message: 'Aluno não encontrado' }
    }

    // Criar estratégia e processar
    const strategy = new OccurrenceFollowupStrategy()
    const result = await strategy.triggerOccurrenceFollowup(
      occurrenceId,
      studentId,
      orgId,
      templates
    )

    if (result.success) {
      console.log('✅ [occurrence-trigger] Seguimento criado com sucesso:', {
        tasksCreated: result.tasksCreated
      })
      return { 
        success: true, 
        message: `${result.tasksCreated} tarefas de seguimento criadas` 
      }
    } else {
      console.error('❌ [occurrence-trigger] Erro ao criar seguimento:', result.errors)
      return { 
        success: false, 
        message: `Erro ao criar seguimento: ${result.errors.join(', ')}` 
      }
    }
  } catch (error) {
    console.error('❌ [occurrence-trigger] Erro geral:', error)
    return { 
      success: false, 
      message: `Erro interno: ${(error as any)?.message || String(error)}` 
    }
  }
}
