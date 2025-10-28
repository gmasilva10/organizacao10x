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
import { formatDateForInput, parseDateFromInput } from '@/lib/date-formatters'

export interface RelationshipFilters {
  status: string
  anchor: string
  template_code: string
  channel: string
  date_from: string
  date_to: string
  created_from: string
  created_to: string
  q: string
  visible_columns: string[] // Novo campo para filtro de colunas
}

// Interface para filtros no UI (com datas formatadas para input[type="date"])
export interface RelationshipFiltersUI {
  status: string
  anchor: string
  template_code: string
  channel: string
  date_from: string // Formato YYYY-MM-DD para input[type="date"]
  date_to: string   // Formato YYYY-MM-DD para input[type="date"]
  created_from: string // Formato YYYY-MM-DD para input[type="date"]
  created_to: string   // Formato YYYY-MM-DD para input[type="date"]
  q: string
  visible_columns: string[]
}

// Função para obter filtros padrão (vazios - sem filtros aplicados)
const getDefaultFilters = (): RelationshipFilters => {
  return {
    status: 'all',
    anchor: 'all',
    template_code: 'all',
    channel: 'all',
    date_from: '',        // VAZIO - sem filtro de data
    date_to: '',          // VAZIO - sem filtro de data
    created_from: '',
    created_to: '',
    q: '',
    visible_columns: ['overdue', 'due_today', 'pending_future', 'sent', 'postponed_skipped'] // Todas as colunas visíveis por padrão
  }
}

// Função para obter filtros de "hoje" (filtro explícito)
const getTodayFilters = (): RelationshipFilters => {
  const today = getTodayInterval()
  return {
    status: 'all',
    anchor: 'all',
    template_code: 'all',
    channel: 'all',
    date_from: today.date_from,
    date_to: today.date_to,
    created_from: '',
    created_to: '',
    q: '',
    visible_columns: ['overdue', 'due_today', 'pending_future', 'sent', 'postponed_skipped']
  }
}

const STORAGE_KEY = 'relationship_filters'

// Funções de conversão entre formatos de data
const convertFiltersToUI = (filters: RelationshipFilters): RelationshipFiltersUI => {
  return {
    ...filters,
    date_from: formatDateForInput(filters.date_from),
    date_to: formatDateForInput(filters.date_to),
    created_from: formatDateForInput(filters.created_from),
    created_to: formatDateForInput(filters.created_to)
  }
}

const convertFiltersFromUI = (uiFilters: RelationshipFiltersUI): RelationshipFilters => {
  return {
    ...uiFilters,
    date_from: parseDateFromInput(uiFilters.date_from),
    date_to: parseDateFromInput(uiFilters.date_to),
    created_from: parseDateFromInput(uiFilters.created_from),
    created_to: parseDateFromInput(uiFilters.created_to)
  }
}

export function useRelationshipFilters() {
  const [filters, setFilters] = useState<RelationshipFilters>(getDefaultFilters())
  const [debouncedFilters, setDebouncedFilters] = useState<RelationshipFilters>(getDefaultFilters())
  
  // Debounce para busca (500ms)
  const debouncedQ = useDebounce(filters.q, 500)

  // Carregar filtros do localStorage na inicialização
  // Se não houver filtros salvos, usar filtros vazios (sem filtros aplicados)
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
        // Sem filtros salvos - usar filtros vazios (sem filtros aplicados)
        const defaultFilters = getDefaultFilters()
        setFilters(defaultFilters)
        setDebouncedFilters(defaultFilters)
      }
    } catch (error) {
      console.warn('Erro ao carregar filtros do localStorage:', error)
      // Em caso de erro, usar filtros vazios
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

  // Atualizar filtros (formato interno - ISO UTC)
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

  // Atualizar filtros do UI (formato YYYY-MM-DD) - converte para formato interno
  const updateFiltersUI = useCallback((newFilters: Partial<RelationshipFiltersUI>) => {
    // Converter campos de data do formato UI para formato interno
    const convertedFilters: Partial<RelationshipFilters> = { ...newFilters }
    
    if (newFilters.date_from !== undefined) {
      convertedFilters.date_from = parseDateFromInput(newFilters.date_from)
    }
    if (newFilters.date_to !== undefined) {
      convertedFilters.date_to = parseDateFromInput(newFilters.date_to)
    }
    if (newFilters.created_from !== undefined) {
      convertedFilters.created_from = parseDateFromInput(newFilters.created_from)
    }
    if (newFilters.created_to !== undefined) {
      convertedFilters.created_to = parseDateFromInput(newFilters.created_to)
    }
    
    updateFilters(convertedFilters)
  }, [updateFilters])

  // Resetar filtros (volta para "hoje")
  const resetFilters = useCallback(() => {
    const defaultFilters = getDefaultFilters()
    setFilters(defaultFilters)
    setDebouncedFilters(defaultFilters)
  }, [])

  // Atalho para filtrar apenas hoje
  const setToday = useCallback(() => {
    const todayFilters = getTodayFilters()
    setFilters(todayFilters)
    setDebouncedFilters(todayFilters)
  }, [])

  // Verificar se há filtros ativos
  const hasActiveFilters = useCallback(() => {
    return Object.entries(filters).some(([key, value]) => 
      key !== 'q' && value && value !== 'all' && value !== ''
    ) || filters.q.trim() !== ''
  }, [filters])

  // Forçar aplicação dos filtros (para o botão "Aplicar Filtros")
  const applyFilters = useCallback(() => {
    setDebouncedFilters(filters)
  }, [filters])

  // Mapeamento de status visuais para status reais do banco
  const mapStatusToApi = (status: string): { status: string | null; dateFilter?: { from?: string; to?: string } } => {
    switch (status) {
      case 'overdue':
        return { 
          status: 'pending',
          dateFilter: { to: new Date().toISOString() } // Apenas tarefas agendadas para antes de agora
        }
      case 'due_today':
        return { 
          status: 'pending',
          dateFilter: { 
            from: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
            to: new Date(new Date().setHours(23, 59, 59, 999)).toISOString()
          }
        }
      case 'pending_future':
        return { 
          status: 'pending',
          dateFilter: { from: new Date().toISOString() } // Apenas tarefas agendadas para depois de agora
        }
      case 'sent':
        return { status: 'sent' }
      case 'postponed_skipped':
        return { status: 'postponed' }
      case 'all':
        return { status: null } // Não filtrar por status
      default:
        return { status }
    }
  }

  // Obter filtros para API (remover campos vazios e mapear nomes para a API)
  const getApiFilters = useCallback(() => {
    const apiFilters: Record<string, string> = {}

    const entries = Object.entries(debouncedFilters)
    for (const [key, value] of entries) {
      if (!value || (typeof value === 'string' && value.trim() === '') || value === 'all') continue
      
      if (key === 'status') {
        const mappedStatus = mapStatusToApi(value as string)
        if (mappedStatus.status) {
          apiFilters['status'] = mappedStatus.status
        }
        // Aplicar filtros de data específicos para cada status
        if (mappedStatus.dateFilter) {
          if (mappedStatus.dateFilter.from) {
            apiFilters['scheduled_from'] = mappedStatus.dateFilter.from
          }
          if (mappedStatus.dateFilter.to) {
            apiFilters['scheduled_to'] = mappedStatus.dateFilter.to
          }
        }
      } else if (key === 'date_from') {
        apiFilters['scheduled_from'] = value as string
      } else if (key === 'date_to') {
        apiFilters['scheduled_to'] = value as string
      } else if (key === 'created_from') {
        apiFilters['created_from'] = value as string
      } else if (key === 'created_to') {
        apiFilters['created_to'] = value as string
      } else {
        apiFilters[key] = value as string
      }
    }

    return apiFilters
  }, [debouncedFilters])

  // Contar filtros ativos (apenas filtros explicitamente configurados)
  const getActiveFiltersCount = useCallback(() => {
    let count = 0
    
    // Contar apenas filtros explicitamente configurados
    if (filters.q.trim() !== '') count++
    if (filters.anchor !== 'all') count++
    if (filters.template_code !== 'all') count++
    if (filters.channel !== 'all') count++
    if (filters.created_from !== '') count++
    if (filters.created_to !== '') count++
    if (filters.date_from !== '') count++
    if (filters.date_to !== '') count++
    
    // Contar colunas ocultas (se não são todas visíveis)
    const allColumns = ['overdue', 'due_today', 'pending_future', 'sent', 'postponed_skipped']
    if (JSON.stringify(filters.visible_columns.sort()) !== JSON.stringify(allColumns.sort())) count++
    
    return count
  }, [filters])

  // Filtros formatados para UI (com datas no formato YYYY-MM-DD)
  const filtersUI = convertFiltersToUI(filters)

  return {
    filters,
    filtersUI, // Filtros formatados para UI
    debouncedFilters,
    updateFilters,
    updateFiltersUI, // Função para atualizar filtros do UI
    resetFilters,
    setToday,
    hasActiveFilters,
    getApiFilters,
    getActiveFiltersCount,
    applyFilters
  }
}
