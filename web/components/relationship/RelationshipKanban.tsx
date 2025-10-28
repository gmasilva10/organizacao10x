'use client'

import React, { useState, useEffect, useImperativeHandle, forwardRef, useMemo, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Filter, 
  Search, 
  RefreshCw, 
  Calendar,
  MessageSquare,
  Clock,
  CheckCircle,
  Pause,
  X,
  Copy,
  ExternalLink,
  User,
  MoreHorizontal,
  AlertCircle,
  Inbox,
  Trash2
} from 'lucide-react'
import TaskCard from './TaskCard'
import MessageComposer from './MessageComposer'
import RelationshipFilterDrawer from './RelationshipFilterDrawer'
import RelationshipCalendar from './RelationshipCalendar'
import { toast } from 'sonner'
import { whatsappService } from '@/lib/integrations/whatsapp/service'
import { WhatsAppContact, WhatsAppMessage } from '@/lib/integrations/whatsapp/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRelationshipFilters } from '@/hooks/useRelationshipFilters'
import { useKanbanDragAndDrop } from '@/hooks/useDragAndDrop'
import { DroppableColumn } from './DroppableColumn'
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core'
import { CompactFilters } from './CompactFilters'
import { ViewToggle } from './ViewToggle'
import { isPast, isToday, isFuture } from '@/lib/date-utils'
import { safeQueryString } from '@/lib/query-utils'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerDescription } from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { StandardizedCalendar } from '@/components/ui/standardized-calendar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Mapeamento de âncoras para exibição
const ANCHOR_LABELS = {
  'sale_close': 'Pós-venda',
  'onboarding': 'Onboarding',
  'manual': 'Manual',
  'recurrent': 'Recorrente',
  'birthday': 'Aniversário',
  'anniversary': 'Aniversário de Cliente',
  'churn_prevention': 'Prevenção de Churn',
  'reactivation': 'Reativação',
  'feedback': 'Feedback',
  'promotion': 'Promoção',
  'event': 'Evento',
  'other': 'Outro'
}

// Mapeamento de status para exibição
const STATUS_LABELS = {
  'pending': 'Pendente',
  'sent': 'Enviada',
  'failed': 'Falhou',
  'skipped': 'Pulada',
  'postponed': 'Adiada',
  'completed': 'Concluída'
}

// Definição de tipos
interface Task {
  id: string
  student_id: string
  template_code: string | null
  anchor: string
  scheduled_for: string
  channel: string
  status: 'pending' | 'sent' | 'postponed' | 'skipped' | 'deleted'
  payload: {
    message: string
    student_name: string
    student_email: string
    student_phone: string
  }
  variables_used: any
  created_at: string
  updated_at: string
  created_by: string
  student: {
    id: string
    name: string
    email: string
    phone: string
  }
}

interface KanbanColumn {
  id: string
  title: string
  icon: React.ElementType
  color: string
}

interface RelationshipKanbanProps {
  onTaskUpdate?: () => void
}

export interface RelationshipKanbanRef {
  refresh: () => void
}

const ALL_COLUMNS: KanbanColumn[] = [
  { id: 'overdue', title: 'Atrasadas', icon: Clock, color: 'text-red-500' },
  { id: 'due_today', title: 'Para Hoje', icon: Calendar, color: 'text-blue-500' },
  { id: 'pending_future', title: 'Pendentes de Envio', icon: Pause, color: 'text-yellow-600' },
  { id: 'sent', title: 'Enviadas', icon: CheckCircle, color: 'text-green-600' },
  { id: 'postponed_skipped', title: 'Adiadas/Puladas', icon: X, color: 'text-gray-500' },
]

// Estilo visual por coluna (exatamente como na imagem)
const columnStyleById: Record<string, { header: string; card: string }> = {
  overdue: { header: 'bg-red-50 border-red-200', card: 'border-red-200' },
  due_today: { header: 'bg-blue-50 border-blue-200', card: 'border-blue-200' },
  pending_future: { header: 'bg-yellow-50 border-yellow-200', card: 'border-yellow-200' },
  sent: { header: 'bg-green-50 border-green-200', card: 'border-green-200' },
  postponed_skipped: { header: 'bg-gray-50 border-gray-200', card: 'border-gray-200' },
}

const RelationshipKanban = forwardRef<RelationshipKanbanRef, RelationshipKanbanProps>(({ onTaskUpdate }, ref) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, page_size: 100, total: 0, total_pages: 0 })
  const [showComposer, setShowComposer] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [expandedColumns, setExpandedColumns] = useState<Record<string, boolean>>({})
  const [currentView, setCurrentView] = useState<'kanban' | 'calendar'>('kanban')
  const mountedRef = useRef(false)

  // Hook de filtros com proteção SSR
  const {
    filters,
    filtersUI, // Filtros formatados para UI
    debouncedFilters,
    updateFilters,
    updateFiltersUI, // Função para atualizar filtros do UI
    resetFilters,
    setToday,
    hasActiveFilters,
    getApiFilters,
    getActiveFiltersCount,
    applyFilters
  } = useRelationshipFilters()

  // Buscar tarefas com useCallback estável
  const fetchTasks = useCallback(async () => {
    if (!mountedRef.current) return

    // Abort previous in-flight request when filters change quickly
    const controller = new AbortController()
    const signal = controller.signal
    ;(fetchTasks as any)._controller?.abort()
    ;(fetchTasks as any)._controller = controller

    setLoading(true)
    const t0 = performance.now()
    // Safety guard: ensure loading cannot hang forever
    const guard = setTimeout(() => {
      if (mountedRef.current) {
        console.warn('[REL] fetch guard timeout - forcing loading=false')
        setLoading(false)
      }
    }, 8000)
    try {
      const apiFilters = getApiFilters()
      const params = safeQueryString({
        page: pagination.page,
        limit: pagination.page_size,
        ...apiFilters
      })

      const url = `/api/relationship/tasks?${params}`
      
      // Debug temporário para investigar filtros
      console.log('🔍 [REL] Filtros atuais:', debouncedFilters)
      console.log('🔍 [REL] Filtros para API:', apiFilters)
      console.log('🔍 [REL] URL:', url)
      const response = await fetch(url, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' },
        signal
      })


      const data = await response.json()

      if (!response.ok) {
        const errMsg = data?.error || `HTTP ${response.status}`
        throw new Error(errMsg)
      }

      if (process.env.NEXT_PUBLIC_DEBUG_REL === '1') {
        console.debug('[REL] fetch ok', { rows: data.tasks?.length || 0, ms: Math.round(performance.now() - t0) })
      }

      setTasks(Array.isArray(data.tasks) ? data.tasks : [])
      setPagination(data.pagination || pagination)
      // Garantir que o loading finalize logo após sucesso
      setLoading(false)
    } catch (error: any) {
      if (error?.name === 'AbortError') return
      console.error('Erro ao buscar tarefas:', error)
      toast.error('Erro ao buscar tarefas')
    } finally {
      clearTimeout(guard)
      if (mountedRef.current) setLoading(false)
    }
  }, [pagination.page, pagination.page_size, debouncedFilters, getApiFilters])

  // Função para mover tarefa entre colunas
  const handleTaskMove = useCallback(async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/relationship/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar status da tarefa')
      }

      // Atualizar a lista de tarefas
      await fetchTasks()
      
      toast.success('Tarefa movida com sucesso!')
    } catch (error) {
      console.error('Erro ao mover tarefa:', error)
      toast.error('Erro ao mover tarefa')
    }
  }, [fetchTasks])

  // Hook de drag & drop
  const { dragState, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel } = useKanbanDragAndDrop(
    tasks,
    handleTaskMove
  )

  // Determinar colunas visíveis com try/catch
  const visibleColumns = useMemo(() => {
    try {
      const selectedColumns = filters.visible_columns || ['overdue', 'due_today', 'pending_future', 'sent', 'postponed_skipped']
      return ALL_COLUMNS.filter(column => selectedColumns.includes(column.id))
    } catch (error) {
      console.error('Erro ao determinar colunas visíveis:', error)
      return ALL_COLUMNS
    }
  }, [filters.visible_columns])

  // Agrupar tarefas por coluna com proteção robusta
  const getTasksByColumn = useCallback((columnId: string) => {
    try {
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return []
      }
      
      return tasks.filter(task => {
        if (!task || typeof task !== 'object' || !task.status) {
          return false
        }
        
        const scheduledDate = new Date(task.scheduled_for)
        if (isNaN(scheduledDate.getTime())) {
          console.warn('Data inválida na tarefa:', task.id, task.scheduled_for)
          return false
        }
        
        switch (columnId) {
          case 'overdue':
            return task.status === 'pending' && isPast(scheduledDate)
          case 'due_today':
            return task.status === 'pending' && isToday(scheduledDate)
          case 'pending_future':
            return task.status === 'pending' && isFuture(scheduledDate)
          case 'sent':
            return task.status === 'sent'
          case 'postponed_skipped':
            return task.status === 'postponed' || task.status === 'skipped'
          default:
            return false
        }
      }).sort((a, b) => {
        try {
          const dateA = new Date(a.scheduled_for)
          const dateB = new Date(b.scheduled_for)
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          }
          return dateA.getTime() - dateB.getTime()
        } catch (error) {
          console.warn('Erro na ordenação de tarefas:', error)
          return 0
        }
      })
    } catch (error) {
      console.error('Erro em getTasksByColumn:', error)
      return []
    }
  }, [tasks])

  // Atualizar status da tarefa
  const updateTaskStatus = async (taskId: string, status: string, notes?: string) => {
    try {
      const taskBefore = tasks.find(t => t.id === taskId)
      const previousStatus = taskBefore?.status
      const previousScheduledFor = taskBefore?.scheduled_for

      const response = await fetch('/api/relationship/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          task_id: taskId,
          status,
          notes
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar tarefa')
      }

      fetchTasks()
      if (onTaskUpdate) onTaskUpdate()

      if (status === 'skipped') {
        toast.success('Tarefa pulada', {
          description: 'Você tem 5 segundos para desfazer',
          duration: 5000,
          action: {
            label: 'Desfazer',
            onClick: () => handleUndo(taskId, previousStatus!, previousScheduledFor!)
          }
        })
      } else {
        toast.success('Tarefa atualizada com sucesso')
      }
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      toast.error('Erro ao atualizar tarefa')
    }
  }

  // Copiar mensagem
  const copyMessage = (message: string) => {
    navigator.clipboard.writeText(message)
    toast.success('Mensagem copiada para a área de transferência')
  }

  // Abrir WhatsApp (Desktop primeiro, fallback para Web)
  const openWhatsApp = async (phone: string, message: string, studentName?: string) => {
    try {
      const contact: WhatsAppContact = {
        phone,
        name: studentName
      }
      
      const whatsappMessage: WhatsAppMessage = {
        text: message,
        contact
      }
      
      const result = await whatsappService.sendMessage(whatsappMessage)
      
      if (result.success) {
        const methodName = result.method === 'desktop' ? 'WhatsApp Desktop' : 'WhatsApp Web'
        toast.success(`Abrindo ${methodName}...`, {
          description: `Mensagem preparada para ${studentName || 'aluno'}`
        })
      } else {
        throw new Error(result.error || 'Erro ao abrir WhatsApp')
      }
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error)
      toast.error('Erro ao abrir WhatsApp', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  }

  // Snooze tarefa (adiar)
  const snoozeTask = async (taskId: string, days: number) => {
    try {
      const response = await fetch(`/api/relationship/tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          postpone_days: days
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao adiar tarefa')
      }
      
      toast.success(`Tarefa adiada por ${days} dia(s)`)
      fetchTasks()
      if (onTaskUpdate) onTaskUpdate()
    } catch (error) {
      console.error('Erro ao adiar tarefa:', error)
      toast.error('Erro ao adiar tarefa')
    }
  }

  const postponeTask = async (taskId: string, newDate: Date) => {
    try {
      const response = await fetch(`/api/relationship/tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          scheduled_for: newDate.toISOString()
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao adiar tarefa')
      }
      
      toast.success(`Tarefa reagendada para ${format(newDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`)
      fetchTasks()
      if (onTaskUpdate) onTaskUpdate()
    } catch (error) {
      console.error('Erro ao adiar tarefa:', error)
      toast.error('Erro ao adiar tarefa')
    }
  }

  // Função de Undo (desfazer ação)
  const handleUndo = async (taskId: string, previousStatus: string, previousScheduledFor: string) => {
    try {
      const response = await fetch(`/api/relationship/tasks/${taskId}/undo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previous_status: previousStatus,
          previous_scheduled_for: previousScheduledFor
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao desfazer ação')
      }
      
      fetchTasks()
      if (onTaskUpdate) onTaskUpdate()
      
      toast.success('Ação desfeita com sucesso')
    } catch (error) {
      console.error('Erro ao desfazer ação:', error)
      toast.error('Erro ao desfazer ação')
    }
  }

  // Excluir tarefa (soft delete com Undo)
  const deleteTask = async (taskId: string) => {
    try {
      console.log(`[DELETE] Iniciando exclusão da tarefa: ${taskId}`)
      
      const taskBefore = tasks.find(t => t.id === taskId)
      const previousStatus = taskBefore?.status
      const previousScheduledFor = taskBefore?.scheduled_for

      const response = await fetch(`/api/relationship/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir tarefa')
      }
      
      fetchTasks()
      if (onTaskUpdate) onTaskUpdate()
      
      toast.success('Tarefa excluída', {
        description: 'Você tem 5 segundos para desfazer',
        duration: 5000,
        action: {
          label: 'Desfazer',
          onClick: () => handleUndo(taskId, previousStatus!, previousScheduledFor!)
        }
      })
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
      toast.error('Erro ao excluir tarefa')
    }
  }

  // Expor função de refresh para componentes pai
  useImperativeHandle(ref, () => ({
    refresh: fetchTasks
  }))

  // Buscar tarefas quando filtros mudarem
  useEffect(() => {

    // Abort previous in-flight request when filters change quickly
    const controller = new AbortController()
    const signal = controller.signal
    ;(fetchTasks as any)._controller?.abort()
    ;(fetchTasks as any)._controller = controller

    setLoading(true)
    const t0 = performance.now()
    // Safety guard: ensure loading cannot hang forever
    const guard = setTimeout(() => {
      if (mountedRef.current) {
        console.warn('[REL] fetch guard timeout - forcing loading=false')
        setLoading(false)
      }
    }, 8000)
    
    const executeFetch = async () => {
      try {
        const apiFilters = getApiFilters()
        const params = safeQueryString({
          page: pagination.page,
          limit: pagination.page_size,
          ...apiFilters
        })

        const url = `/api/relationship/tasks?${params}`
        
        const response = await fetch(url, {
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache' },
          signal
        })

        const data = await response.json()

        if (!response.ok) {
          const errMsg = data?.error || `HTTP ${response.status}`
          throw new Error(errMsg)
        }

        if (process.env.NEXT_PUBLIC_DEBUG_REL === '1') {
          console.debug('[REL] fetch ok', { rows: data.tasks?.length || 0, ms: Math.round(performance.now() - t0) })
        }

        setTasks(Array.isArray(data.tasks) ? data.tasks : [])
        setPagination(data.pagination || { page: 1, page_size: 100, total: 0, total_pages: 0 })
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('[REL] fetch aborted')
          return
        }
        console.error('[REL] fetch error:', error)
        toast.error('Erro ao carregar tarefas')
      } finally {
        clearTimeout(guard)
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }

    executeFetch()
  }, [debouncedFilters])

  // Setup mountedRef
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Calcular contadores de tarefas por status
  const taskCounts = useMemo(() => {
    return {
      overdue: getTasksByColumn('overdue').length,
      due_today: getTasksByColumn('due_today').length,
      pending_future: getTasksByColumn('pending_future').length,
      sent: getTasksByColumn('sent').length,
      postponed_skipped: getTasksByColumn('postponed_skipped').length,
    }
  }, [tasks])

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho Compacto */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Relacionamento</h1>
          <p className="text-sm text-muted-foreground">Gerencie tarefas e comunicações com seus alunos</p>
        </div>
        <ViewToggle
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      </div>

      {/* Filtros Ultra-Compactos */}
      <div className="flex items-center justify-between mb-4">
        <CompactFilters
          filters={filters}
          taskCounts={taskCounts}
          onFilterChange={updateFilters}
          onSearchChange={(query) => updateFilters({ q: query })}
          onClearFilters={resetFilters}
          onRefresh={fetchTasks}
          onNewMessage={() => setShowComposer(true)}
          onAdvancedFilters={() => setFilterDrawerOpen(true)}
          onSetToday={setToday}
          loading={loading}
          activeFiltersCount={getActiveFiltersCount()}
        />
        
        {/* Botão Limpar na tela principal */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar Filtros
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Carregando tarefas...</span>
        </div>
      ) : currentView === 'calendar' ? (
        <RelationshipCalendar />
      ) : (
        <div className="flex flex-col space-y-2">
          {/* Cabeçalhos Ultra Finos (como Paint) */}
          <div className="flex space-x-3">
            {visibleColumns.map(column => (
              <div key={`header-${column.id}`} className={`flex-shrink-0 w-72 border rounded-md ${columnStyleById[column.id]?.header || 'bg-muted/40'}`}>
                <div className="py-1 px-3">
                  <div className="flex items-center justify-between">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            <column.icon className={`h-3 w-3 ${column.color}`} />
                            <span className="text-xs font-medium text-gray-900">{column.title}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {column.id === 'overdue' && 'Tarefas que passaram da data agendada e ainda não foram enviadas'}
                            {column.id === 'due_today' && 'Tarefas agendadas para hoje que ainda não foram enviadas'}
                            {column.id === 'pending_future' && 'Tarefas agendadas para datas futuras'}
                            {column.id === 'sent' && 'Tarefas que já foram enviadas com sucesso'}
                            {column.id === 'postponed_skipped' && 'Tarefas que foram adiadas ou puladas'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Badge variant="secondary" className="bg-white text-gray-700 border text-xs px-1 py-0 h-5">
                      {getTasksByColumn(column.id).length}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Colunas de Conteúdo */}
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="flex space-x-3">
              {visibleColumns.map(column => (
                <DroppableColumn key={`content-${column.id}`} id={column.id}>
                  <Card className="flex-shrink-0 w-72 bg-white">
                <CardContent className="p-4">
                  {getTasksByColumn(column.id).length === 0 ? (
                    <div className="text-center text-muted-foreground py-6">
                      <Inbox className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      <p className="text-sm font-medium">Nenhuma tarefa</p>
                      <p className="text-xs mt-1">
                        {column.id === 'overdue' && 'Nenhuma tarefa atrasada'}
                        {column.id === 'due_today' && 'Sem tarefas para hoje'}
                        {column.id === 'pending_future' && 'Sem tarefas futuras'}
                        {column.id === 'sent' && 'Nenhuma enviada'}
                        {column.id === 'postponed_skipped' && 'Nenhuma adiada/pulada'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(() => {
                        const items = getTasksByColumn(column.id)
                        const limit = 200
                        const isExpanded = !!expandedColumns[column.id]
                        const visible = isExpanded ? items : items.slice(0, limit)
                        return (
                          <>
                            {visible.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onUpdateStatus={updateTaskStatus}
                          onCopyMessage={copyMessage}
                          onOpenWhatsApp={openWhatsApp}
                          onSnoozeTask={snoozeTask}
                          onPostponeTask={postponeTask}
                          onDeleteTask={deleteTask}
                        />
                            ))}
                            {!isExpanded && items.length > limit && (
                              <div className="text-center">
                                <Button variant="outline" size="sm" onClick={() => setExpandedColumns(prev => ({ ...prev, [column.id]: true }))}>
                                  Mostrar mais ({items.length - limit})
                                </Button>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}
                </CardContent>
                  </Card>
                </DroppableColumn>
              ))}
            </div>
          </DndContext>
          
          {/* Drag Overlay */}
          <DragOverlay>
            {dragState.activeItem ? (
              <div className="opacity-90 rotate-3 scale-105">
                <TaskCard
                  task={dragState.activeItem.data}
                  onCopyMessage={() => {}}
                  onWhatsAppSend={() => {}}
                  onPostponeTask={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </div>
      )}

      <MessageComposer 
        open={showComposer} 
        onOpenChange={setShowComposer} 
        onSuccess={() => {
          fetchTasks()
          if (onTaskUpdate) onTaskUpdate()
        }} 
      />

      <RelationshipFilterDrawer
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
        filters={filtersUI}
        onFiltersChange={updateFiltersUI}
        onClear={resetFilters}
        onApply={applyFilters}
      />
    </div>
  )
})

RelationshipKanban.displayName = 'RelationshipKanban'

export default RelationshipKanban