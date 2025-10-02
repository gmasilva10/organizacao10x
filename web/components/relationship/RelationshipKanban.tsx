/**
 * GATE 10.7 - Kanban Din mico para Relacionamento
 * 
 * Funcionalidades:
 * - Colunas din micas baseadas no intervalo de datas filtrado
 * - Atrasadas (vermelho) | Para Hoje (azul) | Pendentes de Envio (amarelo)
 * - Enviadas (verde) | Adiadas/Puladas (cinza)
 * - Timezone America/Sao_Paulo
 * - Ordena  o: scheduled_for ASC, created_at ASC
 */

'use client'

import React, { useState, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react'
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
  AlertCircle
} from 'lucide-react'
import TaskCard from './TaskCard'
import MessageComposer from './MessageComposer'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRelationshipFilters } from '@/hooks/useRelationshipFilters'
import { isPast, isToday, isFuture } from '@/lib/date-utils'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { StandardizedCalendar } from '@/components/ui/standardized-calendar'

// Mapeamento de  ncoras para exibi  o
const ANCHOR_LABELS = {
  'sale_close': 'P s-venda',
  'first_workout': '1  Treino',
  'weekly_followup': 'Follow-up Semanal',
  'monthly_review': 'Revis o Mensal',
  'birthday': 'Anivers rio',
  'renewal_window': 'Renova  o',
  'occurrence_followup': 'Follow-up de Ocorr ncia',
  'manual': 'Manual'
}

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
  status: 'pending' | 'sent' | 'postponed' | 'skipped' | 'deleted'
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

interface KanbanColumn {
  id: string
  title: string
  status: string[]
  color: string
  icon: React.ComponentType<{ className?: string }>
}

// Defini  o de todas as colunas poss veis
const ALL_COLUMNS: KanbanColumn[] = [
  {
    id: 'overdue',
    title: 'Atrasadas',
    status: ['pending'],
    color: 'bg-red-100 border-red-300 border-2',
    icon: AlertCircle
  },
  {
    id: 'due_today',
    title: 'Para Hoje',
    status: ['pending'],
    color: 'bg-blue-100 border-blue-300 border-2',
    icon: Calendar
  },
  {
    id: 'pending_future',
    title: 'Pendentes de Envio',
    status: ['pending'],
    color: 'bg-yellow-100 border-yellow-300 border-2',
    icon: Clock
  },
  {
    id: 'sent',
    title: 'Enviadas',
    status: ['sent'],
    color: 'bg-green-100 border-green-300 border-2',
    icon: CheckCircle
  },
  {
    id: 'postponed_skipped',
    title: 'Adiadas/Puladas',
    status: ['postponed', 'skipped'],
    color: 'bg-gray-100 border-gray-300 border-2',
    icon: Pause
  }
]

const ANCHOR_OPTIONS = [
  { value: 'all', label: 'Todas as  ncoras' },
  { value: 'sale_close', label: 'Fechamento da Venda' },
  { value: 'first_workout', label: 'Primeiro Treino' },
  { value: 'weekly_followup', label: 'Acompanhamento Semanal' },
  { value: 'monthly_review', label: 'Revis o Mensal' },
  { value: 'birthday', label: 'Anivers rio' },
  { value: 'renewal_window', label: 'Janela de Renova  o' },
  { value: 'occurrence_followup', label: 'Follow-up de Ocorr ncia' }
]

const CHANNEL_OPTIONS = [
  { value: 'all', label: 'Todos os Canais' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'manual', label: 'Manual' }
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'due_today', label: 'Para Hoje' },
  { value: 'sent', label: 'Enviadas' },
  { value: 'snoozed', label: 'Adiada' },
  { value: 'skipped', label: 'Pulada' }
]

interface RelationshipKanbanProps {
  onTaskUpdate?: () => void
}

export interface RelationshipKanbanRef {
  refresh: () => void
}

const RelationshipKanban = forwardRef<RelationshipKanbanRef, RelationshipKanbanProps>(({ onTaskUpdate }, ref) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showComposer, setShowComposer] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 0
  })
  
  const { 
    filters,
    debouncedFilters, 
    updateFilters, 
    resetFilters, 
    setToday,
    hasActiveFilters,
    getApiFilters,
    getActiveFiltersCount 
  } = useRelationshipFilters()

  // Buscar tarefas
  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        page_size: pagination.page_size.toString(),
        ...getApiFilters()
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

      console.log(`ðŸ   [FETCH] Tarefas recebidas: ${data.data?.length || 0}`)
      setTasks(data.data || [])
      setPagination(data.pagination || pagination)
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
      toast.error('Erro ao buscar tarefas')
    } finally {
      setLoading(false)
    }
  }

  // Atualizar status da tarefa
  const updateTaskStatus = async (taskId: string, status: string, notes?: string) => {
    try {
      // Guardar estado anterior para poss vel undo
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

      // Atualizar estado local
      fetchTasks()
      if (onTaskUpdate) onTaskUpdate()

      // Se for skip, oferecer undo
      if (status === 'skipped') {
        toast.success('Tarefa pulada', {
          description: 'Voc  tem 5 segundos para desfazer',
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
    toast.success('Mensagem copiada para a  rea de transfer ncia')
  }

  // Abrir WhatsApp Web
  const openWhatsApp = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
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

  // Expor fun  o de refresh para componentes pai
  useImperativeHandle(ref, () => ({
    refresh: fetchTasks
  }))

  // Buscar tarefas quando filtros mudarem
  useEffect(() => {
    // Evitar chamadas desnecessárias durante a inicialização
    if (loading) return
    
    fetchTasks()
  }, [debouncedFilters, pagination.page])

  // Determinar colunas vis veis baseadas no intervalo de datas
  const visibleColumns = useMemo(() => {
    try {
      const { date_from, date_to } = debouncedFilters
      
      // Se n o h filtro de data, mostrar todas as colunas
      if (!date_from || !date_to) {
        return ALL_COLUMNS
      }
      
      const dateFrom = new Date(date_from)
      const dateTo = new Date(date_to)
      
      // Verificar se as datas são válidas
      if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
        console.warn('Datas inválidas no filtro:', { date_from, date_to })
        return ALL_COLUMNS
      }
      
      // Verificar se o intervalo cont m passado, hoje e futuro
      const hasPast = isPast(dateFrom) || isPast(dateTo)
      const hasToday = isToday(dateFrom) || isToday(dateTo) || 
                       (isPast(dateFrom) && isFuture(dateTo))
      const hasFuture = isFuture(dateFrom) || isFuture(dateTo)
      
      // Verificar se   100% futuro (para mostrar "Pendentes de Envio")
      const isFullyFuture = isFuture(dateFrom) && isFuture(dateTo)
      
      const columns: KanbanColumn[] = []
      
      // Atrasadas - aparece quando o intervalo inclui datas passadas
      if (hasPast) {
        const overdueColumn = ALL_COLUMNS.find(c => c.id === 'overdue')
        if (overdueColumn) columns.push(overdueColumn)
      }
      
      // Para Hoje - aparece quando o intervalo inclui hoje
      if (hasToday) {
        const dueTodayColumn = ALL_COLUMNS.find(c => c.id === 'due_today')
        if (dueTodayColumn) columns.push(dueTodayColumn)
      }
      
      // Pendentes de Envio - aparece SOMENTE quando o intervalo   100% futuro
      if (isFullyFuture) {
        const pendingFutureColumn = ALL_COLUMNS.find(c => c.id === 'pending_future')
        if (pendingFutureColumn) columns.push(pendingFutureColumn)
      }
      
      // Enviadas e Adiadas/Puladas - sempre vis veis
      const sentColumn = ALL_COLUMNS.find(c => c.id === 'sent')
      const postponedColumn = ALL_COLUMNS.find(c => c.id === 'postponed_skipped')
      
      if (sentColumn) columns.push(sentColumn)
      if (postponedColumn) columns.push(postponedColumn)
      
      return columns
    } catch (error) {
      console.error('Erro ao calcular colunas visíveis:', error)
      return ALL_COLUMNS
    }
  }, [debouncedFilters])

  // Agrupar tarefas por coluna usando timezone
  const getTasksByColumn = (columnId: string) => {
    return tasks.filter(task => {
      // Atrasadas: scheduled_for < startOfToday e status = 'pending'
      if (columnId === 'overdue') {
        return task.status === 'pending' && isPast(task.scheduled_for)
      }
      
      // Para Hoje: scheduled_for ∈ hoje e status = 'pending'
      if (columnId === 'due_today') {
        return task.status === 'pending' && isToday(task.scheduled_for)
      }
      
      // Pendentes de Envio: scheduled_for > endOfToday e status = 'pending'
      if (columnId === 'pending_future') {
        return task.status === 'pending' && isFuture(task.scheduled_for)
      }
      
      // Enviadas: status = 'sent'
      if (columnId === 'sent') {
        return task.status === 'sent'
      }
      
      // Adiadas/Puladas: status in ('postponed', 'skipped')
      if (columnId === 'postponed_skipped') {
        return task.status === 'postponed' || task.status === 'skipped'
      }
      
      return false
    }).sort((a, b) => {
      // Ordena  o: scheduled_for ASC, depois created_at ASC
      const dateA = new Date(a.scheduled_for).getTime()
      const dateB = new Date(b.scheduled_for).getTime()
      
      if (dateA !== dateB) {
        return dateA - dateB
      }
      
      // Se datas iguais, ordenar por created_at
      const createdA = new Date(a.created_at).getTime()
      const createdB = new Date(b.created_at).getTime()
      return createdA - createdB
    })
  }

  // Fun  o de Undo (desfazer a  o)
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
        throw new Error(data.error || 'Erro ao desfazer a  o')
      }
      
      fetchTasks()
      if (onTaskUpdate) onTaskUpdate()
      
      toast.success('A  o desfeita com sucesso')
    } catch (error) {
      console.error('Erro ao desfazer a  o:', error)
      toast.error('Erro ao desfazer a  o')
    }
  }

  // Excluir tarefa (soft delete com Undo)
  const deleteTask = async (taskId: string) => {
    try {
      console.log(`[DELETE] Iniciando exclus o da tarefa: ${taskId}`)
      
      // Guardar estado anterior para undo
      const taskBefore = tasks.find(t => t.id === taskId)
      const previousStatus = taskBefore?.status
      const previousScheduledFor = taskBefore?.scheduled_for
      
      const response = await fetch(`/api/relationship/tasks/${taskId}`, {
        method: 'DELETE'
      })
      
      console.log(`[DELETE] Status da resposta: ${response.status}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error(`[DELETE] Erro na resposta:`, errorData)
        throw new Error('Erro ao excluir tarefa')
      }
      
      const result = await response.json()
      console.log(`ðŸ   ¸ [DELETE] Resposta da API:`, result)
      
      // Oferecer Undo
      toast.success('Tarefa exclu da', {
        description: 'Voc  tem 5 segundos para desfazer',
        duration: 5000,
        action: {
          label: 'Desfazer',
          onClick: () => handleUndo(taskId, previousStatus!, previousScheduledFor!)
        }
      })
      
      // Atualizar lista
      fetchTasks()
      if (onTaskUpdate) onTaskUpdate()
      
    } catch (error) {
      console.error('[DELETE] Erro ao excluir tarefa:', error)
      toast.error('Erro ao excluir tarefa')
    }
  }

  // Renderizar card da tarefa usando componente simplificado
  const renderTaskCard = (task: Task) => (
    <TaskCard
      key={task.id}
      task={task}
      onCopyMessage={copyMessage}
      onOpenWhatsApp={openWhatsApp}
      onUpdateStatus={updateTaskStatus}
      onSnoozeTask={snoozeTask}
      onDeleteTask={deleteTask}
    />
  )

  return (
    <div className="space-y-4">
      {/* Header simplificado - bot es ficam na p gina principal */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Relacionamento</h2>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">Gerencie mensagens e lembretes com seus alunos</p>
            {debouncedFilters.date_from && debouncedFilters.date_to && (
              <Badge variant="outline" className="text-xs">
                📅 Filtro: {format(new Date(debouncedFilters.date_from), 'dd/MM', { locale: ptBR })} - {format(new Date(debouncedFilters.date_to), 'dd/MM', { locale: ptBR })}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Nova Mensagem */}
          <Button
            onClick={() => setShowComposer(true)}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Nova Mensagem
          </Button>
          
          {/* Filtros */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {getActiveFiltersCount() > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
          
          {/* Chip para filtrar apenas hoje */}
          <Button
            variant="outline"
            size="sm"
            onClick={setToday}
            className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
          >
            <Calendar className="h-4 w-4" />
            Hoje
          </Button>
          
          {(debouncedFilters.date_from || debouncedFilters.status !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Limpar
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTasks}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>


      {/* Kanban Board Din mico */}
      <div className={`grid grid-cols-1 gap-4 ${
        visibleColumns.length === 2 ? 'md:grid-cols-2' :
        visibleColumns.length === 3 ? 'md:grid-cols-3' :
        visibleColumns.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
        'md:grid-cols-2 lg:grid-cols-5'
      }`}>
        {visibleColumns.map(column => {
          const columnTasks = getTasksByColumn(column.id)
          
          return (
            <div key={column.id} className="space-y-3">
              {/* Header da coluna colorido */}
              <div className={`p-3 rounded-lg border-2 ${column.color}`}>
                <div className="flex items-center gap-2">
                  <column.icon className="h-4 w-4" />
                  <h3 className="font-medium text-sm">{column.title}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {columnTasks.length}
                  </Badge>
                </div>
              </div>
              
              {/* Lista de tarefas */}
              <div className="space-y-2 min-h-[300px] max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : columnTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm p-4 text-center">
                    <column.icon className="h-8 w-8 mb-2 opacity-50" />
                    <p className="font-medium">Nenhuma tarefa</p>
                    <p className="text-xs mt-1">{
                      column.id === 'overdue' ? 'Sem tarefas atrasadas' :
                      column.id === 'due_today' ? 'Sem tarefas para hoje' :
                      column.id === 'pending_future' ? 'Sem tarefas futuras' :
                      column.id === 'sent' ? 'Nenhuma enviada' :
                      'Nenhuma adiada/pulada'
                    }</p>
                  </div>
                ) : (
                  columnTasks.map(renderTaskCard)
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagina  o */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
          >
            Anterior
          </Button>
          
          <span className="text-sm text-gray-600">
            P gina {pagination.page} de {pagination.total_pages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.total_pages}
          >
            Pr xima
          </Button>
        </div>
      )}
      {/* Modal Composer */}
      <MessageComposer
        open={showComposer}
        onOpenChange={setShowComposer}
      />
      
      {/* Drawer de Filtros */}
      <Drawer open={showFilters} onOpenChange={setShowFilters} direction="right">
        <DrawerContent 
          className="ml-auto h-full w-full max-w-md flex flex-col"
          aria-describedby="relationship-filters-desc"
          role="dialog"
          aria-labelledby="relationship-filters-title"
        >
          <DrawerHeader>
            <DrawerTitle id="relationship-filters-title">Filtros</DrawerTitle>
            <p className="sr-only" id="relationship-filters-desc">
              Ajuste filtros de status, canal e per odo para o m dulo de relacionamento.
            </p>
          </DrawerHeader>
          
          <div className="space-y-4 p-4 overflow-y-auto flex-1">
            {/* Filtro de Status */}
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="mt-2 space-y-2">
                {STATUS_OPTIONS.map(option => (
                  <label key={option.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name="status-filter"
                      checked={filters.status === option.value}
                      onChange={() => updateFilters({ status: option.value })}
                      className="h-4 w-4"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Filtro de Canal */}
            <div>
              <Label className="text-sm font-medium">Canal</Label>
              <div className="mt-2 space-y-2">
                {CHANNEL_OPTIONS.map(option => (
                  <label key={option.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name="channel-filter"
                      checked={filters.channel === option.value}
                      onChange={() => updateFilters({ channel: option.value })}
                      className="h-4 w-4"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Filtro de Per odo */}
            <div>
              <Label className="text-sm font-medium">Per odo</Label>
              <div className="mt-2 space-y-3">
                <StandardizedCalendar
                  value={filters.date_from ? new Date(filters.date_from) : undefined}
                  onChange={(date) => {
                    if (date) {
                      updateFilters({ 
                        date_from: date.toISOString()
                      })
                    }
                  }}
                  placeholder="Data inicial"
                />
                <StandardizedCalendar
                  value={filters.date_to ? new Date(filters.date_to) : undefined}
                  onChange={(date) => {
                    if (date) {
                      updateFilters({ 
                        date_to: date.toISOString()
                      })
                    }
                  }}
                  placeholder="Data final"
                />
              </div>
            </div>
          </div>
          
          <DrawerFooter className="border-t">
            <div className="flex items-center justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  resetFilters()
                  setShowFilters(false)
                }}
              >
                Limpar
              </Button>
              <Button 
                onClick={() => setShowFilters(false)}
              >
                Aplicar
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
})

export default RelationshipKanban



