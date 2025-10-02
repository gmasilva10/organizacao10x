/**
 * GATE 10.7 - Kanban Simplificado para Relacionamento
 * 
 * Versão ultra-simplificada para evitar erros de TypeError
 */

'use client'

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare,
  Clock,
  CheckCircle,
  Pause,
  User
} from 'lucide-react'
import { toast } from 'sonner'

interface Task {
  id: string
  student_id: string
  template_code: string | null
  anchor: string
  scheduled_for: string
  channel: string
  status: string
  payload: {
    mode: string
    message: string
    template_version: string | null
    classification_tag: string | null
  }
  variables_used: Record<string, any>
  created_at: string
  updated_at: string
  created_by: string
  students: {
    id: string
    name: string
    email: string
    phone: string
  }
}

interface KanbanColumn {
  id: string
  title: string
  icon: React.ReactNode
  color: string
  description: string
}

const ALL_COLUMNS: KanbanColumn[] = [
  {
    id: 'due_today',
    title: 'Para Hoje',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-blue-50 border-blue-200',
    description: 'Sem tarefas para hoje'
  },
  {
    id: 'sent',
    title: 'Enviadas',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'bg-green-50 border-green-200',
    description: 'Nenhuma enviada'
  },
  {
    id: 'postponed_skipped',
    title: 'Adiadas/Puladas',
    icon: <Pause className="h-4 w-4" />,
    color: 'bg-gray-50 border-gray-200',
    description: 'Nenhuma adiada/pulada'
  }
]

interface RelationshipKanbanSimpleProps {
  onTaskUpdate?: () => void
}

const RelationshipKanbanSimple = forwardRef<{ refresh: () => void }, RelationshipKanbanSimpleProps>(
  ({ onTaskUpdate }, ref) => {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(false)

    // Buscar tarefas
    const fetchTasks = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/relationship/tasks', {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao buscar tarefas')
        }

        console.log(`📋 [FETCH] Tarefas recebidas: ${data.tasks?.length || 0}`)
        setTasks(data.tasks || [])
      } catch (error) {
        console.error('Erro ao buscar tarefas:', error)
        toast.error('Erro ao buscar tarefas')
      } finally {
        setLoading(false)
      }
    }

    // Expor função de refresh para componentes pai
    useImperativeHandle(ref, () => ({
      refresh: fetchTasks
    }))

    // Buscar tarefas na inicialização
    useEffect(() => {
      fetchTasks()
    }, [])

    // Agrupar tarefas por coluna - versão ultra-simplificada
    const getTasksByColumn = (columnId: string) => {
      try {
        if (!Array.isArray(tasks) || tasks.length === 0) {
          return []
        }
        
        return tasks.filter(task => {
          if (!task || typeof task !== 'object' || !task.status) {
            return false
          }
          
          if (columnId === 'sent') {
            return task.status === 'sent'
          }
          
          if (columnId === 'postponed_skipped') {
            return task.status === 'postponed' || task.status === 'skipped'
          }
          
          if (columnId === 'due_today') {
            return task.status === 'pending'
          }
          
          return false
        })
      } catch (error) {
        console.error('Erro em getTasksByColumn:', error)
        return []
      }
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Relacionamento</h2>
            <p className="text-muted-foreground">Gerencie mensagens e lembretes com seus alunos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchTasks} disabled={loading}>
              Atualizar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ALL_COLUMNS.map((column) => {
            const columnTasks = getTasksByColumn(column.id)
            
            return (
              <Card key={column.id} className={`${column.color} border-2`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    {column.icon}
                    {column.title}
                    <Badge variant="secondary" className="ml-auto">
                      {columnTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {columnTasks.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground mb-2">
                        {column.icon}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {column.description}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {columnTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-3 bg-white rounded-lg border shadow-sm"
                        >
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {task.students.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {task.students.phone}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {task.payload.message}
                              </p>
                              <div className="flex items-center gap-1 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {task.status}
                                </Badge>
                                {task.payload.classification_tag && (
                                  <Badge variant="secondary" className="text-xs">
                                    {task.payload.classification_tag}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }
)

RelationshipKanbanSimple.displayName = 'RelationshipKanbanSimple'

export default RelationshipKanbanSimple
