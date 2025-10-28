/**
 * Drawer de Filtros Avançados
 * 
 * Funcionalidades:
 * - Drawer lateral para filtros avançados
 * - Integração com AdvancedFilters e ActiveFilterTags
 * - Persistência de estado
 * - Ações de aplicar e limpar
 */

'use client'

import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Filter, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

import AdvancedFilters from './AdvancedFilters'
import ActiveFilterTags from './ActiveFilterTags'

import type { 
  FilterDefinition, 
  FilterValue, 
  useAdvancedFilters 
} from '@/hooks/useAdvancedFilters'

interface AdvancedFiltersDrawerProps {
  filters: FilterDefinition[]
  values: FilterValue
  errors: Record<string, string>
  isValid: boolean
  hasActiveFilters: boolean
  activeFiltersCount: number
  onUpdateFilter: (key: string, value: any) => void
  onResetFilters: () => void
  onClearFilter: (key: string) => void
  onApplyFilters?: () => void
  trigger?: React.ReactNode
  title?: string
  description?: string
  className?: string
}

export function AdvancedFiltersDrawer({
  filters,
  values,
  errors,
  isValid,
  hasActiveFilters,
  activeFiltersCount,
  onUpdateFilter,
  onResetFilters,
  onClearFilter,
  onApplyFilters,
  trigger,
  title = "Filtros Avançados",
  description,
  className
}: AdvancedFiltersDrawerProps) {
  
  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Filter className="h-4 w-4" />
      Filtros
      {hasActiveFilters && (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          {activeFiltersCount}
        </Badge>
      )}
    </Button>
  )
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {activeFiltersCount} ativo{activeFiltersCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          
          {/* Tags de filtros ativos */}
          <ActiveFilterTags
            filters={filters}
            values={values}
            onRemoveFilter={onClearFilter}
            onClearAll={onResetFilters}
            compact
          />
        </SheetHeader>
        
        <Separator className="my-4" />
        
        {/* Filtros */}
        <div className="space-y-6">
          <AdvancedFilters
            filters={filters}
            values={values}
            errors={errors}
            isValid={isValid}
            hasActiveFilters={hasActiveFilters}
            activeFiltersCount={activeFiltersCount}
            onUpdateFilter={onUpdateFilter}
            onResetFilters={onResetFilters}
            onClearFilter={onClearFilter}
            compact
            showActiveCount={false}
            showResetButton={false}
          />
        </div>
        
        {/* Footer com ações */}
        <div className="mt-8 pt-4 border-t">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {!isValid && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <X className="h-3 w-3" />
                  Corrija os erros
                </div>
              )}
              {isValid && hasActiveFilters && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <Check className="h-3 w-3" />
                  Filtros válidos
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResetFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpar
                </Button>
              )}
              
              {onApplyFilters && (
                <Button
                  size="sm"
                  onClick={onApplyFilters}
                  disabled={!isValid}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Aplicar
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default AdvancedFiltersDrawer
