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

export interface RelationshipFilters {
  status: string
  anchor: string
  template_code: string
  channel: string
  date_from: string
  date_to: string
  q: string
}

const DEFAULT_FILTERS: RelationshipFilters = {
  status: 'all',
  anchor: 'all',
  template_code: 'all',
  channel: 'all',
  date_from: '',
  date_to: '',
  q: ''
}

const STORAGE_KEY = 'relationship_filters'

export function useRelationshipFilters() {
  const [filters, setFilters] = useState<RelationshipFilters>(DEFAULT_FILTERS)
  const [debouncedFilters, setDebouncedFilters] = useState<RelationshipFilters>(DEFAULT_FILTERS)
  
  // Debounce para busca (500ms)
  const debouncedQ = useDebounce(filters.q, 500)

  // Carregar filtros do localStorage na inicialização
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsedFilters = JSON.parse(saved)
        setFilters(parsedFilters)
        setDebouncedFilters(parsedFilters)
      }
    } catch (error) {
      console.warn('Erro ao carregar filtros do localStorage:', error)
    }
  }, [])

  // Salvar filtros no localStorage quando mudarem
  useEffect(() => {
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

  // Resetar filtros
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setDebouncedFilters(DEFAULT_FILTERS)
  }, [])

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
    hasActiveFilters: hasActiveFilters(),
    getApiFilters,
    getActiveFiltersCount: getActiveFiltersCount()
  }
}
