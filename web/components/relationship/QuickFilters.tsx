'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Pause, 
  XCircle, 
  Filter,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickFilter {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  count?: number
  isActive?: boolean
}

interface QuickFiltersProps {
  filters: QuickFilter[]
  onFilterClick: (filterId: string) => void
  onAdvancedFiltersClick: () => void
  activeFiltersCount: number
  className?: string
}

export function QuickFilters({ 
  filters, 
  onFilterClick, 
  onAdvancedFiltersClick, 
  activeFiltersCount,
  className 
}: QuickFiltersProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={filter.isActive ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterClick(filter.id)}
          className={cn(
            'flex items-center gap-2 h-8 px-3 text-xs font-medium transition-all duration-200',
            filter.isActive 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'hover:bg-muted hover:border-primary/50',
            filter.color
          )}
        >
          {filter.icon}
          {filter.label}
          {filter.count !== undefined && filter.count > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-1 h-4 px-1 text-xs bg-white/20 text-white border-0"
            >
              {filter.count}
            </Badge>
          )}
        </Button>
      ))}
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <Button
        variant="outline"
        size="sm"
        onClick={onAdvancedFiltersClick}
        className="flex items-center gap-2 h-8 px-3 text-xs font-medium"
      >
        <Filter className="h-3 w-3" />
        Filtros Avançados
        {activeFiltersCount > 0 && (
          <Badge 
            variant="secondary" 
            className="ml-1 h-4 px-1 text-xs bg-primary/10 text-primary border-primary/20"
          >
            {activeFiltersCount}
          </Badge>
        )}
      </Button>
    </div>
  )
}

// Filtros pré-definidos para o Kanban
export const KANBAN_QUICK_FILTERS: Omit<QuickFilter, 'count' | 'isActive'>[] = [
  {
    id: 'today',
    label: 'Hoje',
    icon: <Calendar className="h-3 w-3" />,
    color: 'text-blue-600 hover:text-blue-700'
  },
  {
    id: 'overdue',
    label: 'Atrasadas',
    icon: <AlertTriangle className="h-3 w-3" />,
    color: 'text-red-600 hover:text-red-700'
  },
  {
    id: 'pending',
    label: 'Pendentes',
    icon: <Clock className="h-3 w-3" />,
    color: 'text-yellow-600 hover:text-yellow-700'
  },
  {
    id: 'sent',
    label: 'Enviadas',
    icon: <CheckCircle className="h-3 w-3" />,
    color: 'text-green-600 hover:text-green-700'
  },
  {
    id: 'postponed',
    label: 'Adiadas',
    icon: <Pause className="h-3 w-3" />,
    color: 'text-orange-600 hover:text-orange-700'
  },
  {
    id: 'skipped',
    label: 'Puladas',
    icon: <XCircle className="h-3 w-3" />,
    color: 'text-gray-600 hover:text-gray-700'
  }
]
