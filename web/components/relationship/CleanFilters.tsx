'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter, 
  RefreshCw, 
  MessageSquare,
  X,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CleanFiltersProps {
  // Filtros atuais
  filters: {
    status: string
    q: string
    [key: string]: any
  }
  
  // Contadores de tarefas
  taskCounts: {
    overdue: number
    due_today: number
    pending_future: number
    sent: number
    postponed_skipped: number
  }
  
  // Funções de callback
  onFilterChange: (filters: Record<string, any>) => void
  onSearchChange: (query: string) => void
  onClearFilters: () => void
  onRefresh: () => void
  onNewMessage: () => void
  onAdvancedFilters: () => void
  onSetToday: () => void
  
  // Estado
  loading?: boolean
  activeFiltersCount: number
  className?: string
}

export function CleanFilters({
  filters,
  taskCounts,
  onFilterChange,
  onSearchChange,
  onClearFilters,
  onRefresh,
  onNewMessage,
  onAdvancedFilters,
  onSetToday,
  loading = false,
  activeFiltersCount,
  className
}: CleanFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.q || '')

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    onSearchChange(value)
  }

  const handleSearchClear = () => {
    setSearchValue('')
    onSearchChange('')
  }

  const getStatusButtonVariant = (status: string) => {
    return filters.status === status ? 'default' : 'outline'
  }

  const getStatusButtonClass = (status: string) => {
    const baseClass = 'h-8 px-3 text-xs font-medium'
    switch (status) {
      case 'overdue':
        return cn(baseClass, 'text-red-600 border-red-200 hover:bg-red-50')
      case 'today':
        return cn(baseClass, 'text-blue-600 border-blue-200 hover:bg-blue-50')
      case 'pending':
        return cn(baseClass, 'text-yellow-600 border-yellow-200 hover:bg-yellow-50')
      case 'sent':
        return cn(baseClass, 'text-green-600 border-green-200 hover:bg-green-50')
      default:
        return baseClass
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Linha 1: Busca e Ações Principais */}
      <div className="flex items-center gap-3">
        {/* Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por aluno ou mensagem..."
            className="pl-10 pr-10 h-9"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSearchClear}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSetToday}
            className="h-8 px-3 text-xs"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Hoje
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onAdvancedFilters}
            className="h-8 px-3 text-xs"
          >
            <Filter className="h-3 w-3 mr-1" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 px-3 text-xs"
          >
            <RefreshCw className={cn('h-3 w-3 mr-1', loading && 'animate-spin')} />
            Atualizar
          </Button>
          
          <Button
            onClick={onNewMessage}
            size="sm"
            className="h-8 px-3 text-xs"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Nova Mensagem
          </Button>
        </div>
      </div>

      {/* Linha 2: Filtros Rápidos de Status */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">Status:</span>
        
        <Button
          variant={getStatusButtonVariant('all')}
          size="sm"
          onClick={() => onFilterChange({ status: 'all' })}
          className={cn('h-7 px-2 text-xs', getStatusButtonClass('all'))}
        >
          Todos
        </Button>
        
        <Button
          variant={getStatusButtonVariant('overdue')}
          size="sm"
          onClick={() => onFilterChange({ status: 'overdue' })}
          className={getStatusButtonClass('overdue')}
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Atrasadas
          {taskCounts.overdue > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              {taskCounts.overdue}
            </Badge>
          )}
        </Button>
        
        <Button
          variant={getStatusButtonVariant('today')}
          size="sm"
          onClick={() => onFilterChange({ status: 'today' })}
          className={getStatusButtonClass('today')}
        >
          <Calendar className="h-3 w-3 mr-1" />
          Hoje
          {taskCounts.due_today > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              {taskCounts.due_today}
            </Badge>
          )}
        </Button>
        
        <Button
          variant={getStatusButtonVariant('pending')}
          size="sm"
          onClick={() => onFilterChange({ status: 'pending' })}
          className={getStatusButtonClass('pending')}
        >
          <Clock className="h-3 w-3 mr-1" />
          Pendentes
          {taskCounts.pending_future > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              {taskCounts.pending_future}
            </Badge>
          )}
        </Button>
        
        <Button
          variant={getStatusButtonVariant('sent')}
          size="sm"
          onClick={() => onFilterChange({ status: 'sent' })}
          className={getStatusButtonClass('sent')}
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Enviadas
          {taskCounts.sent > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              {taskCounts.sent}
            </Badge>
          )}
        </Button>

        {/* Limpar filtros */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Linha 3: Resumo Simples */}
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
      </div>
    </div>
  )
}
