'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface DraggableTaskProps {
  id: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function DraggableTask({ id, children, className, disabled = false }: DraggableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled,
    data: {
      type: 'task',
      id
    }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-grab active:cursor-grabbing transition-all duration-200',
        isDragging && 'opacity-50 scale-105 z-50',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  )
}
