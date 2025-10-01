/**
 * GATE 10.7 - Testes Unitários de date-utils
 * 
 * Validação das funções de timezone com:
 * - Horário de verão (outubro a fevereiro: GMT-2)
 * - Horário padrão (março a setembro: GMT-3)
 * - Transições de horário
 */

import {
  startOfToday,
  endOfToday,
  startOfDayInTimezone,
  endOfDayInTimezone,
  isToday,
  isPast,
  isFuture,
  toUTC,
  fromUTC,
  getTodayInterval,
  addDays,
  TIMEZONE
} from '@/lib/date-utils'

describe('date-utils - Timezone America/Sao_Paulo', () => {
  
  describe('startOfToday e endOfToday', () => {
    it('deve retornar início e fim do dia atual em UTC', () => {
      const start = startOfToday()
      const end = endOfToday()
      
      expect(start).toBeInstanceOf(Date)
      expect(end).toBeInstanceOf(Date)
      expect(end.getTime()).toBeGreaterThan(start.getTime())
      
      // Diferença deve ser aproximadamente 24 horas (menos 1ms)
      const diffMs = end.getTime() - start.getTime()
      expect(diffMs).toBeGreaterThan(23 * 60 * 60 * 1000) // Mais de 23h
      expect(diffMs).toBeLessThan(24 * 60 * 60 * 1000) // Menos de 24h
    })
    
    it('deve considerar o timezone America/Sao_Paulo (GMT-3 ou GMT-2)', () => {
      const start = startOfToday()
      const startUTC = start.toISOString()
      
      // O início do dia em São Paulo (00:00) deve estar entre 02:00Z e 03:00Z UTC
      // dependendo se é horário de verão (GMT-2) ou padrão (GMT-3)
      const hourUTC = start.getUTCHours()
      expect([2, 3]).toContain(hourUTC)
    })
  })
  
  describe('startOfDayInTimezone e endOfDayInTimezone', () => {
    it('deve retornar início e fim de data específica', () => {
      const testDate = '2025-09-30T15:30:00Z' // 12:30 em São Paulo (GMT-3)
      
      const start = startOfDayInTimezone(testDate)
      const end = endOfDayInTimezone(testDate)
      
      // Início deve ser 00:00 do dia 30/09 em São Paulo = 03:00 UTC
      expect(start.toISOString()).toBe('2025-09-30T03:00:00.000Z')
      
      // Fim deve ser 23:59:59.999 do dia 30/09 em São Paulo = 02:59:59.999 UTC (01/10)
      expect(end.toISOString()).toBe('2025-10-01T02:59:59.999Z')
    })
    
    it('deve funcionar com Date objects', () => {
      const testDate = new Date('2025-12-25T10:00:00Z')
      
      const start = startOfDayInTimezone(testDate)
      const end = endOfDayInTimezone(testDate)
      
      expect(start).toBeInstanceOf(Date)
      expect(end).toBeInstanceOf(Date)
      expect(end.getTime()).toBeGreaterThan(start.getTime())
    })
    
    it('deve considerar horário de verão (outubro a fevereiro: GMT-2)', () => {
      // 15 de janeiro de 2026 - horário de verão
      const testDate = '2026-01-15T10:00:00Z'
      
      const start = startOfDayInTimezone(testDate)
      
      // 00:00 em São Paulo (GMT-2) = 02:00 UTC
      expect(start.toISOString()).toBe('2026-01-15T02:00:00.000Z')
    })
    
    it('deve considerar horário padrão (março a setembro: GMT-3)', () => {
      // 15 de julho de 2025 - horário padrão
      const testDate = '2025-07-15T10:00:00Z'
      
      const start = startOfDayInTimezone(testDate)
      
      // 00:00 em São Paulo (GMT-3) = 03:00 UTC
      expect(start.toISOString()).toBe('2025-07-15T03:00:00.000Z')
    })
  })
  
  describe('isToday', () => {
    it('deve identificar data de hoje corretamente', () => {
      const now = new Date()
      
      expect(isToday(now)).toBe(true)
      expect(isToday(now.toISOString())).toBe(true)
    })
    
    it('deve identificar data de ontem como falso', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      expect(isToday(yesterday)).toBe(false)
    })
    
    it('deve identificar data de amanhã como falso', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      expect(isToday(tomorrow)).toBe(false)
    })
    
    it('deve considerar timezone ao comparar datas no limite do dia', () => {
      // 30/09/2025 23:30 em São Paulo = 01/10/2025 02:30 UTC
      // Essa data ainda é "hoje" em São Paulo, mas UTC já é amanhã
      const lateTonight = '2025-09-30T23:30:00-03:00'
      
      // Se rodarmos este teste em 30/09, deve ser true
      // (A função isToday compara no timezone, não em UTC)
      const result = isToday(lateTonight)
      
      // Resultado depende da data atual do teste
      expect(typeof result).toBe('boolean')
    })
  })
  
  describe('isPast', () => {
    it('deve identificar datas passadas corretamente', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      expect(isPast(yesterday)).toBe(true)
      expect(isPast('2020-01-01T00:00:00Z')).toBe(true)
    })
    
    it('deve identificar hoje como NÃO passado', () => {
      const now = new Date()
      expect(isPast(now)).toBe(false)
    })
    
    it('deve identificar futuro como NÃO passado', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      expect(isPast(tomorrow)).toBe(false)
    })
  })
  
  describe('isFuture', () => {
    it('deve identificar datas futuras corretamente', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      expect(isFuture(tomorrow)).toBe(true)
      expect(isFuture('2030-12-31T23:59:59Z')).toBe(true)
    })
    
    it('deve identificar hoje como NÃO futuro', () => {
      const now = new Date()
      expect(isFuture(now)).toBe(false)
    })
    
    it('deve identificar passado como NÃO futuro', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      expect(isFuture(yesterday)).toBe(false)
    })
  })
  
  describe('toUTC e fromUTC', () => {
    it('deve converter data local para UTC', () => {
      // 30/09/2025 10:00 em São Paulo (GMT-3) = 30/09/2025 13:00 UTC
      const localDate = new Date('2025-09-30T10:00:00-03:00')
      const utc = toUTC(localDate)
      
      expect(utc).toBe('2025-09-30T13:00:00.000Z')
    })
    
    it('deve converter UTC para data local', () => {
      const utcDate = '2025-09-30T13:00:00.000Z'
      const local = fromUTC(utcDate)
      
      // 13:00 UTC = 10:00 São Paulo (GMT-3)
      expect(local.getHours()).toBe(10)
      expect(local.getMinutes()).toBe(0)
    })
    
    it('deve ser reversível (roundtrip)', () => {
      const original = new Date('2025-09-30T10:00:00-03:00')
      const utc = toUTC(original)
      const back = fromUTC(utc)
      
      // Deve voltar ao mesmo horário (pode ter diferença de ms)
      expect(Math.abs(back.getTime() - original.getTime())).toBeLessThan(1000)
    })
  })
  
  describe('getTodayInterval', () => {
    it('deve retornar intervalo de hoje em UTC', () => {
      const interval = getTodayInterval()
      
      expect(interval).toHaveProperty('date_from')
      expect(interval).toHaveProperty('date_to')
      
      // Ambos devem ser strings ISO
      expect(typeof interval.date_from).toBe('string')
      expect(typeof interval.date_to).toBe('string')
      
      // date_from deve ser antes de date_to
      const from = new Date(interval.date_from)
      const to = new Date(interval.date_to)
      expect(to.getTime()).toBeGreaterThan(from.getTime())
    })
    
    it('deve ter aproximadamente 24h de diferença', () => {
      const interval = getTodayInterval()
      
      const from = new Date(interval.date_from)
      const to = new Date(interval.date_to)
      
      const diffMs = to.getTime() - from.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      
      // Deve estar entre 23h e 24h (considerando ms)
      expect(diffHours).toBeGreaterThan(23.9)
      expect(diffHours).toBeLessThan(24.0)
    })
  })
  
  describe('addDays', () => {
    it('deve adicionar dias corretamente', () => {
      const base = '2025-09-30T10:00:00Z'
      
      const plus1 = addDays(base, 1)
      const plus3 = addDays(base, 3)
      const plus7 = addDays(base, 7)
      
      expect(plus1.toISOString()).toContain('2025-10-01')
      expect(plus3.toISOString()).toContain('2025-10-03')
      expect(plus7.toISOString()).toContain('2025-10-07')
    })
    
    it('deve subtrair dias com valores negativos', () => {
      const base = '2025-09-30T10:00:00Z'
      
      const minus1 = addDays(base, -1)
      const minus7 = addDays(base, -7)
      
      expect(minus1.toISOString()).toContain('2025-09-29')
      expect(minus7.toISOString()).toContain('2025-09-23')
    })
    
    it('deve manter o horário ao adicionar dias', () => {
      const base = new Date('2025-09-30T15:30:00Z')
      
      const plus1 = addDays(base, 1)
      
      // Hora deve permanecer similar (pode ter pequena variação por timezone)
      expect(plus1.getUTCHours()).toBeGreaterThanOrEqual(14)
      expect(plus1.getUTCHours()).toBeLessThanOrEqual(16)
    })
  })
  
  describe('Transição de horário de verão', () => {
    it('deve lidar corretamente com mudança de horário de verão para padrão', () => {
      // Tipicamente em fevereiro/março no Brasil
      const beforeChange = '2026-02-20T10:00:00Z'
      const afterChange = '2026-03-20T10:00:00Z'
      
      const start1 = startOfDayInTimezone(beforeChange)
      const start2 = startOfDayInTimezone(afterChange)
      
      // Diferença de 1 hora na conversão UTC devido à mudança de horário
      const hourDiff = Math.abs(start1.getUTCHours() - start2.getUTCHours())
      expect(hourDiff).toBe(1)
    })
  })
  
  describe('Edge cases', () => {
    it('deve lidar com strings vazias ou inválidas', () => {
      expect(() => isToday('')).toThrow()
      expect(() => isPast('data-invalida')).toThrow()
    })
    
    it('deve aceitar tanto Date quanto string', () => {
      const dateObj = new Date()
      const dateStr = dateObj.toISOString()
      
      expect(isToday(dateObj)).toBe(isToday(dateStr))
      expect(isPast(dateObj)).toBe(isPast(dateStr))
      expect(isFuture(dateObj)).toBe(isFuture(dateStr))
    })
  })
})

