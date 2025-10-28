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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface CompactFiltersProps {
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

export function CompactFilters({
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
}: CompactFiltersProps) {
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
    const baseClass = 'h-7 px-2 text-xs font-medium'
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
    <div className={cn('flex items-center gap-2', className)}>
      {/* Busca compacta */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar por aluno ou mensagem..."
          className="pl-10 pr-7 h-8 text-sm"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSearchClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filtros de status compactos */}
      <div className="flex items-center gap-1">
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
            <Badge variant="secondary" className="ml-1 h-3 px-1 text-xs">
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
            <Badge variant="secondary" className="ml-1 h-3 px-1 text-xs">
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
            <Badge variant="secondary" className="ml-1 h-3 px-1 text-xs">
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
            <Badge variant="secondary" className="ml-1 h-3 px-1 text-xs">
              {taskCounts.sent}
            </Badge>
          )}
        </Button>
      </div>

      {/* Ações compactas */}
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onSetToday}
          className="h-7 px-2 text-xs"
        >
          <Calendar className="h-3 w-3" />
        </Button>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onAdvancedFilters}
                className="h-7 px-2 text-xs"
              >
                <Filter className="h-3 w-3" />
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-3 px-1 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Filtros Avançados</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="h-7 px-2 text-xs"
              >
                <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Atualizar Tarefas</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onNewMessage}
                size="sm"
                className="h-7 px-2 text-xs"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Nova
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Criar Nova Mensagem</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
