'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Grid3X3, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ViewToggleProps {
  currentView: 'kanban' | 'calendar'
  onViewChange: (view: 'kanban' | 'calendar') => void
  className?: string
}

export function ViewToggle({ currentView, onViewChange, className }: ViewToggleProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant={currentView === 'kanban' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('kanban')}
        className="h-8 px-2 text-xs"
      >
        <Grid3X3 className="h-3 w-3 mr-1" />
        Kanban
      </Button>
      <Button
        variant={currentView === 'calendar' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('calendar')}
        className="h-8 px-2 text-xs"
      >
        <Calendar className="h-3 w-3 mr-1" />
        Calendário
      </Button>
    </div>
  )
}
