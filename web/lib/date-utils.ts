/**
 * GATE 10.7 - Utilitários de Data e Timezone
 * 
 * Timezone: America/Sao_Paulo (GMT-3, com horário de verão automático)
 * Armazenamento: UTC no backend
 * Comparações e segmentação: Frontend usando timezone local
 */

import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { startOfDay, endOfDay, isAfter, isBefore, isEqual } from 'date-fns'

/**
 * Timezone padrão do sistema
 */
export const TIMEZONE = 'America/Sao_Paulo'

/**
 * Retorna o início do dia atual no timezone configurado
 * @returns Date object representando 00:00:00 do dia atual em UTC
 * 
 * Exemplo:
 * - Timezone local: 2025-09-30 08:30 (GMT-3)
 * - Retorna: 2025-09-30 03:00:00Z (00:00 em São Paulo = 03:00 UTC)
 */
export function startOfToday(timezone: string = TIMEZONE): Date {
  try {
    const now = new Date()
    const zonedNow = toZonedTime(now, timezone)
    const zonedStartOfDay = startOfDay(zonedNow)
    const result = fromZonedTime(zonedStartOfDay, timezone)
    
    if (!result || isNaN(result.getTime())) {
      console.error('Erro em startOfToday:', { now, zonedNow, zonedStartOfDay, result, timezone })
      // Fallback para hoje em UTC
      const fallback = new Date()
      fallback.setHours(0, 0, 0, 0)
      return fallback
    }
    
    return result
  } catch (error) {
    console.error('Erro em startOfToday:', error)
    // Fallback para hoje em UTC
    const fallback = new Date()
    fallback.setHours(0, 0, 0, 0)
    return fallback
  }
}

/**
 * Retorna o fim do dia atual no timezone configurado
 * @returns Date object representando 23:59:59.999 do dia atual em UTC
 * 
 * Exemplo:
 * - Timezone local: 2025-09-30 08:30 (GMT-3)
 * - Retorna: 2025-10-01 02:59:59.999Z (23:59:59 em São Paulo)
 */
export function endOfToday(timezone: string = TIMEZONE): Date {
  try {
    const now = new Date()
    const zonedNow = toZonedTime(now, timezone)
    const zonedEndOfDay = endOfDay(zonedNow)
    const result = fromZonedTime(zonedEndOfDay, timezone)
    
    if (!result || isNaN(result.getTime())) {
      console.error('Erro em endOfToday:', { now, zonedNow, zonedEndOfDay, result, timezone })
      // Fallback para fim do dia em UTC
      const fallback = new Date()
      fallback.setHours(23, 59, 59, 999)
      return fallback
    }
    
    return result
  } catch (error) {
    console.error('Erro em endOfToday:', error)
    // Fallback para fim do dia em UTC
    const fallback = new Date()
    fallback.setHours(23, 59, 59, 999)
    return fallback
  }
}

/**
 * Retorna o início de um dia específico no timezone configurado
 * @param date - Data para obter o início do dia
 * @param timezone - Timezone (padrão: America/Sao_Paulo)
 * @returns Date object em UTC representando 00:00:00 da data fornecida
 */
export function startOfDayInTimezone(date: Date | string, timezone: string = TIMEZONE): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const zonedDate = toZonedTime(dateObj, timezone)
  const zonedStartOfDay = startOfDay(zonedDate)
  return fromZonedTime(zonedStartOfDay, timezone)
}

/**
 * Retorna o fim de um dia específico no timezone configurado
 * @param date - Data para obter o fim do dia
 * @param timezone - Timezone (padrão: America/Sao_Paulo)
 * @returns Date object em UTC representando 23:59:59.999 da data fornecida
 */
export function endOfDayInTimezone(date: Date | string, timezone: string = TIMEZONE): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const zonedDate = toZonedTime(dateObj, timezone)
  const zonedEndOfDay = endOfDay(zonedDate)
  return fromZonedTime(zonedEndOfDay, timezone)
}

/**
 * Verifica se uma data é hoje (no timezone configurado)
 * @param date - Data para verificar
 * @param timezone - Timezone (padrão: America/Sao_Paulo)
 * @returns true se a data é hoje
 * 
 * Exemplo:
 * - Hora atual: 2025-09-30 08:30 (GMT-3)
 * - isToday('2025-09-30T00:00:00Z') → true
 * - isToday('2025-09-29T23:00:00Z') → false
 */
export function isToday(date: Date | string, timezone: string = TIMEZONE): boolean {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Verificar se a data é válida
    if (!dateObj || isNaN(dateObj.getTime())) {
      console.warn('isToday: data inválida', { date, dateObj })
      return false
    }
    
    const now = new Date()
    const zonedDate = toZonedTime(dateObj, timezone)
    const zonedNow = toZonedTime(now, timezone)
    
    const startOfDateDay = startOfDay(zonedDate)
    const startOfNowDay = startOfDay(zonedNow)
    
    return isEqual(startOfDateDay, startOfNowDay)
  } catch (error) {
    console.error('Erro em isToday:', error, { date, timezone })
    return false
  }
}

/**
 * Verifica se uma data está no passado (anterior a hoje, no timezone configurado)
 * @param date - Data para verificar
 * @param timezone - Timezone (padrão: America/Sao_Paulo)
 * @returns true se a data é anterior a hoje
 * 
 * Exemplo:
 * - Hora atual: 2025-09-30 08:30 (GMT-3)
 * - isPast('2025-09-29T23:00:00Z') → true
 * - isPast('2025-09-30T00:00:00Z') → false (é hoje)
 */
export function isPast(date: Date | string, timezone: string = TIMEZONE): boolean {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Verificar se a data é válida
    if (!dateObj || isNaN(dateObj.getTime())) {
      console.warn('isPast: data inválida', { date, dateObj })
      return false
    }
    
    const todayStart = startOfToday(timezone)
    
    // Verificar se todayStart é válido
    if (!todayStart || isNaN(todayStart.getTime())) {
      console.warn('isPast: todayStart inválido', { todayStart, timezone })
      return false
    }
    
    return isBefore(dateObj, todayStart)
  } catch (error) {
    console.error('Erro em isPast:', error, { date, timezone })
    return false
  }
}

/**
 * Verifica se uma data está no futuro (posterior a hoje, no timezone configurado)
 * @param date - Data para verificar
 * @param timezone - Timezone (padrão: America/Sao_Paulo)
 * @returns true se a data é posterior a hoje
 * 
 * Exemplo:
 * - Hora atual: 2025-09-30 08:30 (GMT-3)
 * - isFuture('2025-10-01T00:00:00Z') → true
 * - isFuture('2025-09-30T23:00:00Z') → false (é hoje)
 */
export function isFuture(date: Date | string, timezone: string = TIMEZONE): boolean {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Verificar se a data é válida
    if (!dateObj || isNaN(dateObj.getTime())) {
      console.warn('isFuture: data inválida', { date, dateObj })
      return false
    }
    
    const todayEnd = endOfToday(timezone)
    
    // Verificar se todayEnd é válido
    if (!todayEnd || isNaN(todayEnd.getTime())) {
      console.warn('isFuture: todayEnd inválido', { todayEnd, timezone })
      return false
    }
    
    return isAfter(dateObj, todayEnd)
  } catch (error) {
    console.error('Erro em isFuture:', error, { date, timezone })
    return false
  }
}

/**
 * Converte uma data/hora local (timezone) para UTC (ISO string)
 * Útil para enviar datas para a API
 * 
 * @param date - Data no timezone local
 * @param timezone - Timezone (padrão: America/Sao_Paulo)
 * @returns String ISO em UTC
 * 
 * Exemplo:
 * - Input: 2025-09-30 10:00 (São Paulo)
 * - Output: "2025-09-30T13:00:00.000Z" (UTC)
 */
export function toUTC(date: Date | string, timezone: string = TIMEZONE): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const utcDate = fromZonedTime(dateObj, timezone)
  return utcDate.toISOString()
}

/**
 * Converte uma data UTC para o timezone local
 * Útil para exibir datas recebidas da API
 * 
 * @param utcDate - Data em UTC (ISO string ou Date)
 * @param timezone - Timezone (padrão: America/Sao_Paulo)
 * @returns Date object no timezone local
 * 
 * Exemplo:
 * - Input: "2025-09-30T13:00:00.000Z" (UTC)
 * - Output: 2025-09-30 10:00 (São Paulo)
 */
export function fromUTC(utcDate: Date | string, timezone: string = TIMEZONE): Date {
  const dateObj = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  return toZonedTime(dateObj, timezone)
}

/**
 * Retorna o intervalo de hoje (startOfDay → endOfDay) em UTC
 * Útil para enviar filtros de "hoje" para a API
 * 
 * @param timezone - Timezone (padrão: America/Sao_Paulo)
 * @returns Objeto com date_from e date_to em ISO UTC
 * 
 * Exemplo:
 * - Hora atual: 2025-09-30 08:30 (GMT-3)
 * - Retorna: { 
 *     date_from: "2025-09-30T03:00:00.000Z",  // 00:00 São Paulo
 *     date_to: "2025-10-01T02:59:59.999Z"     // 23:59:59 São Paulo
 *   }
 */
export function getTodayInterval(timezone: string = TIMEZONE): { date_from: string; date_to: string } {
  const start = startOfToday(timezone)
  const end = endOfToday(timezone)
  
  // Verificar se as datas são válidas
  if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.error('Erro ao gerar intervalo de hoje:', { start, end, timezone })
    // Fallback para hoje em UTC
    const now = new Date()
    const fallbackStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const fallbackEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    return {
      date_from: fallbackStart.toISOString(),
      date_to: fallbackEnd.toISOString()
    }
  }
  
  return {
    date_from: start.toISOString(),
    date_to: end.toISOString()
  }
}

/**
 * Adiciona dias a uma data (considerando timezone)
 * 
 * @param date - Data base
 * @param days - Número de dias para adicionar
 * @param timezone - Timezone (padrão: America/Sao_Paulo)
 * @returns Nova data em UTC
 */
export function addDays(date: Date | string, days: number, timezone: string = TIMEZONE): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const zonedDate = toZonedTime(dateObj, timezone)
  const newDate = new Date(zonedDate)
  newDate.setDate(newDate.getDate() + days)
  return fromZonedTime(newDate, timezone)
}

/**
 * Formata uma data para exibição local
 * 
 * @param date - Data para formatar
 * @param timezone - Timezone (padrão: America/Sao_Paulo)
 * @returns String formatada
 */
export function formatLocalDate(date: Date | string, timezone: string = TIMEZONE): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const zonedDate = toZonedTime(dateObj, timezone)
  return zonedDate.toLocaleString('pt-BR', { timeZone: timezone })
}

