/**
 * Estratégia Base para Âncoras de Relacionamento
 * 
 * Define a interface comum para todas as estratégias de âncora,
 * permitindo diferentes tipos de processamento (temporal, recorrente, reativo).
 */

import { StudentData } from '../variable-context'

export interface AnchorConfig {
  offsetDays?: number | null
  anchorField?: string
  additionalFilters?: Record<string, any>
}

export interface AnchorSpecificData {
  anchor_date: string
  anchor_type: string
  additional_data?: Record<string, any>
}

export interface AnchorResult {
  shouldCreate: boolean
  scheduledDate: Date | null
  anchorData: AnchorSpecificData | null
  reason?: string
}

export interface AnchorStats {
  students_found: number
  tasks_created: number
  tasks_updated: number
  tasks_skipped: number
  errors: string[]
  duration_ms: number
}

/**
 * Interface base para todas as estratégias de âncora
 */
export interface AnchorStrategy {
  readonly type: 'temporal' | 'recurrent' | 'reactive'
  readonly anchorCode: string
  
  /**
   * Verifica se deve criar tarefa para um aluno específico
   */
  shouldCreateTaskForStudent(
    student: StudentData, 
    config: AnchorConfig
  ): Promise<AnchorResult>
  
  /**
   * Busca alunos elegíveis para esta âncora
   */
  fetchEligibleStudents(orgId: string, config?: AnchorConfig): Promise<StudentData[]>
  
  /**
   * Processa uma âncora específica e cria/atualiza tarefas
   */
  processAnchor(
    orgId: string, 
    templates: any[], 
    config?: AnchorConfig
  ): Promise<AnchorStats>
  
  /**
   * Gera contexto específico da âncora para renderização de variáveis
   */
  generateAnchorContext(
    student: StudentData, 
    anchorData: AnchorSpecificData
  ): Record<string, any>
}

/**
 * Classe base abstrata para estratégias de âncora
 */
export abstract class BaseAnchorStrategy implements AnchorStrategy {
  abstract readonly type: 'temporal' | 'recurrent' | 'reactive'
  abstract readonly anchorCode: string

  abstract shouldCreateTaskForStudent(
    student: StudentData, 
    config: AnchorConfig
  ): Promise<AnchorResult>

  abstract fetchEligibleStudents(orgId: string, config?: AnchorConfig): Promise<StudentData[]>

  abstract processAnchor(
    orgId: string, 
    templates: any[], 
    config?: AnchorConfig
  ): Promise<AnchorStats>

  abstract generateAnchorContext(
    student: StudentData, 
    anchorData: AnchorSpecificData
  ): Record<string, any>

  /**
   * Utilitários comuns para todas as estratégias
   */
  protected calculateScheduledDate(anchorDate: string, offsetDays: number): Date {
    const date = new Date(anchorDate)
    date.setDate(date.getDate() + offsetDays)
    return date
  }

  protected getTemporalGreeting(): string {
    const hour = new Date().getHours()
    
    if (hour >= 5 && hour < 12) return 'Bom dia'
    if (hour >= 12 && hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  protected formatDateBR(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  protected calculateAge(birthDate: string): number {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  protected calculateDaysSince(date: string): number {
    const today = new Date()
    const target = new Date(date)
    const diffTime = today.getTime() - target.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  protected calculateDaysUntil(date: string): number {
    const today = new Date()
    const target = new Date(date)
    const diffTime = target.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Valida se uma estratégia pode ser executada
   */
  canExecute(config?: AnchorConfig): boolean {
    return true // Implementação padrão - pode ser sobrescrita
  }

  /**
   * Obtém descrição da estratégia
   */
  getDescription(): string {
    return `${this.type} strategy for ${this.anchorCode}`
  }
}
