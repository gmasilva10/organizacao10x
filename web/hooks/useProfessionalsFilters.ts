/**
 * Hook para Gerenciar Filtros de Profissionais
 * 
 * Funcionalidades:
 * - Persistência no localStorage
 * - Debounce para busca
 * - Reset de filtros
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './useDebounce'

export interface ProfessionalsFilters {
  search: string
  status: string
  profile: string
  dateFrom: string
  dateTo: string
}

// Função para obter filtros padrão
const getDefaultFilters = (): ProfessionalsFilters => {
  return {
    search: '',
    status: 'all',
    profile: 'all',
    dateFrom: '',
    dateTo: ''
  }
}

const STORAGE_KEY = 'professionals_filters'

export function useProfessionalsFilters() {
  const [filters, setFilters] = useState<ProfessionalsFilters>(getDefaultFilters())
  const [debouncedFilters, setDebouncedFilters] = useState<ProfessionalsFilters>(getDefaultFilters())
  
  // Debounce para busca (300ms)
  const debouncedSearch = useDebounce(filters.search, 300)

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
      search: debouncedSearch
    }))
  }, [debouncedSearch])

  // Atualizar filtros
  const updateFilters = useCallback((newFilters: Partial<ProfessionalsFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters }
      
      // Atualizar filtros debounced imediatamente para campos não-debounced
      const nonDebouncedFields = Object.keys(newFilters).filter(key => key !== 'search')
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

  // Verificar se há filtros ativos
  const hasActiveFilters = useCallback(() => {
    const defaultFilters = getDefaultFilters()
    return Object.entries(filters).some(([key, value]) => {
      const defaultValue = defaultFilters[key as keyof ProfessionalsFilters]
      return value !== defaultValue
    })
  }, [filters])

  // Obter filtros para API (remover campos vazios)
  const getApiFilters = useCallback(() => {
    const apiFilters: Record<string, string> = {}

    const entries = Object.entries(debouncedFilters)
    for (const [key, value] of entries) {
      if (!value || (typeof value === 'string' && value.trim() === '') || value === 'all') continue
      apiFilters[key] = value as string
    }

    return apiFilters
  }, [debouncedFilters])

  // Contar filtros ativos
  const getActiveFiltersCount = useCallback(() => {
    const defaultFilters = getDefaultFilters()
    let count = 0
    
    // Contar filtros não-padrão
    if (filters.search.trim() !== '') count++
    if (filters.status !== defaultFilters.status) count++
    if (filters.profile !== defaultFilters.profile) count++
    if (filters.dateFrom !== defaultFilters.dateFrom) count++
    if (filters.dateTo !== defaultFilters.dateTo) count++
    
    return count
  }, [filters])

  // Aplicar filtros (para uso no botão "Aplicar")
  const applyFilters = useCallback(() => {
    setDebouncedFilters(filters)
  }, [filters])

  return {
    filters,
    debouncedFilters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    getApiFilters,
    getActiveFiltersCount,
    applyFilters
  }
}

