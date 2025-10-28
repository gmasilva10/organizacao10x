'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuickFilters, KANBAN_QUICK_FILTERS } from './QuickFilters'
import { FilterChips } from './FilterChips'
import { SmartSearch } from './SmartSearch'
import { SavedFilters } from './SavedFilters'

interface EnhancedFiltersProps {
  // Filtros atuais
  filters: {
    status: string
    q: string
    [key: string]: any
  }
  
  // Contadores de tarefas por status
  taskCounts: {
    overdue: number
    due_today: number
    pending_future: number
    sent: number
    postponed_skipped: number
  }
  
  // Funções de callback
  onFilterChange: (filters: Record<string, any>) => void
  onQuickFilter: (filterId: string) => void
  onSearchChange: (query: string) => void
  onClearFilters: () => void
  onRefresh: () => void
  onNewMessage: () => void
  onAdvancedFilters: () => void
  
  // Estado
  loading?: boolean
  activeFiltersCount: number
  className?: string
}

export function EnhancedFilters({
  filters,
  taskCounts,
  onFilterChange,
  onQuickFilter,
  onSearchChange,
  onClearFilters,
  onRefresh,
  onNewMessage,
  onAdvancedFilters,
  loading = false,
  activeFiltersCount,
  className
}: EnhancedFiltersProps) {
  const [searchSuggestions, setSearchSuggestions] = useState([
    { id: '1', label: 'Gustavo Moreira', type: 'student' as const, icon: null },
    { id: '2', label: 'Maria Silva', type: 'student' as const, icon: null },
    { id: '3', label: 'Como está o treino', type: 'message' as const, icon: null },
    { id: '4', label: '15/10/2025', type: 'date' as const, icon: null },
  ])

  // Preparar filtros rápidos com contadores
  const quickFilters = useMemo(() => {
    return KANBAN_QUICK_FILTERS.map(filter => ({
      ...filter,
      count: taskCounts[filter.id as keyof typeof taskCounts] || 0,
      isActive: filters.status === filter.id || 
                (filter.id === 'today' && filters.date_from && filters.date_to)
    }))
  }, [filters, taskCounts])

  // Preparar chips de filtros ativos
  const activeFilterChips = useMemo(() => {
    const chips = []
    
    if (filters.status && filters.status !== 'all') {
      const statusFilter = KANBAN_QUICK_FILTERS.find(f => f.id === filters.status)
      if (statusFilter) {
        chips.push({
          id: 'status',
          label: statusFilter.label,
          value: filters.status
        })
      }
    }
    
    if (filters.q) {
      chips.push({
        id: 'search',
        label: `Busca: "${filters.q}"`,
        value: filters.q
      })
    }
    
    if (filters.date_from || filters.date_to) {
      chips.push({
        id: 'date',
        label: 'Filtro de data',
        value: `${filters.date_from || ''} - ${filters.date_to || ''}`
      })
    }
    
    return chips
  }, [filters])

  const handleQuickFilter = (filterId: string) => {
    if (filterId === 'today') {
      // Lógica especial para "hoje"
      onFilterChange({
        date_from: new Date().toISOString().split('T')[0] + 'T00:00:00.000Z',
        date_to: new Date().toISOString().split('T')[0] + 'T23:59:59.999Z'
      })
    } else {
      onQuickFilter(filterId)
    }
  }

  const handleRemoveFilter = (filterId: string) => {
    switch (filterId) {
      case 'status':
        onFilterChange({ status: 'all' })
        break
      case 'search':
        onSearchChange('')
        break
      case 'date':
        onFilterChange({ date_from: '', date_to: '' })
        break
      default:
        onFilterChange({ [filterId]: '' })
    }
  }

  const handleApplySavedFilter = (savedFilters: Record<string, any>) => {
    onFilterChange(savedFilters)
  }

  const handleSaveCurrentFilter = (name: string) => {
    // Esta função será implementada no componente pai
    console.log('Salvando filtro:', name, filters)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Barra principal de filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Busca inteligente */}
        <div className="flex-1 min-w-0">
          <SmartSearch
            value={filters.q}
            onChange={onSearchChange}
            onClear={() => onSearchChange('')}
            suggestions={searchSuggestions}
            placeholder="Buscar por aluno, mensagem ou data..."
          />
        </div>
        
        {/* Filtros rápidos */}
        <div className="flex items-center gap-2">
          <QuickFilters
            filters={quickFilters}
            onFilterClick={handleQuickFilter}
            onAdvancedFiltersClick={onAdvancedFilters}
            activeFiltersCount={activeFiltersCount}
          />
        </div>
        
        {/* Ações */}
        <div className="flex items-center gap-2">
          <SavedFilters
            onApplyFilter={handleApplySavedFilter}
            onSaveCurrentFilter={handleSaveCurrentFilter}
            currentFilters={filters}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 px-3"
          >
            <RefreshCw className={cn('h-3 w-3 mr-2', loading && 'animate-spin')} />
            Atualizar
          </Button>
          
          <Button
            onClick={onNewMessage}
            className="h-8 px-3"
          >
            <MessageSquare className="h-3 w-3 mr-2" />
            Nova Mensagem
          </Button>
        </div>
      </div>
      
      {/* Chips de filtros ativos */}
      {activeFilterChips.length > 0 && (
        <FilterChips
          filters={activeFilterChips}
          onRemove={handleRemoveFilter}
          onClearAll={onClearFilters}
        />
      )}
      
      {/* Resumo de resultados */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            Total: {Object.values(taskCounts).reduce((sum, count) => sum + count, 0)} tarefas
          </span>
          {activeFiltersCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} ativo{activeFiltersCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            Atrasadas: {taskCounts.overdue}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            Hoje: {taskCounts.due_today}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            Pendentes: {taskCounts.pending_future}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Enviadas: {taskCounts.sent}
          </span>
        </div>
      </div>
    </div>
  )
}
