/**
 * Hook para Gerenciar Filtros de Onboarding
 * 
 * Funcionalidades:
 * - Estado compartilhado entre componentes do Onboarding
 * - Persistência no localStorage
 * - Debounce para busca (300ms)
 * - Reset de filtros
 * - Gerenciamento de colunas visíveis
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './useDebounce'
import { getTodayInterval } from '@/lib/date-utils'

export interface OnboardingFilters {
  status: string
  service: string
  responsible: string
  date_from: string
  date_to: string
  created_from: string
  created_to: string
  q: string
  visible_columns: string[] // Colunas visíveis no Kanban
}

// Função para obter filtros padrão
const getDefaultFilters = (): OnboardingFilters => {
  return {
    status: 'all',
    service: 'all',
    responsible: 'all',
    date_from: '',
    date_to: '',
    created_from: '',
    created_to: '',
    q: '',
    visible_columns: [] // Será preenchido dinamicamente com as colunas disponíveis
  }
}

const STORAGE_KEY = 'onboarding_filters'

export function useOnboardingFilters() {
  const [filters, setFilters] = useState<OnboardingFilters>(getDefaultFilters())
  const [debouncedFilters, setDebouncedFilters] = useState<OnboardingFilters>(getDefaultFilters())
  
  // Debounce para busca (300ms)
  const debouncedQ = useDebounce(filters.q, 300)

  // Carregar filtros do localStorage na inicialização
  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window === 'undefined') return
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsedFilters = JSON.parse(saved)
        setFilters(parsedFilters)
        setDebouncedFilters(parsedFilters)
      } else {
        // Sem filtros salvos - usar padrão
        const defaultFilters = getDefaultFilters()
        setFilters(defaultFilters)
        setDebouncedFilters(defaultFilters)
      }
    } catch (error) {
      console.warn('Erro ao carregar filtros do localStorage:', error)
      // Em caso de erro, usar padrão
      const defaultFilters = getDefaultFilters()
      setFilters(defaultFilters)
      setDebouncedFilters(defaultFilters)
    }
  }, [])

  // Salvar filtros no localStorage quando mudarem
  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
    } catch (error) {
      console.warn('Erro ao salvar filtros no localStorage:', error)
    }
  }, [filters])

  // Atualizar filtros debounced quando a busca mudar
  useEffect(() => {
    setDebouncedFilters(prev => ({
      ...prev,
      q: debouncedQ
    }))
  }, [debouncedQ])

  // Atualizar filtros
  const updateFilters = useCallback((newFilters: Partial<OnboardingFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters }
      
      // Atualizar filtros debounced imediatamente para campos não-debounced
      const nonDebouncedFields = Object.keys(newFilters).filter(key => key !== 'q')
      if (nonDebouncedFields.length > 0) {
        setDebouncedFilters(updated)
      }
      
      return updated
    })
  }, [])

  // Resetar filtros
  const resetFilters = useCallback(() => {
    const defaultFilters = getDefaultFilters()
    setFilters(defaultFilters)
    setDebouncedFilters(defaultFilters)
  }, [])

  // Atalho para filtrar apenas hoje
  const setToday = useCallback(() => {
    const today = getTodayInterval()
    const todayFilters = {
      ...filters,
      date_from: today.date_from,
      date_to: today.date_to
    }
    setFilters(todayFilters)
    setDebouncedFilters(todayFilters)
  }, [filters])

  // Verificar se há filtros ativos
  const hasActiveFilters = useCallback(() => {
    return Object.entries(filters).some(([key, value]) => 
      key !== 'q' && key !== 'visible_columns' && value && value !== 'all' && value !== ''
    ) || filters.q.trim() !== '' || filters.visible_columns.length > 0
  }, [filters])

  // Obter filtros para API (remover campos vazios e mapear nomes para a API)
  const getApiFilters = useCallback(() => {
    const apiFilters: Record<string, string | string[]> = {}

    const entries = Object.entries(debouncedFilters)
    for (const [key, value] of entries) {
      if (!value || (typeof value === 'string' && value.trim() === '') || value === 'all') continue
      if (key === 'visible_columns') {
        apiFilters['visible_columns'] = value as string[]
      } else if (key === 'date_from') {
        apiFilters['created_from'] = value as string
      } else if (key === 'date_to') {
        apiFilters['created_to'] = value as string
      } else {
        apiFilters[key] = value as string
      }
    }

    return apiFilters
  }, [debouncedFilters])

  // Contar filtros ativos (não conta filtros padrão)
  const getActiveFiltersCount = useCallback(() => {
    const defaultFilters = getDefaultFilters()
    let count = 0
    
    // Contar filtros não-padrão
    if (filters.q.trim() !== '') count++
    if (filters.status !== defaultFilters.status) count++
    if (filters.service !== defaultFilters.service) count++
    if (filters.responsible !== defaultFilters.responsible) count++
    if (filters.created_from !== defaultFilters.created_from) count++
    if (filters.created_to !== defaultFilters.created_to) count++
    if (filters.date_from !== defaultFilters.date_from) count++
    if (filters.date_to !== defaultFilters.date_to) count++
    
    // Contar colunas visíveis (se alguma coluna foi selecionada)
    if (filters.visible_columns.length > 0) count++
    
    return count
  }, [filters])

  return {
    filters,
    debouncedFilters,
    updateFilters,
    resetFilters,
    setToday,
    hasActiveFilters,
    getApiFilters,
    getActiveFiltersCount
  }
}
