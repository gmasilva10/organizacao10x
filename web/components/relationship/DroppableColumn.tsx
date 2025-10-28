'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface DroppableColumnProps {
  id: string
  children: React.ReactNode
  className?: string
  isOver?: boolean
}

export function DroppableColumn({ id, children, className, isOver }: DroppableColumnProps) {
  const { isOver: isDroppableOver, setNodeRef } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[200px] rounded-lg border-2 border-dashed transition-all duration-200',
        isDroppableOver || isOver
          ? 'border-primary bg-primary/5 scale-[1.02]'
          : 'border-muted-foreground/20 hover:border-muted-foreground/40',
        className
      )}
    >
      {children}
    </div>
  )
}
