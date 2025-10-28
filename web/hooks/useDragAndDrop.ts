'use client'

import { useState, useCallback } from 'react'
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, DragOverlay, closestCenter } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

export interface DragItem {
  id: string
  type: 'task'
  data: any
}

export interface DragState {
  activeId: string | null
  activeItem: DragItem | null
  isDragging: boolean
}

export interface UseDragAndDropOptions {
  onDragEnd: (event: DragEndEvent) => void
  onDragStart?: (event: DragStartEvent) => void
  onDragOver?: (event: DragOverEvent) => void
}

export function useDragAndDrop({ onDragEnd, onDragStart, onDragOver }: UseDragAndDropOptions) {
  const [dragState, setDragState] = useState<DragState>({
    activeId: null,
    activeItem: null,
    isDragging: false
  })

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    
    setDragState({
      activeId: active.id as string,
      activeItem: active.data.current as DragItem,
      isDragging: true
    })

    onDragStart?.(event)
  }, [onDragStart])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    onDragOver?.(event)
  }, [onDragOver])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    setDragState({
      activeId: null,
      activeItem: null,
      isDragging: false
    })

    if (!over) return

    onDragEnd(event)
  }, [onDragEnd])

  const handleDragCancel = useCallback(() => {
    setDragState({
      activeId: null,
      activeItem: null,
      isDragging: false
    })
  }, [])

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel
  }
}

// Hook específico para Kanban de tarefas
export function useKanbanDragAndDrop(
  tasks: any[],
  onTaskMove: (taskId: string, newStatus: string) => Promise<void>
) {
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as string

    // Verificar se a tarefa está sendo movida para uma coluna diferente
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    try {
      await onTaskMove(taskId, newStatus)
    } catch (error) {
      console.error('Erro ao mover tarefa:', error)
      // Aqui você pode adicionar um toast de erro
    }
  }, [tasks, onTaskMove])

  return useDragAndDrop({
    onDragEnd: handleDragEnd
  })
}
