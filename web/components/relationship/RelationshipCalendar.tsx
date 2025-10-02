/**
 * GATE 10.6.4 - Calendário de Relacionamento
 * 
 * Funcionalidades:
 * - Visões: Dia, Semana, Mês
 * - Mesmas ações do Kanban
 * - Filtros integrados
 * - Navegação fluida
 */

'use client'

import React, { useState, useEffect, useMemo, useImperativeHandle, forwardRef, useCallback } from 'react'
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
import RelationshipFilters from './RelationshipFilters'

interface Student {
  id: string
  name: string
  email: string
  phone: string
  status: string
}

interface Task {
  id: string
  student_id: string
  template_code: string
  anchor: string
  scheduled_for: string
  channel: string
  status: 'pending' | 'due_today' | 'sent' | 'snoozed' | 'skipped' | 'failed'
  payload: {
    message: string
    student_name: string
    student_email: string
    student_phone: string
  }
  variables_used: string[]
  created_by: string
  sent_at?: string
  notes?: string
  occurrence_id?: number
  created_at: string
  updated_at: string
  student: Student
}

type ViewMode = 'day' | 'week' | 'month'

interface CalendarProps {
  onTaskUpdate?: (taskId: string, status: string, notes?: string) => void
}

export interface RelationshipCalendarRef {
  refresh: () => void
}

const RelationshipCalendar = forwardRef<RelationshipCalendarRef, CalendarProps>(({ onTaskUpdate }, ref) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  
  // Desativar filtros temporariamente para estabilização
  const debouncedFilters = {
    status: 'all',
    anchor: 'all',
    template_code: 'all',
    channel: 'all',
    date_from: '',
    date_to: '',
    q: ''
  }
  const updateFilters = () => {}
  const resetFilters = () => {}
  const hasActiveFilters = () => false
  const getApiFilters = () => ({})

  // Buscar tarefas - versão simplificada sem filtros
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page_size: '1000' // Buscar todas as tarefas para o calendário
      })

      const response = await fetch(`/api/relationship/tasks?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar tarefas')
      }

      setTasks(data.data || [])
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
      toast.error('Erro ao buscar tarefas')
    } finally {
      setLoading(false)
    }
  }, [])

  // Atualizar status da tarefa
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

      // Atualizar estado local
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: status as any, notes: notes || task.notes }
          : task
      ))

      // Chamar callback se fornecido
      if (onTaskUpdate) {
        onTaskUpdate(taskId, status, notes)
      }

      toast.success('Tarefa atualizada com sucesso')
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

  // Abrir WhatsApp Web
  const openWhatsApp = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  // Snooze tarefa
  const snoozeTask = (taskId: string, days: number) => {
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + days)
    
    updateTaskStatus(taskId, 'snoozed', `Adiada por ${days} dia(s) até ${format(newDate, 'dd/MM/yyyy', { locale: ptBR })}`)
  }

  // Expor função de refresh para componentes pai
  useImperativeHandle(ref, () => ({
    refresh: fetchTasks
  }))

  // Buscar tarefas na inicialização
  useEffect(() => {
    fetchTasks()
  }, [])

  // Calcular datas baseadas na visão - versão simplificada
  const startDate = startOfMonth(currentDate)
  const endDate = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  // Filtrar tarefas por data
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => 
      isSameDay(new Date(task.scheduled_for), date)
    )
  }
  const openDayModal = (date: Date) => {
    setModalDate(date)
    setModalOpen(true)
  }

  // NavegaÃ§Ã£o
  const navigatePrevious = () => {
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
  }

  const navigateNext = () => {
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
  }

  const navigateToday = () => {
    setCurrentDate(new Date())
  }

  // Renderizar tarefa
  const renderTask = (task: Task) => (
    <div
      key={task.id}
      className="bg-white border border-gray-200 rounded-lg p-2 mb-1 hover:shadow-sm transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <Badge 
              variant="outline" 
              className={`text-xs ${
                task.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                task.status === 'due_today' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                task.status === 'sent' ? 'bg-green-50 text-green-700 border-green-200' :
                'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              {task.template_code}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {task.channel}
            </Badge>
          </div>
          
          <p className="text-xs font-medium text-gray-900 truncate">
            {task.student?.name || 'Aluno não encontrado'}
          </p>
          
          <p className="text-xs text-gray-600 line-clamp-2 mt-1">
            {task.payload.message}
          </p>

          <div className="flex items-center gap-1 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => copyMessage(task.payload.message)}
            >
              <Copy className="h-3 w-3" />
            </Button>
            
            {task.channel === 'whatsapp' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => openWhatsApp(task.student?.phone || '', task.payload.message)}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}

            {task.status === 'pending' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => updateTaskStatus(task.id, 'sent')}
              >
                <CheckCircle className="h-3 w-3" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => updateTaskStatus(task.id, 'skipped')}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  // Renderizar visão do dia
  const renderDayView = () => {
    const dayTasks = getTasksForDate(currentDate)
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {format(currentDate, 'dd \'de\' MMMM \'de\' yyyy', { locale: ptBR })}
          </h2>
          <p className="text-gray-600 capitalize">
            {format(currentDate, 'EEEE', { locale: ptBR })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dayTasks.length === 0 ? (
            <div className="col-span-full flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Nenhuma tarefa para este dia</p>
              </div>
            </div>
          ) : (
            dayTasks.map(renderTask)
          )}
        </div>
      </div>
    )
  }

  // Renderizar visão da semana
  const renderWeekView = () => {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            {format(startDate, 'dd \'de\' MMM', { locale: ptBR })} - {format(endDate, 'dd \'de\' MMM \'de\' yyyy', { locale: ptBR })}
          </h2>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dayTasks = getTasksForDate(day)
            const isToday = isSameDay(day, new Date())
            const isWeekend = day.getDay() === 0 || day.getDay() === 6
            
            return (
              <div key={day.toISOString()} className="space-y-2">
                <div className={`text-center p-2 rounded-lg ${
                  isToday 
                    ? 'bg-blue-100 text-blue-900 font-bold' 
                    : isWeekend 
                    ? 'bg-gray-100 text-gray-600' 
                    : 'bg-gray-50 text-gray-900'
                }`}>
                  <div className="text-sm font-medium">
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className="text-lg">
                    {format(day, 'd')}
                  </div>
                </div>
                
                <div className="space-y-1 min-h-[200px]">
                  {dayTasks.map(renderTask)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Renderizar visão do mês
  const renderMonthView = () => {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            {format(currentDate, 'MMMM \'de\' yyyy', { locale: ptBR })}
          </h2>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {/* Cabeçalho dos dias da semana */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center p-2 font-medium text-gray-600 bg-gray-50 rounded-lg">
              {day}
            </div>
          ))}
          
          {/* Dias do mês */}
          {days.map((day, index) => {
            const dayTasks = getTasksForDate(day)
            const isToday = isSameDay(day, new Date())
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()
            
            return (
              <div key={day.toISOString()} className="space-y-1 min-h-[120px]">
                <button onClick={() => openDayModal(day)} className={`w-full text-center p-2 rounded-lg ${
                  isToday 
                    ? 'bg-blue-100 text-blue-900 font-bold' 
                    : isCurrentMonth 
                    ? 'bg-white text-gray-900' 
                    : 'bg-gray-50 text-gray-400'
                }`}>
                  {format(day, 'd')}
                </button>
                {dayTasks.length > 0 ? (
                  <div className="text-xs text-gray-600 text-center">{dayTasks.length} tarefa(s)</div>
                ) : (
                  <div className="text-xs text-gray-300 text-center">—</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendário de Relacionamento
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiltersOpen(true)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTasks}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between">
            {/* Navegação */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={navigatePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={navigateToday}
              >
                Hoje
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={navigateNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Modos de visualização */}
            <div className="flex items-center gap-1">
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal com tarefas do dia */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl" aria-describedby="calendar-day-tasks-desc">
          <DialogHeader>
            <DialogTitle>{modalDate ? `Tarefas de ${format(modalDate, 'dd/MM/yyyy', { locale: ptBR })}` : 'Tarefas do dia'}</DialogTitle>
          </DialogHeader>\n          <p id="calendar-day-tasks-desc" className="sr-only">Lista de tarefas da data selecionada</p>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            {modalDate && getTasksForDate(modalDate).length > 0 ? (
              getTasksForDate(modalDate).map(renderTask)
            ) : (
              <div className="col-span-full text-sm text-gray-500">Nenhuma tarefa neste dia.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Filtros */}
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-w-2xl overflow-visible" aria-describedby="calendar-filters-desc">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros do Calendário
            </DialogTitle>
            <p className="sr-only" id="calendar-filters-desc">
              Ajuste e aplique filtros para o calendário de relacionamento.
            </p>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <RelationshipFilters
              filters={debouncedFilters}
              onFiltersChange={updateFilters}
              onClearFilters={resetFilters}
              showDateFilters={true}
              compact={false}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Conteúdo do calendário */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {viewMode === 'day' && renderDayView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'month' && renderMonthView()}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
})

export default RelationshipCalendar


