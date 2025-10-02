'use client'

import React, { useState, useEffect, useMemo, useImperativeHandle, forwardRef, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  Pause,
  X,
  Copy,
  ExternalLink,
  MoreHorizontal,
  MessageSquare,
  Filter,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, subDays, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRelationshipFilters } from '@/hooks/useRelationshipFilters'
import { safeQueryString } from '@/lib/query-utils'

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

interface RelationshipCalendarProps {
  onTaskUpdate?: () => void
}

export interface RelationshipCalendarRef {
  refresh: () => void
}

type ViewMode = 'day' | 'week' | 'month'

const RelationshipCalendar = forwardRef<RelationshipCalendarRef, RelationshipCalendarProps>(({ onTaskUpdate }, ref) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskDetails, setShowTaskDetails] = useState(false)
  const mountedRef = useRef(true)

  // Hook de filtros
  const {
    filters,
    debouncedFilters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    getApiFilters
  } = useRelationshipFilters()

  // Buscar tarefas
  const fetchTasks = useCallback(async () => {
    if (!mountedRef.current) return
    
    setLoading(true)
    try {
      const apiFilters = getApiFilters()
      const params = safeQueryString({
        page: 1,
        page_size: 1000, // Buscar muitas tarefas para o calendário
        ...apiFilters
      })

      const response = await fetch(`/api/relationship/tasks?${params}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar tarefas')
      }

      if (process.env.NEXT_PUBLIC_DEBUG_REL === '1') {
        console.log(`📊 [CALENDAR] Tarefas recebidas: ${data.tasks?.length || 0}`)
      }
      
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
      toast.error('Erro ao buscar tarefas')
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [debouncedFilters, getApiFilters])

  // Calcular datas baseadas na visão
  const { startDate, endDate, days } = useMemo(() => {
    try {
      let start: Date
      let end: Date

      switch (viewMode) {
        case 'day':
          start = currentDate
          end = currentDate
          break
        case 'week':
          start = startOfWeek(currentDate, { weekStartsOn: 1 })
          end = endOfWeek(currentDate, { weekStartsOn: 1 })
          break
        case 'month':
        default:
          start = startOfMonth(currentDate)
          end = endOfMonth(currentDate)
          break
      }

      const daysArray = eachDayOfInterval({ start, end })

      return {
        startDate: start,
        endDate: end,
        days: daysArray
      }
    } catch (error) {
      console.error('Erro ao calcular datas do calendário:', error)
      // Fallback para o mês atual
      const now = new Date()
      const start = startOfMonth(now)
      const end = endOfMonth(now)
      const daysArray = eachDayOfInterval({ start, end })
      
      return {
        startDate: start,
        endDate: end,
        days: daysArray
      }
    }
  }, [currentDate, viewMode])

  // Obter tarefas para um dia específico
  const getTasksForDay = useCallback((date: Date) => {
    try {
      return tasks.filter(task => {
        if (!task || !task.scheduled_for) return false
        
        const taskDate = new Date(task.scheduled_for)
        if (isNaN(taskDate.getTime())) return false
        
        return isSameDay(taskDate, date)
      }).sort((a, b) => {
        try {
          const dateA = new Date(a.scheduled_for)
          const dateB = new Date(b.scheduled_for)
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0
          return dateA.getTime() - dateB.getTime()
        } catch (error) {
          console.warn('Erro na ordenação de tarefas do calendário:', error)
          return 0
        }
      })
    } catch (error) {
      console.error('Erro em getTasksForDay:', error)
      return []
    }
  }, [tasks])

  // Navegação
  const goToPrevious = useCallback(() => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(prev => subDays(prev, 1))
        break
      case 'week':
        setCurrentDate(prev => subWeeks(prev, 1))
        break
      case 'month':
        setCurrentDate(prev => subMonths(prev, 1))
        break
    }
  }, [viewMode])

  const goToNext = useCallback(() => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(prev => addDays(prev, 1))
        break
      case 'week':
        setCurrentDate(prev => addWeeks(prev, 1))
        break
      case 'month':
        setCurrentDate(prev => addMonths(prev, 1))
        break
    }
  }, [viewMode])

  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  // Ações de tarefa
  const updateTaskStatus = async (taskId: string, status: string, notes?: string) => {
    try {
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
      toast.success('Tarefa atualizada com sucesso')
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      toast.error('Erro ao atualizar tarefa')
    }
  }

  const copyMessage = (message: string) => {
    navigator.clipboard.writeText(message)
    toast.success('Mensagem copiada para a área de transferência')
  }

  const openWhatsApp = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

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

  const deleteTask = async (taskId: string) => {
    try {
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
      toast.success('Tarefa excluída')
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
      toast.error('Erro ao excluir tarefa')
    }
  }

  // Expor função de refresh
  useImperativeHandle(ref, () => ({
    refresh: fetchTasks
  }))

  // Buscar tarefas quando filtros mudarem
  useEffect(() => {
    if (mountedRef.current) {
      fetchTasks()
    }
  }, [fetchTasks])

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Carregando calendário...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho do calendário */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Hoje
          </Button>
          <Button variant="outline" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold">
            {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : viewMode === 'week' ? 'dd/MM/yyyy' : 'dd/MM/yyyy', { locale: ptBR })}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('day')}
          >
            Dia
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Semana
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            Mês
          </Button>
          <Button variant="outline" onClick={fetchTasks}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid do calendário */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            const dayTasks = getTasksForDay(date)
            const isToday = isSameDay(date, new Date())
            const isCurrentMonth = date.getMonth() === currentDate.getMonth()

            return (
              <Card
                key={date.toISOString()}
                className={`min-h-[120px] cursor-pointer transition-colors ${
                  isToday ? 'bg-primary/10 border-primary' : ''
                } ${!isCurrentMonth ? 'opacity-50' : ''}`}
                onClick={() => {
                  setCurrentDate(date)
                  if (viewMode !== 'day') setViewMode('day')
                }}
              >
                <CardHeader className="p-2">
                  <CardTitle className="text-sm">
                    {format(date, 'd')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-1">
                  {dayTasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      className="text-xs p-1 rounded bg-muted hover:bg-muted/80 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTask(task)
                        setShowTaskDetails(true)
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${
                          task.status === 'pending' ? 'bg-yellow-500' :
                          task.status === 'sent' ? 'bg-green-500' :
                          task.status === 'skipped' ? 'bg-gray-500' :
                          'bg-blue-500'
                        }`} />
                        <span className="truncate">{task.student.name}</span>
                      </div>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayTasks.length - 3} mais
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Modal de detalhes da tarefa */}
      <Dialog open={showTaskDetails} onOpenChange={setShowTaskDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Tarefa</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Aluno</label>
                  <p className="text-sm text-muted-foreground">{selectedTask.student.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge variant="secondary">{selectedTask.status}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Canal</label>
                  <p className="text-sm text-muted-foreground">{selectedTask.channel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Agendado para</label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedTask.scheduled_for), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Mensagem</label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">{selectedTask.payload?.message || 'Nenhuma mensagem'}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => updateTaskStatus(selectedTask.id, 'sent')}
                  disabled={selectedTask.status === 'sent'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como Enviada
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateTaskStatus(selectedTask.id, 'skipped')}
                  disabled={selectedTask.status === 'skipped'}
                >
                  <X className="h-4 w-4 mr-2" />
                  Pular
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyMessage(selectedTask.payload?.message || '')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openWhatsApp(selectedTask.student.phone, selectedTask.payload?.message || '')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteTask(selectedTask.id)
                    setShowTaskDetails(false)
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
})

RelationshipCalendar.displayName = 'RelationshipCalendar'

export default RelationshipCalendar