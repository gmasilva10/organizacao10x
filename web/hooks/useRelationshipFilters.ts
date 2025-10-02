/**
 * GATE 10.6.4 - Hook para Gerenciar Filtros de Relacionamento
 * 
 * Funcionalidades:
 * - Estado compartilhado entre Kanban e Calendário
 * - Persistência no localStorage
 * - Debounce para busca
 * - Reset de filtros
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './useDebounce'
import { getTodayInterval } from '@/lib/date-utils'

export interface RelationshipFilters {
  status: string
  anchor: string
  template_code: string
  channel: string
  date_from: string
  date_to: string
  q: string
}

// Função para obter filtros padrão (hoje)
const getDefaultFilters = (): RelationshipFilters => {
  const today = getTodayInterval()
  return {
    status: 'all',
    anchor: 'all',
    template_code: 'all',
    channel: 'all',
    date_from: today.date_from,
    date_to: today.date_to,
    q: ''
  }
}

const STORAGE_KEY = 'relationship_filters'

export function useRelationshipFilters() {
  const [filters, setFilters] = useState<RelationshipFilters>(getDefaultFilters())
  const [debouncedFilters, setDebouncedFilters] = useState<RelationshipFilters>(getDefaultFilters())
  
  // Debounce para busca (500ms)
  const debouncedQ = useDebounce(filters.q, 500)

  // Carregar filtros do localStorage na inicialização
  // Se não houver filtros salvos, usar filtro padrão "hoje"
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
        // Sem filtros salvos - usar padrão "hoje"
        const defaultFilters = getDefaultFilters()
        setFilters(defaultFilters)
        setDebouncedFilters(defaultFilters)
      }
    } catch (error) {
      console.warn('Erro ao carregar filtros do localStorage:', error)
      // Em caso de erro, usar padrão "hoje"
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
  const updateFilters = useCallback((newFilters: Partial<RelationshipFilters>) => {
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

  // Resetar filtros (volta para "hoje")
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
      key !== 'q' && value && value !== 'all'
    ) || filters.q.trim() !== ''
  }, [filters])

  // Obter filtros para API (remover campos vazios)
  const getApiFilters = useCallback(() => {
    const apiFilters: Record<string, string> = {}
    
    Object.entries(debouncedFilters).forEach(([key, value]) => {
      if (value && value !== 'all' && value.trim() !== '') {
        apiFilters[key] = value
      }
    })
    
    return apiFilters
  }, [debouncedFilters])

  // Contar filtros ativos
  const getActiveFiltersCount = useCallback(() => {
    return Object.entries(filters).filter(([key, value]) => 
      key !== 'q' && value && value !== 'all'
    ).length + (filters.q.trim() !== '' ? 1 : 0)
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
