/**
 * Factory para Estratégias de Âncoras
 * 
 * Centraliza a criação e seleção das estratégias apropriadas
 * para cada tipo de âncora de relacionamento.
 */

import { AnchorStrategy } from './base-strategy'

// Importar todas as estratégias
import { 
  SaleCloseStrategy, 
  FirstWorkoutStrategy, 
  RenewalWindowStrategy 
} from './temporal-strategy'

import { 
  BirthdayStrategy, 
  TrainingFollowupStrategy
} from './recurrent-strategy'

import { 
  OccurrenceFollowupStrategy 
} from './reactive-strategy'

export type EventCode = 
  | 'sale_close'
  | 'first_workout'
  | 'training_followup'
  | 'birthday'
  | 'renewal_window'
  | 'occurrence_followup'

/**
 * Mapeamento de códigos de evento para suas estratégias
 */
const STRATEGY_MAP: Record<EventCode, () => AnchorStrategy> = {
  // Estratégias Temporais
  sale_close: () => new SaleCloseStrategy(),
  first_workout: () => new FirstWorkoutStrategy(),
  renewal_window: () => new RenewalWindowStrategy(),
  
  // Estratégias Recorrentes
  birthday: () => new BirthdayStrategy(),
  training_followup: () => new TrainingFollowupStrategy(),
  
  // Estratégias Reativas
  occurrence_followup: () => new OccurrenceFollowupStrategy()
}

/**
 * Factory para criar estratégias de âncora
 */
export class AnchorStrategyFactory {
  /**
   * Cria uma estratégia para o código de evento especificado
   */
  static createStrategy(eventCode: EventCode): AnchorStrategy {
    const strategyFactory = STRATEGY_MAP[eventCode]
    
    if (!strategyFactory) {
      throw new Error(`Estratégia não encontrada para o evento: ${eventCode}`)
    }
    
    return strategyFactory()
  }

  /**
   * Cria múltiplas estratégias para uma lista de códigos de evento
   */
  static createStrategies(eventCodes: EventCode[]): AnchorStrategy[] {
    return eventCodes.map(code => this.createStrategy(code))
  }

  /**
   * Lista todas as estratégias disponíveis
   */
  static getAllStrategies(): AnchorStrategy[] {
    return Object.keys(STRATEGY_MAP).map(code => 
      this.createStrategy(code as EventCode)
    )
  }

  /**
   * Lista estratégias por tipo
   */
  static getStrategiesByType(type: 'temporal' | 'recurrent' | 'reactive'): AnchorStrategy[] {
    return this.getAllStrategies().filter(strategy => strategy.type === type)
  }

  /**
   * Verifica se existe estratégia para um código de evento
   */
  static hasStrategy(eventCode: EventCode): boolean {
    return eventCode in STRATEGY_MAP
  }

  /**
   * Obtém informações sobre todas as estratégias disponíveis
   */
  static getStrategyInfo(): Array<{
    eventCode: EventCode
    type: 'temporal' | 'recurrent' | 'reactive'
    description: string
  }> {
    return Object.keys(STRATEGY_MAP).map(eventCode => {
      const strategy = this.createStrategy(eventCode as EventCode)
      return {
        eventCode: eventCode as EventCode,
        type: strategy.type,
        description: (strategy as any).getDescription?.() || 'N/A'
      }
    })
  }

  /**
   * Executa uma estratégia específica
   */
  static async executeStrategy(
    eventCode: EventCode,
    orgId: string,
    templates: any[],
    config?: any
  ) {
    const strategy = this.createStrategy(eventCode)
    
    if (!(strategy as any).canExecute?.(config)) {
      throw new Error(`Estratégia ${eventCode} não pode ser executada com a configuração fornecida`)
    }
    
    return await strategy.processAnchor(orgId, templates, config)
  }

  /**
   * Executa múltiplas estratégias em paralelo
   */
  static async executeMultipleStrategies(
    eventCodes: EventCode[],
    orgId: string,
    templates: any[],
    config?: any
  ) {
    const strategies = this.createStrategies(eventCodes)
    
    const results = await Promise.allSettled(
      strategies.map(strategy => 
        (strategy as any).canExecute?.(config) 
          ? strategy.processAnchor(orgId, templates, config)
          : Promise.resolve({
              students_found: 0,
              tasks_created: 0,
              tasks_updated: 0,
              tasks_skipped: 0,
              errors: [`Estratégia ${strategy.anchorCode} não pode ser executada`],
              duration_ms: 0
            })
      )
    )

    return results.map((result, index) => ({
      eventCode: eventCodes[index],
      success: result.status === 'fulfilled',
      stats: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }))
  }
}

/**
 * Utilitários para trabalhar com estratégias
 */
export class StrategyUtils {
  /**
   * Agrupa templates por tipo de âncora
   */
  static groupTemplatesByAnchor(templates: any[]): Record<EventCode, any[]> {
    const grouped: Record<string, any[]> = {}
    
    for (const template of templates) {
      if (!grouped[template.anchor]) {
        grouped[template.anchor] = []
      }
      grouped[template.anchor].push(template)
    }
    
    return grouped as Record<EventCode, any[]>
  }

  /**
   * Filtra templates ativos por tipo de âncora
   */
  static getActiveTemplatesForAnchor(templates: any[], eventCode: EventCode): any[] {
    return templates.filter(template => 
      template.anchor === eventCode && 
      template.active === true
    )
  }

  /**
   * Valida se um template pode ser usado com uma estratégia
   */
  static validateTemplateForStrategy(template: any, eventCode: EventCode): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    
    // Verificar se o template tem a âncora correta
    if (template.anchor !== eventCode) {
      errors.push(`Template deve ter âncora '${eventCode}', mas tem '${template.anchor}'`)
    }
    
    // Verificar se o template está ativo
    if (!template.active) {
      errors.push('Template deve estar ativo')
    }
    
    // Verificar se tem mensagem
    if (!template.message_v1 || template.message_v1.trim() === '') {
      errors.push('Template deve ter uma mensagem')
    }
    
    // Verificar se tem código
    if (!template.code || template.code.trim() === '') {
      errors.push('Template deve ter um código')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Calcula estatísticas consolidadas de múltiplas estratégias
   */
  static consolidateStats(results: Array<{
    eventCode: EventCode
    success: boolean
    stats: any
    error?: any
  }>) {
    const consolidated = {
      total_students_found: 0,
      total_tasks_created: 0,
      total_tasks_updated: 0,
      total_tasks_skipped: 0,
      total_errors: 0,
      total_duration_ms: 0,
      strategies_executed: 0,
      strategies_failed: 0,
      by_strategy: {} as Record<EventCode, any>
    }

    for (const result of results) {
      if (result.success && result.stats) {
        consolidated.total_students_found += result.stats.students_found || 0
        consolidated.total_tasks_created += result.stats.tasks_created || 0
        consolidated.total_tasks_updated += result.stats.tasks_updated || 0
        consolidated.total_tasks_skipped += result.stats.tasks_skipped || 0
        consolidated.total_errors += result.stats.errors?.length || 0
        consolidated.total_duration_ms += result.stats.duration_ms || 0
        consolidated.strategies_executed++
        
        consolidated.by_strategy[result.eventCode] = result.stats
      } else {
        consolidated.strategies_failed++
        consolidated.total_errors++
        
        consolidated.by_strategy[result.eventCode] = {
          error: result.error?.message || 'Erro desconhecido',
          students_found: 0,
          tasks_created: 0,
          tasks_updated: 0,
          tasks_skipped: 0,
          errors: [result.error?.message || 'Erro desconhecido'],
          duration_ms: 0
        }
      }
    }

    return consolidated
  }
}

// Exportar tipos e constantes úteis
export const SUPPORTED_ANCHORS: EventCode[] = Object.keys(STRATEGY_MAP) as EventCode[]

export const ANCHOR_TYPES = {
  temporal: ['sale_close', 'first_workout', 'renewal_window'] as EventCode[],
  recurrent: ['birthday', 'training_followup'] as EventCode[],
  reactive: ['occurrence_followup'] as EventCode[]
} as const
