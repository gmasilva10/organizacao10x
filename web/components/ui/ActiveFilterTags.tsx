/**
 * Componente de Tags de Filtros Ativos
 * 
 * Funcionalidades:
 * - Exibe filtros ativos como tags removíveis
 * - Suporte a diferentes tipos de valores
 * - Layout responsivo
 * - Ações de remoção individual e em lote
 */

'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

import type { FilterDefinition, FilterValue } from '@/hooks/useAdvancedFilters'

interface ActiveFilterTagsProps {
  filters: FilterDefinition[]
  values: FilterValue
  onRemoveFilter: (key: string) => void
  onClearAll: () => void
  className?: string
  maxVisible?: number
  showClearAll?: boolean
  compact?: boolean
}

export function ActiveFilterTags({
  filters,
  values,
  onRemoveFilter,
  onClearAll,
  className,
  maxVisible = 10,
  showClearAll = true,
  compact = false
}: ActiveFilterTagsProps) {
  
  const formatFilterValue = (filter: FilterDefinition, value: any): string => {
    if (value === null || value === undefined || value === '') return ''
    
    switch (filter.type) {
      case 'text':
        return value as string
        
      case 'select':
        const option = filter.options?.find(opt => opt.value === value)
        return option?.label || value as string
        
      case 'multiselect':
        if (Array.isArray(value) && value.length > 0) {
          const labels = value.map(v => 
            filter.options?.find(opt => opt.value === v)?.label || v
          )
          return labels.length <= 2 
            ? labels.join(', ')
            : `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`
        }
        return ''
        
      case 'date':
        return format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })
        
      case 'daterange':
        if (value?.from && value?.to) {
          const from = format(new Date(value.from), 'dd/MM/yyyy', { locale: ptBR })
          const to = format(new Date(value.to), 'dd/MM/yyyy', { locale: ptBR })
          return `${from} - ${to}`
        } else if (value?.from) {
          return `De ${format(new Date(value.from), 'dd/MM/yyyy', { locale: ptBR })}`
        } else if (value?.to) {
          return `Até ${format(new Date(value.to), 'dd/MM/yyyy', { locale: ptBR })}`
        }
        return ''
        
      case 'number':
        return value.toString()
        
      case 'boolean':
        return value ? 'Sim' : 'Não'
        
      default:
        return String(value)
    }
  }
  
  const activeFilters = filters
    .map(filter => ({
      filter,
      value: values[filter.key],
      formatted: formatFilterValue(filter, values[filter.key])
    }))
    .filter(item => {
      // Verificar se o filtro tem valor ativo
      const { value } = item
      if (value === null || value === undefined || value === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      if (typeof value === 'object' && value !== null) {
        // Para daterange, verificar se pelo menos um campo tem valor
        return value.from || value.to
      }
      return true
    })
  
  if (activeFilters.length === 0) return null
  
  const visibleFilters = activeFilters.slice(0, maxVisible)
  const hiddenCount = activeFilters.length - maxVisible
  
  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium text-muted-foreground", compact && "text-xs")}>
            Filtros ativos:
          </span>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {activeFilters.length}
          </Badge>
        </div>
        {showClearAll && activeFilters.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className={cn("h-6 px-2 text-xs text-muted-foreground hover:text-foreground", compact && "h-5")}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Limpar todos
          </Button>
        )}
      </div>
      
      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {visibleFilters.map(({ filter, formatted }) => (
          <Badge
            key={filter.key}
            variant="secondary"
            className={cn(
              "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
              "flex items-center gap-1 px-2 py-1",
              compact && "text-xs px-1.5 py-0.5"
            )}
          >
            <span className="font-medium">{filter.label}:</span>
            <span>{formatted}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveFilter(filter.key)}
              className={cn(
                "h-4 w-4 p-0 hover:bg-blue-300",
                compact && "h-3 w-3"
              )}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        
        {hiddenCount > 0 && (
          <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
            +{hiddenCount} mais
          </Badge>
        )}
      </div>
    </div>
  )
}

export default ActiveFilterTags
