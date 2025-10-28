/**
 * Hook específico para filtros de estudantes
 * 
 * Funcionalidades:
 * - Filtros pré-configurados para estudantes
 * - Integração com API de estudantes
 * - Validações específicas
 * - Persistência de estado
 */

'use client'

import { useMemo } from 'react'
import { useAdvancedFilters, FilterDefinition } from './useAdvancedFilters'

// Configuração de filtros para estudantes
const STUDENT_FILTERS: FilterDefinition[] = [
  {
    key: 'name',
    label: 'Nome do Aluno',
    type: 'text',
    placeholder: 'Digite o nome do aluno...',
    validation: {
      required: false,
      min: 2
    }
  },
  {
    key: 'email',
    label: 'E-mail',
    type: 'text',
    placeholder: 'Digite o e-mail...',
    validation: {
      required: false,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  },
  {
    key: 'phone',
    label: 'Telefone',
    type: 'text',
    placeholder: 'Digite o telefone...',
    validation: {
      required: false,
      min: 10
    }
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'onboarding', label: 'Em Onboarding' },
      { value: 'active', label: 'Ativo' },
      { value: 'inactive', label: 'Inativo' },
      { value: 'completed', label: 'Concluído' }
    ]
  },
  {
    key: 'trainer',
    label: 'Treinador',
    type: 'multiselect',
    options: [] // Será preenchido dinamicamente
  },
  {
    key: 'createdAt',
    label: 'Data de Cadastro',
    type: 'daterange',
    placeholder: 'Selecione o período...'
  },
  {
    key: 'lastActivity',
    label: 'Última Atividade',
    type: 'daterange',
    placeholder: 'Selecione o período...'
  },
  {
    key: 'age',
    label: 'Idade',
    type: 'number',
    validation: {
      min: 0,
      max: 100
    }
  },
  {
    key: 'hasPhone',
    label: 'Tem Telefone',
    type: 'boolean'
  },
  {
    key: 'hasEmail',
    label: 'Tem E-mail',
    type: 'boolean'
  }
]

interface UseStudentFiltersOptions {
  storageKey?: string
  debounceMs?: number
  trainers?: Array<{ id: string; name: string }>
  onFiltersChange?: (filters: Record<string, any>) => void
}

export function useStudentFilters(options: UseStudentFiltersOptions = {}) {
  const {
    storageKey = 'student-filters',
    debounceMs = 300,
    trainers = [],
    onFiltersChange
  } = options
  
  // Atualizar opções de treinadores dinamicamente
  const filters = useMemo(() => {
    return STUDENT_FILTERS.map(filter => {
      if (filter.key === 'trainer') {
        return {
          ...filter,
          options: trainers.map(trainer => ({
            value: trainer.id,
            label: trainer.name
          }))
        }
      }
      return filter
    })
  }, [trainers])
  
  const {
    values,
    errors,
    isValid,
    hasActiveFilters,
    activeFiltersCount,
    debouncedValues,
    updateFilter,
    resetFilters,
    clearFilter
  } = useAdvancedFilters({ filters, storageKey, debounceMs })
  
  // Helpers específicos para estudantes
  const getStudentQueryParams = () => {
    const params = new URLSearchParams()
    
    // Nome
    if (values.name) {
      params.append('q', values.name)
    }
    
    // Status
    if (values.status) {
      params.append('status', values.status)
    }
    
    // Treinadores (múltiplos)
    if (values.trainer && Array.isArray(values.trainer) && values.trainer.length > 0) {
      values.trainer.forEach(trainerId => {
        params.append('trainer', trainerId)
      })
    }
    
    // Data de criação
    if (values.createdAt?.from) {
      params.append('created_from', values.createdAt.from)
    }
    if (values.createdAt?.to) {
      params.append('created_to', values.createdAt.to)
    }
    
    // Última atividade
    if (values.lastActivity?.from) {
      params.append('last_activity_from', values.lastActivity.from)
    }
    if (values.lastActivity?.to) {
      params.append('last_activity_to', values.lastActivity.to)
    }
    
    // Idade
    if (values.age) {
      params.append('age', values.age.toString())
    }
    
    // Filtros booleanos
    if (values.hasPhone === true) {
      params.append('has_phone', 'true')
    }
    if (values.hasEmail === true) {
      params.append('has_email', 'true')
    }
    
    return params.toString()
  }
  
  const getStudentFilters = () => {
    const filters: Record<string, any> = {}
    
    // Nome (busca em nome, email, telefone)
    if (values.name) {
      filters.search = values.name
    }
    
    // Status
    if (values.status) {
      filters.status = values.status
    }
    
    // Treinadores
    if (values.trainer && Array.isArray(values.trainer) && values.trainer.length > 0) {
      filters.trainer_ids = values.trainer
    }
    
    // Datas
    if (values.createdAt?.from) {
      filters.created_from = values.createdAt.from
    }
    if (values.createdAt?.to) {
      filters.created_to = values.createdAt.to
    }
    
    if (values.lastActivity?.from) {
      filters.last_activity_from = values.lastActivity.from
    }
    if (values.lastActivity?.to) {
      filters.last_activity_to = values.lastActivity.to
    }
    
    // Idade
    if (values.age) {
      filters.age = values.age
    }
    
    // Booleanos
    if (values.hasPhone === true) {
      filters.has_phone = true
    }
    if (values.hasEmail === true) {
      filters.has_email = true
    }
    
    return filters
  }
  
  const clearAllFilters = () => {
    resetFilters()
  }
  
  const setQuickFilter = (key: string, value: any) => {
    updateFilter(key, value)
  }
  
  const setStatusFilter = (status: string) => {
    updateFilter('status', status)
  }
  
  const setTrainerFilter = (trainerIds: string[]) => {
    updateFilter('trainer', trainerIds)
  }
  
  const setDateRangeFilter = (from: string, to: string) => {
    updateFilter('createdAt', { from, to })
  }
  
  return {
    // Estado dos filtros
    filters,
    values,
    errors,
    isValid,
    hasActiveFilters,
    activeFiltersCount,
    debouncedValues,
    
    // Ações
    updateFilter,
    resetFilters,
    clearFilter,
    clearAllFilters,
    
    // Helpers específicos
    getStudentQueryParams,
    getStudentFilters,
    setQuickFilter,
    setStatusFilter,
    setTrainerFilter,
    setDateRangeFilter,
    
    // Estado específico
    selectedStatus: values.status,
    selectedTrainers: values.trainer || [],
    selectedDateRange: values.createdAt,
    searchQuery: values.name || ''
  }
}

export default useStudentFilters
