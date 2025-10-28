/**
 * Componente de Filtros Avançados Genérico
 * 
 * Funcionalidades:
 * - Renderização automática baseada na configuração
 * - Suporte a diferentes tipos de filtros
 * - Validação em tempo real
 * - Persistência de estado
 * - Contagem de filtros ativos
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Filter, 
  X, 
  Search, 
  Calendar as CalendarIcon,
  CheckCircle,
  AlertCircle,
  RotateCcw
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

import type { 
  FilterDefinition, 
  FilterValue, 
  useAdvancedFilters 
} from '@/hooks/useAdvancedFilters'

interface AdvancedFiltersProps {
  filters: FilterDefinition[]
  values: FilterValue
  errors: Record<string, string>
  isValid: boolean
  hasActiveFilters: boolean
  activeFiltersCount: number
  onUpdateFilter: (key: string, value: any) => void
  onResetFilters: () => void
  onClearFilter: (key: string) => void
  className?: string
  showActiveCount?: boolean
  showResetButton?: boolean
  compact?: boolean
}

export function AdvancedFilters({
  filters,
  values,
  errors,
  isValid,
  hasActiveFilters,
  activeFiltersCount,
  onUpdateFilter,
  onResetFilters,
  onClearFilter,
  className,
  showActiveCount = true,
  showResetButton = true,
  compact = false
}: AdvancedFiltersProps) {
  
  const renderFilter = (filter: FilterDefinition) => {
    const value = values[filter.key]
    const error = errors[filter.key]
    
    const commonProps = {
      key: filter.key,
      className: cn(compact && 'h-8')
    }
    
    switch (filter.type) {
      case 'text':
        return (
          <div key={filter.key} className="space-y-2">
            <Label className={cn("text-sm font-medium", compact && "text-xs")}>
              {filter.label}
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...commonProps}
                placeholder={filter.placeholder || `Digite ${filter.label.toLowerCase()}...`}
                value={value || ''}
                onChange={(e) => onUpdateFilter(filter.key, e.target.value)}
                className={cn("pl-10", error && "border-red-500")}
              />
            </div>
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        )
        
      case 'select':
        return (
          <div key={filter.key} className="space-y-2">
            <Label className={cn("text-sm font-medium", compact && "text-xs")}>
              {filter.label}
            </Label>
            <Select
              value={value || ''}
              onValueChange={(val: string) => onUpdateFilter(filter.key, val)}
            >
              <SelectTrigger className={cn(error && "border-red-500")}>
                <SelectValue placeholder={filter.placeholder || `Selecione ${filter.label.toLowerCase()}...`} />
              </SelectTrigger>
              <SelectContent>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        )
        
      case 'multiselect':
        return (
          <div key={filter.key} className="space-y-2">
            <Label className={cn("text-sm font-medium", compact && "text-xs")}>
              {filter.label}
            </Label>
            <div className="space-y-2">
              {filter.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${filter.key}-${option.value}`}
                    checked={Array.isArray(value) ? value.includes(option.value) : false}
                    onCheckedChange={(checked: boolean) => {
                      const currentValues = Array.isArray(value) ? value : []
                      const newValues = checked
                        ? [...currentValues, option.value]
                        : currentValues.filter(v => v !== option.value)
                      onUpdateFilter(filter.key, newValues)
                    }}
                  />
                  <Label
                    htmlFor={`${filter.key}-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        )
        
      case 'date':
        return (
          <div key={filter.key} className="space-y-2">
            <Label className={cn("text-sm font-medium", compact && "text-xs")}>
              {filter.label}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !value && "text-muted-foreground",
                    error && "border-red-500",
                    compact && "h-8"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value ? format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }) : 
                    filter.placeholder || 'Selecione uma data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) => onUpdateFilter(filter.key, date ? format(date, 'yyyy-MM-dd') : '')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        )
        
      case 'daterange':
        return (
          <div key={filter.key} className="space-y-2">
            <Label className={cn("text-sm font-medium", compact && "text-xs")}>
              {filter.label}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !value?.from && "text-muted-foreground",
                      error && "border-red-500",
                      compact && "h-8 text-xs"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value?.from ? format(new Date(value.from), 'dd/MM/yyyy', { locale: ptBR }) : 'De'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={value?.from ? new Date(value.from) : undefined}
                    onSelect={(date) => onUpdateFilter(filter.key, {
                      ...value,
                      from: date ? format(date, 'yyyy-MM-dd') : ''
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !value?.to && "text-muted-foreground",
                      error && "border-red-500",
                      compact && "h-8 text-xs"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value?.to ? format(new Date(value.to), 'dd/MM/yyyy', { locale: ptBR }) : 'Até'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={value?.to ? new Date(value.to) : undefined}
                    onSelect={(date) => onUpdateFilter(filter.key, {
                      ...value,
                      to: date ? format(date, 'yyyy-MM-dd') : ''
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        )
        
      case 'number':
        return (
          <div key={filter.key} className="space-y-2">
            <Label className={cn("text-sm font-medium", compact && "text-xs")}>
              {filter.label}
            </Label>
            <Input
              {...commonProps}
              type="number"
              placeholder={filter.placeholder || `Digite ${filter.label.toLowerCase()}...`}
              value={value || ''}
              onChange={(e) => onUpdateFilter(filter.key, e.target.value ? Number(e.target.value) : null)}
              className={cn(error && "border-red-500")}
              min={filter.validation?.min}
              max={filter.validation?.max}
            />
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        )
        
      case 'boolean':
        return (
          <div key={filter.key} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={filter.key}
                checked={value || false}
                onCheckedChange={(checked: boolean) => onUpdateFilter(filter.key, checked)}
              />
              <Label
                htmlFor={filter.key}
                className="text-sm font-medium cursor-pointer"
              >
                {filter.label}
              </Label>
            </div>
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        )
        
      default:
        return null
    }
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header com contadores */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">Filtros</h3>
            {showActiveCount && hasActiveFilters && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {activeFiltersCount} ativo{activeFiltersCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {showResetButton && hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="h-8"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>
      )}
      
      {/* Filtros */}
      <div className={cn(
        "grid gap-4",
        compact ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}>
        {filters.map(renderFilter)}
      </div>
      
      {/* Status de validação */}
      {!compact && !isValid && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-700">
            Corrija os erros nos filtros antes de continuar
          </p>
        </div>
      )}
      
      {!compact && isValid && hasActiveFilters && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <p className="text-sm text-green-700">
            Filtros aplicados com sucesso
          </p>
        </div>
      )}
    </div>
  )
}

export default AdvancedFilters
