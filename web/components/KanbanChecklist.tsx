"use client"

import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Task {
  id: string
  title: string
  description: string
  is_required: boolean
  order_index: number
}

interface CardTask {
  id: string
  task_id: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  started_at?: string
  completed_at?: string
  notes?: string
  task: Task
}

interface KanbanChecklistProps {
  cardId: string
  stageCode: string
  onTaskToggle: (taskId: string, status: 'completed' | 'pending') => void
}

export function KanbanChecklist({ cardId, stageCode, onTaskToggle }: KanbanChecklistProps) {
  const [tasks, setTasks] = useState<CardTask[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingTask, setUpdatingTask] = useState<string | null>(null)

  useEffect(() => {
    if (cardId && stageCode) {
      fetchTasks()
    }
  }, [cardId, stageCode])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      // Buscar tarefas do estágio
      const tasksResponse = await fetch(`/api/services/onboarding/tasks?stage_code=${stageCode}`)
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        
        // Buscar instâncias de tarefas do card
        const cardTasksResponse = await fetch(`/api/kanban/items/${cardId}/tasks`)
        if (cardTasksResponse.ok) {
          const cardTasksData = await cardTasksResponse.json()
          
          // Combinar tarefas com instâncias
          const combinedTasks = tasksData.tasks.map((task: Task) => {
            const cardTask = cardTasksData.tasks?.find((ct: CardTask) => ct.task_id === task.id)
            return {
              id: cardTask?.id || `temp_${task.id}`,
              task_id: task.id,
              status: cardTask?.status || 'pending',
              started_at: cardTask?.started_at,
              completed_at: cardTask?.completed_at,
              notes: cardTask?.notes,
              task
            }
          })
          
          setTasks(combinedTasks)
        } else {
          // Se não há instâncias, criar com status pending
          const pendingTasks = tasksData.tasks.map((task: Task) => ({
            id: `temp_${task.id}`,
            task_id: task.id,
            status: 'pending' as const,
            task
          }))
          setTasks(pendingTasks)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskToggle = async (catalogTaskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    setUpdatingTask(catalogTaskId)
    
    try {
      await onTaskToggle(catalogTaskId, newStatus)
      
      // Atualizar estado local usando task_id (ID do catálogo)
      setTasks(prev => prev.map(task => 
        task.task_id === catalogTaskId 
          ? { ...task, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined }
          : task
      ))
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
    } finally {
      setUpdatingTask(null)
    }
  }

  const completedCount = tasks.filter(t => t.status === 'completed').length
  const requiredCount = tasks.filter(t => t.task.is_required).length
  const completedRequired = tasks.filter(t => t.task.is_required && t.status === 'completed').length
  const progress = requiredCount > 0 ? Math.round((completedRequired / requiredCount) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma tarefa configurada para este estágio</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* P2-01: Progress Header refinado com ícones */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Progresso do Estágio</h4>
            <p className="text-sm text-gray-600">
              {completedRequired} de {requiredCount} tarefas obrigatórias concluídas
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">{progress}%</div>
          <div className="text-xs text-blue-500 font-medium">Concluído</div>
        </div>
      </div>

      {/* P2-01: Progress Bar refinada com gradiente e animação */}
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
        <div 
          className="bg-gradient-to-r from-blue-500 via-indigo-500 to-green-500 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${progress}%` }}
        >
          {/* P2-01: Efeito de brilho sutil */}
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </div>
      </div>
      
      {/* P2-01: Indicadores de progresso */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Início</span>
        <span className="font-medium">{progress}% concluído</span>
        <span>Concluído</span>
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {tasks
          .sort((a, b) => a.task.order_index - b.task.order_index)
          .map((task) => (
            <div key={task.id} className={`group relative flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm hover:border-gray-300 ${task.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
              
              {/* Indicador de ordem compacto */}
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 border border-gray-200">
                  {task.task.order_index}
                </div>
              </div>
              
              {/* Botão de toggle compacto */}
              <div className="flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-0 h-6 w-6 rounded-full transition-all duration-200 hover:scale-110 ${
                    task.status === 'completed' 
                      ? 'text-green-600 hover:bg-green-100' 
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  onClick={() => handleTaskToggle(task.task_id, task.status)}
                  disabled={updatingTask === task.task_id}
                >
                  {updatingTask === task.id ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                  ) : task.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Header da tarefa compacto */}
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.task.title}
                  </span>
                  
                  {/* Badges compactos */}
                  {task.task.is_required ? (
                    <Badge variant="destructive" className="text-xs px-2 py-0.5 bg-red-50 text-red-700 border-red-200">
                      🔴 Obrigatória
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                      🔵 Opcional
                    </Badge>
                  )}
                  
                  {/* Status visual compacto + Data (se concluída) */}
                  <div className="ml-auto flex items-center gap-2">
                    {/* Data da conclusão (só se concluída) */}
                    {task.status === 'completed' && task.completed_at && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(task.completed_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    
                    {/* Status visual */}
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      task.status === 'completed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {task.status === 'completed' ? '✓' : '○'}
                    </div>
                  </div>
                </div>
                
                {/* Descrição compacta (só se existir) */}
                {task.task.description && (
                  <p className={`text-xs text-gray-500 truncate ${task.status === 'completed' ? 'line-through' : ''}`}>
                    {task.task.description}
                  </p>
                )}
                
                {/* Remover o timestamp antigo que estava abaixo da descrição */}
              </div>
            </div>
          ))}
      </div>

      {/* Status Summary compacto */}
      <div className={`p-3 rounded-lg border transition-all duration-200 ${
        completedRequired === requiredCount && requiredCount > 0
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {completedRequired === requiredCount && requiredCount > 0 ? (
              <span className="text-sm text-green-700">✅ Pronto para avançar</span>
            ) : (
              <span className="text-sm text-amber-700">⚠️ {requiredCount - completedRequired} pendente(s)</span>
            )}
          </div>
          <div className="text-xs opacity-75">
            {completedRequired}/{requiredCount} obrigatórias
          </div>
        </div>
      </div>
    </div>
  )
}
