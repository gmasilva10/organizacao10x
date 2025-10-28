'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Calendar, Clock, CheckCircle, Pause, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterChip {
  id: string
  label: string
  value: string
  icon?: React.ReactNode
  color?: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

interface FilterChipsProps {
  filters: FilterChip[]
  onRemove: (filterId: string) => void
  onClearAll: () => void
  className?: string
}

const STATUS_ICONS = {
  pending: <Clock className="h-3 w-3" />,
  sent: <CheckCircle className="h-3 w-3" />,
  skipped: <XCircle className="h-3 w-3" />,
  postponed: <Pause className="h-3 w-3" />,
  today: <Calendar className="h-3 w-3" />,
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  sent: 'bg-green-100 text-green-800 border-green-200',
  skipped: 'bg-red-100 text-red-800 border-red-200',
  postponed: 'bg-orange-100 text-orange-800 border-orange-200',
  today: 'bg-blue-100 text-blue-800 border-blue-200',
}

export function FilterChips({ filters, onRemove, onClearAll, className }: FilterChipsProps) {
  if (filters.length === 0) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground">Filtros ativos:</span>
      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="outline"
          className={cn(
            'flex items-center gap-1 px-2 py-1 text-xs font-medium',
            STATUS_COLORS[filter.id as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800 border-gray-200'
          )}
        >
          {STATUS_ICONS[filter.id as keyof typeof STATUS_ICONS]}
          {filter.label}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
            onClick={() => onRemove(filter.id)}
            aria-label={`Remover filtro ${filter.label}`}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        Limpar todos
      </Button>
    </div>
  )
}
