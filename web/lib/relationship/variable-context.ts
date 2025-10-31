/**
 * Sistema de Variáveis por Contexto - Módulo de Relacionamento
 * 
 * Define os tipos de contexto disponíveis para renderização de templates
 * e mapeia variáveis por tipo de âncora.
 */

export interface StudentData {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
  org_id: string
  status?: 'active' | 'inactive' | 'suspended'
  birth_date?: string | null
  first_workout_date?: string | null
  last_workout_date?: string | null
  trainer_id?: string | null
}

export interface AnchorSpecificData {
  anchor_date: string
  anchor_type: string
  additional_data?: Record<string, any>
}

export interface OrganizationData {
  id: string
  name: string
  logo_url?: string
  primary_color?: string
  timezone?: string
  settings?: Record<string, any>
}

export interface TrainerData {
  id: string
  name: string
  email: string
  phone?: string
  specialties?: string[]
}

export interface VariableContext {
  student: StudentData
  anchor?: AnchorSpecificData
  organization?: OrganizationData
  trainer?: TrainerData
  custom?: Record<string, any>
}

export interface VariableDefinition {
  name: string
  description: string
  example: string
  category: 'personal' | 'temporal' | 'training' | 'professional' | 'custom'
  required?: boolean
}

export type EventCode = 
  | 'sale_close'
  | 'first_workout'
  | 'training_followup'
  | 'birthday'
  | 'renewal_window'
  | 'occurrence_followup'

/**
 * Mapeamento de variáveis disponíveis por tipo de âncora
 */
export const ANCHOR_VARIABLES: Record<EventCode, VariableDefinition[]> = {
  sale_close: [
    { name: 'PrimeiroNome', description: 'Primeiro nome do aluno', example: 'João', category: 'personal' },
    { name: 'NomeCompleto', description: 'Nome completo do aluno', example: 'João Silva', category: 'personal' },
    { name: 'Nome', description: 'Nome do aluno (alias para NomeCompleto)', example: 'João Silva', category: 'personal' },
    { name: 'DataVenda', description: 'Data da venda/contratação', example: '15/01/2025', category: 'temporal' },
    { name: 'DiasDesdeVenda', description: 'Dias desde a venda', example: '3', category: 'temporal' },
    { name: 'SaudacaoTemporal', description: 'Saudação baseada no horário', example: 'Bom dia', category: 'temporal' },
    { name: 'NomePersonal', description: 'Nome do personal trainer', example: 'Carlos', category: 'professional' },
  ],
  
  first_workout: [
    { name: 'PrimeiroNome', description: 'Primeiro nome do aluno', example: 'João', category: 'personal' },
    { name: 'NomeCompleto', description: 'Nome completo do aluno', example: 'João Silva', category: 'personal' },
    { name: 'DataPrimeiroTreino', description: 'Data do primeiro treino', example: '15/01/2025', category: 'temporal' },
    { name: 'SaudacaoTemporal', description: 'Saudação baseada no horário', example: 'Bom dia', category: 'temporal' },
    { name: 'NomePersonal', description: 'Nome do personal trainer', example: 'Carlos', category: 'professional' },
    { name: 'LocalTreino', description: 'Local do treino', example: 'Academia Centro', category: 'training' },
  ],

  training_followup: [
    { name: 'PrimeiroNome', description: 'Primeiro nome do aluno', example: 'João', category: 'personal' },
    { name: 'NomeCompleto', description: 'Nome completo do aluno', example: 'João Silva', category: 'personal' },
    { name: 'DataUltimoTreino', description: 'Data do último treino', example: '08/01/2025', category: 'temporal' },
    { name: 'DiasSemTreinar', description: 'Dias sem treinar', example: '7', category: 'temporal' },
    { name: 'DataInicioTreinos', description: 'Data de início dos treinos', example: '15/12/2024', category: 'temporal' },
    { name: 'MesesTreinando', description: 'Meses treinando', example: '1', category: 'temporal' },
    { name: 'SaudacaoTemporal', description: 'Saudação baseada no horário', example: 'Bom dia', category: 'temporal' },
    { name: 'NomePersonal', description: 'Nome do personal trainer', example: 'Carlos', category: 'professional' },
    { name: 'FrequenciaTreinos', description: 'Frequência de treinos', example: '3x/semana', category: 'training' },
    { name: 'Objetivos', description: 'Objetivos do aluno', example: 'Emagrecimento', category: 'training' },
    { name: 'Progresso', description: 'Progresso do aluno', example: 'Excelente evolução', category: 'training' },
  ],

  birthday: [
    { name: 'PrimeiroNome', description: 'Primeiro nome do aluno', example: 'João', category: 'personal' },
    { name: 'NomeCompleto', description: 'Nome completo do aluno', example: 'João Silva', category: 'personal' },
    { name: 'DataAniversario', description: 'Data do aniversário', example: '15/01/1990', category: 'temporal' },
    { name: 'Idade', description: 'Idade do aluno', example: '34', category: 'personal' },
    { name: 'SaudacaoTemporal', description: 'Saudação baseada no horário', example: 'Bom dia', category: 'temporal' },
    { name: 'NomePersonal', description: 'Nome do personal trainer', example: 'Carlos', category: 'professional' },
    { name: 'ParabensEspecial', description: 'Parabéns personalizado', example: 'Parabéns pelos seus 34 anos!', category: 'custom' },
  ],

  renewal_window: [
    { name: 'PrimeiroNome', description: 'Primeiro nome do aluno', example: 'João', category: 'personal' },
    { name: 'NomeCompleto', description: 'Nome completo do aluno', example: 'João Silva', category: 'personal' },
    { name: 'DataRenovacao', description: 'Data de renovação', example: '20/01/2025', category: 'temporal' },
    { name: 'DiasParaRenovacao', description: 'Dias para renovação', example: '5', category: 'temporal' },
    { name: 'SaudacaoTemporal', description: 'Saudação baseada no horário', example: 'Bom dia', category: 'temporal' },
    { name: 'NomePersonal', description: 'Nome do personal trainer', example: 'Carlos', category: 'professional' },
    { name: 'PlanoAtual', description: 'Plano atual do aluno', example: 'Personal 3x/semana', category: 'training' },
  ],

  occurrence_followup: [
    { name: 'PrimeiroNome', description: 'Primeiro nome do aluno', example: 'João', category: 'personal' },
    { name: 'NomeCompleto', description: 'Nome completo do aluno', example: 'João Silva', category: 'personal' },
    { name: 'DataOcorrencia', description: 'Data da ocorrência', example: '10/01/2025', category: 'temporal' },
    { name: 'TipoOcorrencia', description: 'Tipo da ocorrência', example: 'Falta', category: 'custom' },
    { name: 'SaudacaoTemporal', description: 'Saudação baseada no horário', example: 'Bom dia', category: 'temporal' },
    { name: 'NomePersonal', description: 'Nome do personal trainer', example: 'Carlos', category: 'professional' },
    { name: 'Observacoes', description: 'Observações da ocorrência', example: 'Falta sem aviso', category: 'custom' },
  ]
}

/**
 * Builder de contexto de variáveis baseado na âncora
 */
export class VariableContextBuilder {
  private context: Partial<VariableContext> = {}

  constructor() {}

  withStudent(student: StudentData): VariableContextBuilder {
    this.context.student = student
    return this
  }

  withAnchor(anchorData: AnchorSpecificData): VariableContextBuilder {
    this.context.anchor = anchorData
    return this
  }

  withOrganization(org: OrganizationData): VariableContextBuilder {
    this.context.organization = org
    return this
  }

  withTrainer(trainer: TrainerData): VariableContextBuilder {
    this.context.trainer = trainer
    return this
  }

  withCustom(custom: Record<string, any>): VariableContextBuilder {
    this.context.custom = custom
    return this
  }

  build(): VariableContext {
    if (!this.context.student) {
      throw new Error('Student data is required to build context')
    }

    return {
      student: this.context.student,
      anchor: this.context.anchor,
      organization: this.context.organization,
      trainer: this.context.trainer,
      custom: this.context.custom || {}
    }
  }
}

/**
 * Utilitários para trabalhar com contextos
 */
export class ContextUtils {
  /**
   * Extrai valor de variável do contexto
   */
  static extractVariableValue(context: VariableContext, variableName: string): string {
    const { student, anchor, organization, trainer, custom } = context

    // Mapear nomes de variáveis para campos do contexto
    const variableMap: Record<string, () => string> = {
      // Personal
      'PrimeiroNome': () => student.name.split(' ')[0] || student.name,
      'NomeCompleto': () => student.name,
      'Nome': () => student.name, // Alias para NomeCompleto (compatibilidade com templates antigos)
      'Idade': () => student.birth_date ? this.calculateAge(student.birth_date).toString() : '',
      
      // Temporal
      'SaudacaoTemporal': () => this.getTemporalGreeting(),
      'DataVenda': () => anchor?.anchor_date ? this.formatDate(anchor.anchor_date) : (student.created_at ? this.formatDate(student.created_at) : ''),
      'DiasDesdeVenda': () => anchor?.anchor_date ? this.calculateDaysSince(anchor.anchor_date).toString() : '0',
      'DataPrimeiroTreino': () => student.first_workout_date ? this.formatDate(student.first_workout_date) : '',
      'DataUltimoTreino': () => student.last_workout_date ? this.formatDate(student.last_workout_date) : '',
      'DataInicioTreinos': () => student.first_workout_date ? this.formatDate(student.first_workout_date) : '',
      'DataAniversario': () => student.birth_date ? this.formatDate(student.birth_date) : '',
      'DataOcorrencia': () => anchor?.anchor_date ? this.formatDate(anchor.anchor_date) : '',
      
      // Professional
      'NomePersonal': () => trainer?.name || 'Personal Trainer',
      
      // Training
      'DiasSemTreinar': () => student.last_workout_date ? this.calculateDaysSince(student.last_workout_date).toString() : '0',
      'MesesTreinando': () => student.first_workout_date ? (this as any).calculateMonthsSince(student.first_workout_date).toString() : '0',
      'FrequenciaTreinos': () => (this as any).calculateTrainingFrequency(student),
      'Objetivos': () => 'Emagrecimento', // Placeholder - pode vir de dados do aluno
      'Progresso': () => (this as any).generateProgressMessage(student),
      
      // Custom
      'ParabensEspecial': () => (this as any).generateSpecialBirthdayMessage(student.name, student.birth_date),
    }

    const extractor = variableMap[variableName]
    if (extractor) {
      return extractor()
    }

    // Fallback para variáveis customizadas
    if (custom && custom[variableName]) {
      return String(custom[variableName])
    }

    return ''
  }

  /**
   * Valida se variável está disponível para a âncora
   */
  static isVariableAvailableForAnchor(anchor: EventCode, variableName: string): boolean {
    const anchorVariables = ANCHOR_VARIABLES[anchor]
    return anchorVariables.some(v => v.name === variableName)
  }

  /**
   * Lista variáveis disponíveis para uma âncora
   */
  static getAvailableVariablesForAnchor(anchor: EventCode): VariableDefinition[] {
    return ANCHOR_VARIABLES[anchor] || []
  }

  /**
   * Lista todas as variáveis por categoria
   */
  static getVariablesByCategory(category: string): VariableDefinition[] {
    const allVariables: VariableDefinition[] = []
    
    Object.values(ANCHOR_VARIABLES).forEach(anchorVars => {
      anchorVars.forEach(variable => {
        if (!allVariables.find(v => v.name === variable.name)) {
          allVariables.push(variable)
        }
      })
    })

    return allVariables.filter(v => v.category === category)
  }

  private static calculateAge(birthDate: string): number {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  private static getTemporalGreeting(): string {
    const hour = new Date().getHours()
    
    if (hour >= 5 && hour < 12) return 'Bom dia'
    if (hour >= 12 && hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  private static formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  private static generateSpecialBirthdayMessage(name: string, birthDate?: string | null): string {
    if (!birthDate) return `Parabéns, ${name.split(' ')[0]}!`
    
    const age = this.calculateAge(birthDate)
    return `Parabéns pelos seus ${age} anos, ${name.split(' ')[0]}!`
  }

  private static calculateTrainingFrequency(student: StudentData): string {
    // Placeholder - pode ser calculado baseado na frequência real de treinos
    return '3x/semana'
  }

  private static generateProgressMessage(student: StudentData): string {
    if (!student.first_workout_date) return 'Novo aluno'
    
    const monthsTraining = this.calculateMonthsSince(student.first_workout_date)
    
    if (monthsTraining < 1) return 'Excelente início!'
    if (monthsTraining < 3) return 'Ótima evolução!'
    if (monthsTraining < 6) return 'Excelente progresso!'
    return 'Parabéns pela dedicação!'
  }

  private static calculateMonthsSince(dateString: string): number {
    const today = new Date()
    const targetDate = new Date(dateString)
    
    const yearDiff = today.getFullYear() - targetDate.getFullYear()
    const monthDiff = today.getMonth() - targetDate.getMonth()
    
    return yearDiff * 12 + monthDiff
  }

  private static calculateDaysSince(dateString: string): number {
    const today = new Date()
    const targetDate = new Date(dateString)
    const diffTime = Math.abs(today.getTime() - targetDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
}
