"use client"

import { useState, useEffect, useMemo } from 'react'
import { X, Clock, User, ArrowRight, CheckCircle, Edit, Move, Archive, BarChart3, TrendingUp, Filter, Search, Calendar, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface KanbanLog {
  id: string
  action: string
  payload: any
  created_at: string
  created_by: string
  stage_id: string
  profiles: { name: string }
}

interface KanbanLogDrawerProps {
  cardId: string
  cardTitle: string
  isOpen: boolean
  onClose: () => void
}

const actionIcons: Record<string, any> = {
  card_created: CheckCircle,
  card_moved: Move,
  card_edited: Edit,
  task_completed: CheckCircle,
  task_started: Clock,
  card_archived: Archive,
  stage_completed: CheckCircle,
  // P2-03: Novas ações para abas de comentários e anexos
  comments_tab_opened: Edit,
  attachments_tab_opened: Archive,
  card_completed: CheckCircle
}

const actionLabels: Record<string, string> = {
  card_created: 'Card criado',
  card_moved: 'Card movido',
  card_edited: 'Card editado',
  task_completed: 'Tarefa concluída',
  task_started: 'Tarefa iniciada',
  card_archived: 'Card arquivado',
  stage_completed: 'Etapa concluída',
  // P2-03: Novas ações para abas de comentários e anexos
  comments_tab_opened: 'Aba comentários aberta',
  attachments_tab_opened: 'Aba anexos aberta',
  card_completed: 'Onboarding concluído'
}

export function KanbanLogDrawer({ cardId, cardTitle, isOpen, onClose }: KanbanLogDrawerProps) {
  const [logs, setLogs] = useState<KanbanLog[]>([])
  const [loading, setLoading] = useState(false)
  
  // P2-03: Estados para filtros e métricas
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')

  useEffect(() => {
    if (isOpen && cardId) {
      fetchLogs()
    }
  }, [isOpen, cardId])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/kanban/logs/${cardId}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // P2-03: Métricas calculadas dos logs
  const metrics = useMemo(() => {
    const totalActions = logs.length
    const actionsByType = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const today = new Date()
    const todayLogs = logs.filter(log => {
      const logDate = new Date(log.created_at)
      return logDate.toDateString() === today.toDateString()
    })
    
    const thisWeek = logs.filter(log => {
      const logDate = new Date(log.created_at)
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      return logDate >= weekAgo
    })
    
    return {
      total: totalActions,
      today: todayLogs.length,
      thisWeek: thisWeek.length,
      byType: actionsByType,
      mostActiveAction: Object.entries(actionsByType).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
    }
  }, [logs])

  // P2-03: Logs filtrados
  const filteredLogs = useMemo(() => {
    let filtered = logs

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(log => 
        actionLabels[log.action]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getActionDescription(log).toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por ação
    if (selectedAction !== 'all') {
      filtered = filtered.filter(log => log.action === selectedAction)
    }

    // Filtro por período
    if (selectedPeriod !== 'all') {
      const now = new Date()
      filtered = filtered.filter(log => {
        const logDate = new Date(log.created_at)
        switch (selectedPeriod) {
          case 'today':
            return logDate.toDateString() === now.toDateString()
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return logDate >= weekAgo
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            return logDate >= monthAgo
          default:
            return true
        }
      })
    }

    return filtered
  }, [logs, searchTerm, selectedAction, selectedPeriod])

  const getActionDescription = (log: KanbanLog) => {
    const { action, payload } = log
    
    switch (action) {
      case 'card_created':
        return `Aluno "${payload.student_name || cardTitle}" adicionado ao onboarding`
      case 'card_moved':
        return `Movido para ${payload.to_stage || 'nova coluna'}`
      case 'card_edited':
        return 'Informações do aluno atualizadas'
      case 'task_completed':
        return `Tarefa "${payload.task_title || 'obrigatória'}" concluída`
      case 'task_started':
        return `Tarefa "${payload.task_title || 'obrigatória'}" iniciada`
      case 'card_archived':
        return 'Onboarding encerrado e enviado para histórico'
      case 'stage_completed':
        return 'Etapa concluída com sucesso'
      // P2-03: Novas ações para abas de comentários e anexos
      case 'comments_tab_opened':
        return `Aba de comentários acessada em ${payload.stage_code || 'estágio atual'}`
      case 'attachments_tab_opened':
        return `Aba de anexos acessada em ${payload.stage_code || 'estágio atual'}`
      case 'card_completed':
        return 'Onboarding concluído com sucesso'
      default:
        return 'Ação realizada'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
      <div className="w-full max-w-md bg-background border-l shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Log de Atividades</h3>
            <p className="text-sm text-muted-foreground">{cardTitle}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* P2-03: Métricas e Filtros */}
        <div className="p-4 border-b bg-muted/30">
          {/* Métricas Visuais */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3 border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-600">Total de Ações</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{metrics.total}</div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-gray-600">Hoje</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{metrics.today}</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="space-y-3">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por ação, descrição ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros de Ação e Período */}
            <div className="flex gap-2">
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-white"
              >
                <option value="all">Todas as ações</option>
                <option value="card_created">Criação</option>
                <option value="card_moved">Movimentação</option>
                <option value="task_completed">Tarefas concluídas</option>
                <option value="comments_tab_opened">Comentários</option>
                <option value="attachments_tab_opened">Anexos</option>
              </select>

              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-white"
              >
                <option value="all">Todo período</option>
                <option value="today">Hoje</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mês</option>
              </select>
            </div>
          </div>
        </div>

        {/* P2-03: Gráfico de Atividade */}
        {logs.length > 0 && (
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Atividade por Tipo</span>
            </div>
            <div className="space-y-2">
              {Object.entries(metrics.byType).map(([action, count]) => (
                <div key={action} className="flex items-center justify-between">
                  <span className="text-xs text-blue-700">
                    {actionLabels[action] || action}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(count / metrics.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-blue-800 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {logs.length === 0 
                    ? 'Nenhuma atividade registrada ainda' 
                    : 'Nenhuma atividade encontrada com os filtros aplicados'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* P2-03: Contador de resultados filtrados */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Mostrando {filteredLogs.length} de {logs.length} ações</span>
                  {filteredLogs.length !== logs.length && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedAction('all')
                        setSelectedPeriod('all')
                      }}
                    >
                      Limpar filtros
                    </Button>
                  )}
                </div>

                {/* P2-03: Logs com design refinado */}
                {filteredLogs.map((log) => {
                  const Icon = actionIcons[log.action] || Clock
                  return (
                    <div key={log.id} className="group relative flex items-start space-x-3 p-4 rounded-lg border bg-white hover:shadow-md transition-all duration-200">
                      {/* P2-03: Indicador visual de tipo de ação */}
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-sm text-gray-900">
                            {actionLabels[log.action] || 'Ação realizada'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {formatDate(log.created_at)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                          {getActionDescription(log)}
                        </p>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{log.profiles?.name || 'Usuário'}</span>
                          <span>•</span>
                          <span className="capitalize">{log.action.replace(/_/g, ' ')}</span>
                        </div>
                      </div>

                      {/* P2-03: Indicador de hover */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="w-2 h-2 bg-primary/60 rounded-full" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
