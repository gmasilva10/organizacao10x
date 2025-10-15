/**
 * Temporal Processor - Sistema de Âncora Temporal
 * 
 * Processa templates com offset temporal para calcular quando as mensagens
 * devem ser enviadas baseado em eventos específicos do aluno.
 */

export interface TemporalConfig {
  offsetDays: number | null
  anchorField: string | null
  anchorDate: Date | null
}

export interface StudentData {
  id: string
  first_workout_date?: string | null
  last_workout_date?: string | null
  birth_date?: string | null
  start_date?: string | null
  end_date?: string | null
  next_renewal_date?: string | null
  created_at: string
}

/**
 * Calcula a data de agendamento baseada no offset temporal
 */
export function calculateTemporalSchedule(
  anchorDate: Date | null,
  offsetDays: number | null
): Date | null {
  if (!anchorDate || offsetDays === null) {
    return anchorDate
  }

  const result = new Date(anchorDate)
  result.setDate(result.getDate() + offsetDays)
  return result
}

/**
 * Extrai a data de âncora do aluno baseada no campo especificado
 */
export function extractAnchorDate(
  student: StudentData,
  anchorField: string | null
): Date | null {
  if (!anchorField) {
    return null
  }

  const dateValue = student[anchorField as keyof StudentData] as string | null | undefined
  
  if (!dateValue) {
    return null
  }

  try {
    return new Date(dateValue)
  } catch (error) {
    console.warn(`Erro ao converter data do campo ${anchorField}:`, error)
    return null
  }
}

/**
 * Verifica se um aluno deve receber uma tarefa baseada no offset temporal
 */
export function shouldCreateTaskForStudent(
  student: StudentData,
  config: TemporalConfig,
  targetDate: Date = new Date()
): boolean {
  // Se não há offset temporal, criar imediatamente
  if (config.offsetDays === null || config.anchorField === null) {
    return true
  }

  // Extrair data de âncora do aluno
  const anchorDate = extractAnchorDate(student, config.anchorField)
  if (!anchorDate) {
    return false
  }

  // Calcular data esperada para envio
  const expectedSendDate = calculateTemporalSchedule(anchorDate, config.offsetDays)
  if (!expectedSendDate) {
    return false
  }

  // Verificar se a data esperada é hoje (com tolerância de 1 dia)
  const today = new Date(targetDate)
  today.setHours(0, 0, 0, 0)
  
  const expectedDate = new Date(expectedSendDate)
  expectedDate.setHours(0, 0, 0, 0)
  
  const diffDays = Math.abs((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  // Permitir tolerância de 1 dia para compensar diferenças de timezone
  return diffDays <= 1
}

/**
 * Gera query SQL para buscar alunos baseado no offset temporal
 */
export function generateTemporalQuery(
  anchorField: string,
  offsetDays: number,
  orgId: string
): string {
  // Calcular a data de referência
  const targetDate = new Date()
  const referenceDate = new Date(targetDate)
  referenceDate.setDate(referenceDate.getDate() - offsetDays)
  
  const referenceDateStr = referenceDate.toISOString().split('T')[0]
  
  return `
    SELECT * FROM students 
    WHERE org_id = '${orgId}'
    AND ${anchorField} = '${referenceDateStr}'
    AND deleted_at IS NULL
  `
}

/**
 * Mapeia âncoras para campos de data correspondentes
 */
export const ANCHOR_FIELD_MAPPING: Record<string, string> = {
  'sale_close': 'created_at',
  'first_workout': 'first_workout_date',
  'last_workout': 'last_workout_date',
  'birthday': 'birth_date',
  'renewal_window': 'next_renewal_date',
  'monthly_review': 'created_at', // Baseado na data de criação para revisão mensal
  'weekly_followup': 'last_workout_date', // Baseado no último treino
  'occurrence_followup': 'created_at' // Baseado na data da ocorrência
}

/**
 * Obtém o campo de data apropriado para uma âncora
 */
export function getAnchorFieldForAnchor(anchor: string): string | null {
  return ANCHOR_FIELD_MAPPING[anchor] || null
}

/**
 * Valida configuração temporal
 */
export function validateTemporalConfig(config: TemporalConfig): boolean {
  // Se offset é null, configuração é válida (envio imediato)
  if (config.offsetDays === null) {
    return true
  }

  // Se offset não é null, anchorField deve ser especificado
  if (!config.anchorField) {
    return false
  }

  // Validar range do offset
  if (config.offsetDays < -365 || config.offsetDays > 365) {
    return false
  }

  return true
}

/**
 * Gera descrição legível do agendamento temporal
 */
export function generateTemporalDescription(
  anchor: string,
  offsetDays: number | null,
  anchorField: string | null
): string {
  if (offsetDays === null || !anchorField) {
    return 'Envio imediato'
  }

  const anchorLabels: Record<string, string> = {
    'sale_close': 'fechamento da venda',
    'first_workout': 'primeiro treino',
    'last_workout': 'último treino',
    'birthday': 'aniversário',
    'renewal_window': 'vencimento do plano',
    'monthly_review': 'criação da conta',
    'weekly_followup': 'último treino',
    'occurrence_followup': 'ocorrência'
  }

  const anchorLabel = anchorLabels[anchor] || anchor
  const offsetText = offsetDays > 0 
    ? `${offsetDays} dias após` 
    : offsetDays < 0 
    ? `${Math.abs(offsetDays)} dias antes de`
    : 'no momento do'

  return `${offsetText} ${anchorLabel}`
}
