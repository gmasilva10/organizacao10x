/**
 * EVENT_REGISTRY - Catálogo fechado de âncoras para o módulo Relacionamento
 * 
 * Princípios:
 * - Catálogo fechado (não permite SQL custom do usuário)
 * - Cada âncora tem query base otimizada + índices
 * - Templates apontam para âncora + aplicam filtros declarativos
 * - Rate limiting e dedup por chave lógica
 */

export const EVENT_REGISTRY = {
  // Vendas e Onboarding
  SALE_CLOSE: {
    code: 'sale_close',
    name: 'Fechamento da Venda',
    description: 'Aluno que fechou venda/contrato',
    queryBase: 'SELECT id, name, email, phone, created_at as anchor_date FROM students WHERE status = \'active\' AND created_at::date = $1',
    anchorField: 'created_at',
    suggestedOffset: '+0d',
    variables: ['Nome', 'PrimeiroNome', 'DataVenda']
  },

  FIRST_WORKOUT: {
    code: 'first_workout', 
    name: 'Primeiro Treino',
    description: 'Aluno com primeiro treino agendado',
    queryBase: 'SELECT id, name, email, phone, first_workout_date as anchor_date FROM students WHERE first_workout_date IS NOT NULL AND first_workout_date::date = $1',
    anchorField: 'first_workout_date',
    suggestedOffset: '-1d',
    variables: ['Nome', 'PrimeiroNome', 'DataTreino', 'LinkAnamnese']
  },

  // Follow-ups Regulares
  WEEKLY_FOLLOWUP: {
    code: 'weekly_followup',
    name: 'Acompanhamento Semanal',
    description: 'Follow-up semanal para alunos ativos',
    queryBase: 'SELECT id, name, email, phone, last_workout_date as anchor_date FROM students WHERE status = \'active\' AND last_workout_date IS NOT NULL',
    anchorField: 'last_workout_date',
    suggestedOffset: '+7d',
    variables: ['Nome', 'PrimeiroNome', 'DataUltimoTreino']
  },

  MONTHLY_REVIEW: {
    code: 'monthly_review',
    name: 'Revisão Mensal',
    description: 'Revisão de progresso mensal',
    queryBase: 'SELECT id, name, email, phone, created_at as anchor_date FROM students WHERE status = \'active\' AND EXTRACT(DAY FROM created_at) = EXTRACT(DAY FROM CURRENT_DATE)',
    anchorField: 'created_at',
    suggestedOffset: '+30d',
    variables: ['Nome', 'PrimeiroNome', 'DataInicio', 'MesesAtivo']
  },

  // Datas Especiais
  BIRTHDAY: {
    code: 'birthday',
    name: 'Aniversário',
    description: 'Aniversário do aluno',
    queryBase: 'SELECT id, name, email, phone, birth_date as anchor_date FROM students WHERE birth_date IS NOT NULL AND EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(DAY FROM birth_date) = EXTRACT(DAY FROM CURRENT_DATE)',
    anchorField: 'birth_date',
    suggestedOffset: '+0d',
    variables: ['Nome', 'PrimeiroNome', 'Idade', 'DataNascimento']
  },

  RENEWAL_WINDOW: {
    code: 'renewal_window',
    name: 'Janela de Renovação',
    description: 'Alunos próximos do vencimento do contrato',
    queryBase: 'SELECT id, name, email, phone, contract_end_date as anchor_date FROM students WHERE status = \'active\' AND contract_end_date IS NOT NULL AND contract_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL \'7 days\'',
    anchorField: 'contract_end_date',
    suggestedOffset: '-7d',
    variables: ['Nome', 'PrimeiroNome', 'DataVencimento', 'DiasRestantes']
  },

  // Ocorrências
  OCCURRENCE_FOLLOWUP: {
    code: 'occurrence_followup',
    name: 'Follow-up de Ocorrência',
    description: 'Follow-up baseado em ocorrência com lembrete',
    queryBase: 'SELECT s.id, s.name, s.email, s.phone, o.reminder_at as anchor_date FROM students s JOIN student_occurrences o ON s.id = o.student_id WHERE o.reminder_at IS NOT NULL AND o.reminder_at::date = $1',
    anchorField: 'reminder_at',
    suggestedOffset: '+0d',
    variables: ['Nome', 'PrimeiroNome', 'TipoOcorrencia', 'DescricaoOcorrencia', 'DataOcorrencia']
  },

  // Manual - GATE 10.6.7
  MANUAL: {
    code: 'manual',
    name: 'Tarefa Manual',
    description: 'Tarefa criada manualmente pelo usuário',
    queryBase: '', // Sem query base - exclusivo para tarefas manuais
    anchorField: 'created_at',
    suggestedOffset: '+0d',
    variables: ['Nome', 'PrimeiroNome']
  }
} as const

export type EventCode = keyof typeof EVENT_REGISTRY
export type EventAnchor = typeof EVENT_REGISTRY[EventCode]

/**
 * Validação de âncoras permitidas
 */
export function isValidEventCode(code: string): code is EventCode {
  return code in EVENT_REGISTRY
}

/**
 * Obtém configuração da âncora
 */
export function getEventAnchor(code: string): EventAnchor | null {
  return isValidEventCode(code) ? EVENT_REGISTRY[code] : null
}

/**
 * Lista todas as âncoras disponíveis para seleção
 */
export function getAvailableAnchors() {
  return Object.values(EVENT_REGISTRY).map(anchor => ({
    code: anchor.code,
    name: anchor.name,
    description: anchor.description,
    suggestedOffset: anchor.suggestedOffset,
    variables: anchor.variables
  }))
}

/**
 * Filtros de audiência permitidos (declarativos, não SQL)
 */
export const AUDIENCE_FILTERS = {
  status: {
    type: 'array',
    options: ['onboarding', 'active', 'paused'],
    description: 'Status do aluno'
  },
  tags: {
    type: 'array', 
    options: ['VIP', 'Novato', 'Renovacao', 'Especial'],
    description: 'Tags do aluno'
  },
  trainer_id: {
    type: 'uuid',
    description: 'ID do treinador responsável'
  },
  created_after: {
    type: 'date',
    description: 'Criado após data'
  },
  created_before: {
    type: 'date', 
    description: 'Criado antes da data'
  }
} as const

/**
 * Variáveis disponíveis para templates
 */
export const TEMPLATE_VARIABLES = [
  'Nome',
  'PrimeiroNome', 
  'DataTreino',
  'DataUltimoTreino',
  'DataVenda',
  'DataInicio',
  'DataNascimento',
  'DataVencimento',
  'Idade',
  'MesesAtivo',
  'DiasRestantes',
  'LinkAnamnese',
  'TipoOcorrencia',
  'DescricaoOcorrencia',
  'DataOcorrencia'
] as const

export type TemplateVariable = typeof TEMPLATE_VARIABLES[number]

/**
 * Validação de variáveis em templates
 */
export function validateTemplateVariables(variables: string[]): { valid: string[], invalid: string[] } {
  const valid: string[] = []
  const invalid: string[] = []
  
  variables.forEach(variable => {
    if (TEMPLATE_VARIABLES.includes(variable as TemplateVariable)) {
      valid.push(variable)
    } else {
      invalid.push(variable)
    }
  })
  
  return { valid, invalid }
}
