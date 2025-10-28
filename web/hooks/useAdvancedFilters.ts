/**
 * Hook Genérico para Filtros Avançados
 * 
 * Funcionalidades:
 * - Filtros múltiplos com tipos diferentes
 * - Persistência no localStorage
 * - Debounce para busca
 * - Validação de filtros
 * - Reset de filtros
 * - Contagem de filtros ativos
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useOptimizedDebounce } from './useOptimizedDebounce'

// Tipos de filtros suportados
export type FilterType = 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'boolean'

export interface FilterDefinition {
  key: string
  label: string
  type: FilterType
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  validation?: {
    min?: number
    max?: number
    pattern?: RegExp
    required?: boolean
  }
  defaultValue?: any
}

export interface AdvancedFiltersConfig {
  storageKey: string
  filters: FilterDefinition[]
  debounceMs?: number
  autoSave?: boolean
}

export interface FilterValue {
  [key: string]: any
}

export interface AdvancedFiltersState {
  values: FilterValue
  debouncedValues: FilterValue
  isValid: boolean
  errors: Record<string, string>
  hasActiveFilters: boolean
  activeFiltersCount: number
}

export function useAdvancedFilters(config: AdvancedFiltersConfig) {
  const {
    storageKey,
    filters,
    debounceMs = 300,
    autoSave = true
  } = config

  // Estado dos filtros
  const [state, setState] = useState<AdvancedFiltersState>(() => {
    const defaultValues = getDefaultValues(filters)
    return {
      values: defaultValues,
      debouncedValues: defaultValues,
      isValid: true,
      errors: {},
      hasActiveFilters: false,
      activeFiltersCount: 0
    }
  })

  // Debounce para valores de filtro
  const debouncedValues = useOptimizedDebounce(state.values, debounceMs)

  // Carregar filtros do localStorage na inicialização
  useEffect(() => {
    if (typeof window === 'undefined' || !autoSave) return
    
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsedValues = JSON.parse(saved)
        const validatedValues = validateFilters(parsedValues, filters)
        
        setState(prev => ({
          ...prev,
          values: validatedValues.values,
          errors: validatedValues.errors,
          isValid: validatedValues.isValid
        }))
      }
    } catch (error) {
      console.warn(`Erro ao carregar filtros do localStorage (${storageKey}):`, error)
    }
  }, [storageKey, autoSave])

  // Salvar filtros no localStorage quando mudarem
  useEffect(() => {
    if (typeof window === 'undefined' || !autoSave) return
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(state.values))
    } catch (error) {
      console.warn(`Erro ao salvar filtros no localStorage (${storageKey}):`, error)
    }
  }, [state.values, storageKey, autoSave])

  // Atualizar filtros debounced
  useEffect(() => {
    setState(prev => ({
      ...prev,
      debouncedValues
    }))
  }, [debouncedValues])

  // Atualizar filtros
  const updateFilter = useCallback((key: string, value: any) => {
    setState(prev => {
      const newValues = { ...prev.values, [key]: value }
      const validation = validateFilters(newValues, filters)
      
      return {
        ...prev,
        values: newValues,
        errors: validation.errors,
        isValid: validation.isValid
      }
    })
  }, [filters])

  // Atualizar múltiplos filtros
  const updateFilters = useCallback((updates: Partial<FilterValue>) => {
    setState(prev => {
      const newValues = { ...prev.values, ...updates }
      const validation = validateFilters(newValues, filters)
      
      return {
        ...prev,
        values: newValues,
        errors: validation.errors,
        isValid: validation.isValid
      }
    })
  }, [filters])

  // Resetar filtros
  const resetFilters = useCallback(() => {
    const defaultValues = getDefaultValues(filters)
    setState(prev => ({
      ...prev,
      values: defaultValues,
      debouncedValues: defaultValues,
      errors: {},
      isValid: true
    }))
  }, [filters])

  // Limpar um filtro específico
  const clearFilter = useCallback((key: string) => {
    const filterDef = filters.find(f => f.key === key)
    if (!filterDef) return

    const defaultValue = filterDef.defaultValue ?? getDefaultValueForType(filterDef.type)
    updateFilter(key, defaultValue)
  }, [filters, updateFilter])

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    const defaultValues = getDefaultValues(filters)
    return Object.keys(state.values).some(key => {
      const currentValue = state.values[key]
      const defaultValue = defaultValues[key]
      
      if (Array.isArray(currentValue)) {
        return currentValue.length > 0 && JSON.stringify(currentValue.sort()) !== JSON.stringify(defaultValue.sort())
      }
      
      return currentValue !== defaultValue && 
             currentValue !== '' && 
             currentValue !== null && 
             currentValue !== undefined
    })
  }, [state.values, filters])

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    const defaultValues = getDefaultValues(filters)
    let count = 0
    
    Object.keys(state.values).forEach(key => {
      const currentValue = state.values[key]
      const defaultValue = defaultValues[key]
      
      if (Array.isArray(currentValue)) {
        if (currentValue.length > 0 && JSON.stringify(currentValue.sort()) !== JSON.stringify(defaultValue.sort())) {
          count++
        }
      } else if (currentValue !== defaultValue && 
                 currentValue !== '' && 
                 currentValue !== null && 
                 currentValue !== undefined) {
        count++
      }
    })
    
    return count
  }, [state.values, filters])

  // Obter filtros para API (remover valores padrão e vazios)
  const getApiFilters = useCallback(() => {
    const apiFilters: Record<string, any> = {}
    const defaultValues = getDefaultValues(filters)

    Object.keys(state.debouncedValues).forEach(key => {
      const value = state.debouncedValues[key]
      const defaultValue = defaultValues[key]
      
      // Pular valores padrão ou vazios
      if (value === defaultValue || 
          value === '' || 
          value === null || 
          value === undefined ||
          (Array.isArray(value) && value.length === 0)) {
        return
      }
      
      apiFilters[key] = value
    })

    return apiFilters
  }, [state.debouncedValues, filters])

  // Obter filtros para URL (para compartilhamento)
  const getUrlFilters = useCallback(() => {
    const urlFilters: Record<string, string> = {}
    const defaultValues = getDefaultValues(filters)

    Object.keys(state.values).forEach(key => {
      const value = state.values[key]
      const defaultValue = defaultValues[key]
      
      if (value !== defaultValue && 
          value !== '' && 
          value !== null && 
          value !== undefined) {
        if (Array.isArray(value)) {
          urlFilters[key] = value.join(',')
        } else {
          urlFilters[key] = String(value)
        }
      }
    })

    return urlFilters
  }, [state.values, filters])

  // Carregar filtros da URL
  const loadFiltersFromUrl = useCallback((urlParams: URLSearchParams) => {
    const newValues = { ...state.values }
    
    filters.forEach(filter => {
      const paramValue = urlParams.get(filter.key)
      if (paramValue) {
        let parsedValue: any = paramValue
        
        // Parse baseado no tipo
        switch (filter.type) {
          case 'multiselect':
            parsedValue = paramValue.split(',').filter(Boolean)
            break
          case 'number':
            parsedValue = Number(paramValue)
            if (isNaN(parsedValue)) parsedValue = filter.defaultValue
            break
          case 'boolean':
            parsedValue = paramValue === 'true'
            break
          case 'date':
          case 'daterange':
            // Manter como string para validação posterior
            break
          default:
            // Manter como string
            break
        }
        
        newValues[filter.key] = parsedValue
      }
    })
    
    const validation = validateFilters(newValues, filters)
    setState(prev => ({
      ...prev,
      values: newValues,
      errors: validation.errors,
      isValid: validation.isValid
    }))
  }, [state.values, filters])

  return {
    ...state,
    updateFilter,
    updateFilters,
    resetFilters,
    clearFilter,
    hasActiveFilters,
    activeFiltersCount,
    getApiFilters,
    getUrlFilters,
    loadFiltersFromUrl
  }
}

// Funções auxiliares
function getDefaultValues(filters: FilterDefinition[]): FilterValue {
  const values: FilterValue = {}
  
  filters.forEach(filter => {
    values[filter.key] = filter.defaultValue ?? getDefaultValueForType(filter.type)
  })
  
  return values
}

function getDefaultValueForType(type: FilterType): any {
  switch (type) {
    case 'text':
    case 'select':
    case 'date':
      return ''
    case 'multiselect':
      return []
    case 'daterange':
      return { from: '', to: '' }
    case 'number':
      return null
    case 'boolean':
      return false
    default:
      return ''
  }
}

function validateFilters(values: FilterValue, filters: FilterDefinition[]): {
  isValid: boolean
  errors: Record<string, string>
  values: FilterValue
} {
  const errors: Record<string, string> = {}
  let isValid = true
  
  filters.forEach(filter => {
    const value = values[filter.key]
    const validation = filter.validation
    
    if (!validation) return
    
    // Validação de campo obrigatório
    if (validation.required && (!value || value === '' || (Array.isArray(value) && value.length === 0))) {
      errors[filter.key] = `${filter.label} é obrigatório`
      isValid = false
      return
    }
    
    // Validação de padrão (regex)
    if (validation.pattern && value && typeof value === 'string' && !validation.pattern.test(value)) {
      errors[filter.key] = `${filter.label} tem formato inválido`
      isValid = false
    }
    
    // Validação de número (min/max)
    if (filter.type === 'number' && value !== null && value !== undefined) {
      const numValue = Number(value)
      if (isNaN(numValue)) {
        errors[filter.key] = `${filter.label} deve ser um número válido`
        isValid = false
      } else {
        if (validation.min !== undefined && numValue < validation.min) {
          errors[filter.key] = `${filter.label} deve ser maior ou igual a ${validation.min}`
          isValid = false
        }
        if (validation.max !== undefined && numValue > validation.max) {
          errors[filter.key] = `${filter.label} deve ser menor ou igual a ${validation.max}`
          isValid = false
        }
      }
    }
  })
  
  return { isValid, errors, values }
}
