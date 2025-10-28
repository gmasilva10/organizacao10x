"use client"

import { useState, useEffect } from 'react'
import { X, Edit, Move, User, CheckCircle2, MessageSquare, Paperclip, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { KanbanChecklist } from './KanbanChecklist'
import { KanbanLogDrawer } from './KanbanLogDrawer'
import { useToast } from '@/components/ui/toast'

interface Card {
  id: string
  title: string
  studentId: string
  status?: 'onboarding' | 'active' | 'paused'
  studentPhone?: string
}

interface Column {
  id: string
  title: string
  stageCode?: string
}

interface KanbanCardEditorProps {
  card: Card
  column: Column
  isOpen: boolean
  onClose: () => void
  onMove: (cardId: string, fromColumnId: string, toColumnId: string) => Promise<void>
  onComplete: (cardId: string) => Promise<void>
  updateCardProgress?: (cardId: string, taskId: string, newStatus: string) => void
}

type EditorTab = 'overview' | 'checklist' | 'comments' | 'attachments'

export function KanbanCardEditor({ 
  card, 
  column, 
  isOpen, 
  onClose, 
  onMove, 
  onComplete, 
  updateCardProgress 
}: KanbanCardEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('checklist')
  const { success: toastSuccess, error: toastError } = useToast()

  // P2-02: Função para registrar logs de auditoria das abas
  const logTabOpen = async (tabName: string) => {
    try {
      await fetch(`/api/kanban/logs/${card.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: `${tabName}_tab_opened`,
          payload: {
            tab_name: tabName,
            card_title: card.title,
            stage_code: column.stageCode || 'unknown'
          }
        })
      })
    } catch (error) {
      console.warn('Erro ao registrar log da aba:', error)
    }
  }

  // P2-02: Handler para mudança de aba com logging
  const handleTabChange = (tabName: EditorTab) => {
    setActiveTab(tabName)
    
    // Registrar log apenas para comentários e anexos (novas funcionalidades)
    if (tabName === 'comments' || tabName === 'attachments') {
      logTabOpen(tabName)
    }
  }
  const [logsDrawerOpen, setLogsDrawerOpen] = useState(false)
  const [advanceConfirmOpen, setAdvanceConfirmOpen] = useState(false)
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false)
  const [canAdvance, setCanAdvance] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [checklistData, setChecklistData] = useState<any>(null)

  // Verificar se pode avançar (100% obrigatórias concluídas)
  useEffect(() => {
    if (isOpen && activeTab === 'checklist') {
      checkCanAdvance()
    }
  }, [isOpen, activeTab])

  // Recalcular canAdvance quando checklistData muda
  useEffect(() => {
    if (checklistData) {
      const requiredTasks = checklistData.tasks?.filter((task: any) => task.task?.is_required) || []
      const completedRequired = requiredTasks.filter((task: any) => task.status === 'completed')
      
      // Regra: apenas tarefas obrigatórias bloqueiam avanço
      // Se não há tarefas obrigatórias (requiredTasks.length === 0), pode avançar
      // Se há tarefas obrigatórias, todas devem estar concluídas
      const canAdvanceNow = requiredTasks.length === 0 || completedRequired.length === requiredTasks.length
      setCanAdvance(canAdvanceNow)
    }
  }, [checklistData])

  const checkCanAdvance = async () => {
    try {
      // Buscar tarefas do card
      const response = await fetch(`/api/kanban/items/${card.id}/tasks`)
      if (response.ok) {
        const data = await response.json()
        setChecklistData(data)
      } else {
        console.error('Erro ao buscar tarefas do card:', response.status)
        setChecklistData(null)
        setCanAdvance(false)
      }
    } catch (error) {
      console.error('Erro ao verificar tarefas:', error)
      setChecklistData(null)
      setCanAdvance(false)
    }
  }

  // Callback para atualizar checklist após toggle de tarefa
  const handleTaskToggle = async (catalogTaskId: string, status: string) => {
    try {
      const response = await fetch(`/api/kanban/items/${card.id}/tasks/${catalogTaskId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar tarefa')
      }
      
      // Optimistic update: atualizar estado local imediatamente
      if (checklistData) {
        const updatedTasks = checklistData.tasks.map((task: any) => 
          task.task_id === catalogTaskId 
            ? { ...task, status, completed_at: status === 'completed' ? new Date().toISOString() : undefined }
            : task
        )
        setChecklistData({ ...checklistData, tasks: updatedTasks })
      }
      
      // Atualizar o progresso do card após toggle bem-sucedido
      if (updateCardProgress) {
        updateCardProgress(card.id, catalogTaskId, status)
      }
    } catch (error) {
      console.error('Erro:', error)
      // Reverter optimistic update em caso de erro
      checkCanAdvance()
      throw error
    }
  }

  // Hotkey: E para abrir checklist, L para logs
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'e') {
        e.preventDefault()
        setActiveTab('checklist')
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault()
        setLogsDrawerOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleAdvance = async () => {
    setIsAdvancing(true)
    try {
      // Buscar próxima coluna disponível
      const nextColumn = await findNextColumn()
      if (!nextColumn) {
        throw new Error('Não foi possível encontrar a próxima coluna')
      }

      // Chamar onMove para próxima coluna
      await onMove(card.id, column.id, nextColumn.id)
      
      setAdvanceConfirmOpen(false)
      onClose()
      
      toastSuccess(`Card avançado com sucesso: Este card foi movido para ${nextColumn.title}.`)
    } catch (error) {
      console.error('Erro ao avançar:', error)
      toastError(error instanceof Error ? error.message : "Não foi possível avançar o card.")
    } finally {
      setIsAdvancing(false)
    }
  }

  const findNextColumn = async (): Promise<{ id: string; title: string } | null> => {
    try {
      // Buscar colunas ordenadas por posição
      const response = await fetch('/api/kanban/board')
      if (response.ok) {
        const data = await response.json()
        const columns = data.columns || []
        
        // Encontrar coluna atual
        const currentIndex = columns.findIndex((col: any) => col.id === column.id)
        if (currentIndex === -1) return null
        
        // Próxima coluna (pular colunas fixas se necessário)
        for (let i = currentIndex + 1; i < columns.length; i++) {
          const nextCol = columns[i]
          // Pular colunas fixas (posição 1 e 99)
          if (nextCol.position !== 1 && nextCol.position !== 99) {
            return { id: nextCol.id, title: nextCol.title }
          }
        }
      }
      return null
    } catch (error) {
      console.error('Erro ao buscar próxima coluna:', error)
      return null
    }
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      // Chamar endpoint para encerrar onboarding
      const response = await fetch('/api/kanban/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao encerrar onboarding')
      }

      const result = await response.json()
      console.log('✅ [DEBUG] Resposta da API:', result)

      // Chamar callback do parent
      await onComplete(card.id)
      
      setCompleteConfirmOpen(false)
      onClose()
      
      toastSuccess("Onboarding encerrado com sucesso: O card foi movido para histórico e o onboarding foi finalizado.")
    } catch (error) {
      console.error('Erro ao encerrar:', error)
      toastError(error instanceof Error ? error.message : "Não foi possível encerrar o onboarding.")
    } finally {
      setIsCompleting(false)
    }
  }

  const isLastColumn = column.stageCode === 'entrega_treino' || 
                      column.title.toLowerCase().includes('entrega') ||
                      column.title.toLowerCase().includes('delivery') ||
                      column.title.toLowerCase().includes('final')
  
  // DEBUG: Log para identificar problema do botão
  console.log('🔍 [DEBUG] KanbanCardEditor - Botão Encerrar:', {
    cardId: card.id,
    columnTitle: column.title,
    stageCode: column.stageCode,
    isLastColumn,
    canAdvance,
    columnFullData: column,
    conditions: {
      stageCodeMatch: column.stageCode === 'entrega_treino',
      titleContainsEntrega: column.title.toLowerCase().includes('entrega'),
      titleContainsDelivery: column.title.toLowerCase().includes('delivery'),
      titleContainsFinal: column.title.toLowerCase().includes('final')
    },
    allConditions: [
      column.stageCode === 'entrega_treino',
      column.title.toLowerCase().includes('entrega'),
      column.title.toLowerCase().includes('delivery'),
      column.title.toLowerCase().includes('final')
    ]
  })

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] p-0 flex flex-col overflow-hidden [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-lg">{card.title}</span>
                  <Badge variant={card.status === 'active' ? 'default' : card.status === 'paused' ? 'secondary' : 'outline'}>
                    {card.status || 'onboarding'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Coluna: {column.title}
                </div>
              </div>
              
              {/* Botão de Fechar */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              Gerencie o processo de onboarding do aluno {card.title}
            </DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('overview')}
            >
              Visão Geral
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'checklist'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('checklist')}
            >
              Checklist
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'comments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('comments')}
            >
              Comentários
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'attachments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleTabChange('attachments')}
            >
              Anexos
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Informações do Aluno</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nome</label>
                      <p className="text-sm">{card.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <p className="text-sm">{card.status || 'onboarding'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Responsável</label>
                      <p className="text-sm text-muted-foreground">Não atribuído</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Data de Início</label>
                      <p className="text-sm text-muted-foreground">Em breve</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Ações</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Atribuir
                    </Button>
                    <Button variant="outline" size="sm">
                      <Move className="h-4 w-4 mr-2" />
                      Mover
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setLogsDrawerOpen(true)}>
                      <Clock className="h-4 w-4 mr-2" />
                      Ver Log
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'checklist' && (
              <div>
                <KanbanChecklist
                  cardId={card.id}
                  stageCode={column.stageCode || 'novo_aluno'}
                  onTaskToggle={handleTaskToggle}
                />
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-6">
                {/* P2-02: Header da aba Comentários */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Comentários</h3>
                      <p className="text-sm text-gray-600">Comunicação e feedback sobre o aluno</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Em breve
                  </Badge>
                </div>

                {/* P2-02: Placeholder de comentários existentes */}
                <div className="space-y-4">
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <h4 className="text-sm font-medium text-gray-600 mb-1">Nenhum comentário ainda</h4>
                    <p className="text-xs text-gray-500">Os comentários aparecerão aqui quando implementados</p>
                  </div>
                </div>

                {/* P2-02: Campo de input preparado para comentários */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Adicionar comentário</span>
                  </div>
                  <div className="relative">
                    <textarea
                      placeholder="Digite seu comentário sobre o progresso do aluno..."
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      rows={3}
                      disabled
                    />
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="outline" className="text-xs bg-gray-50">
                        Em desenvolvimento
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled
                      className="gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Comentar
                    </Button>
                  </div>
                </div>

                {/* P2-02: Informações sobre funcionalidade futura */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 mb-1">Funcionalidade em desenvolvimento</h4>
                      <p className="text-xs text-blue-700">
                        Em breve você poderá adicionar comentários, marcar usuários com @, e receber notificações de respostas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className="space-y-6">
                {/* P2-02: Header da aba Anexos */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Paperclip className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Anexos</h3>
                      <p className="text-sm text-gray-600">Documentos e arquivos relacionados ao aluno</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Em breve
                  </Badge>
                </div>

                {/* P2-02: Placeholder de anexos existentes */}
                <div className="space-y-4">
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <Paperclip className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <h4 className="text-sm font-medium text-gray-600 mb-1">Nenhum anexo ainda</h4>
                    <p className="text-xs text-gray-500">Os anexos aparecerão aqui quando implementados</p>
                  </div>
                </div>

                {/* P2-02: Botão de adicionar anexo preparado */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Adicionar anexo</span>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-gray-300 transition-colors duration-200">
                    <Paperclip className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                    <h4 className="text-sm font-medium text-gray-600 mb-1">Arraste arquivos aqui</h4>
                    <p className="text-xs text-gray-500 mb-4">ou clique para selecionar</p>
                    
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled
                        className="gap-2"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Selecionar Arquivo
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled
                        className="gap-2" 
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        </svg>
                        Pasta
                      </Button>
                    </div>
                  </div>
                </div>

                {/* P2-02: Informações sobre funcionalidade futura */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-green-800 mb-1">Funcionalidade em desenvolvimento</h4>
                      <p className="text-xs text-green-700">
                        Em breve você poderá fazer upload de arquivos, organizar por categorias, e compartilhar documentos com a equipe.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t pt-4 px-6 pb-6">
            <div className="text-sm text-muted-foreground">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">E</kbd> Checklist • 
              <kbd className="px-2 py-1 bg-muted rounded text-xs ml-2">L</kbd> Log • 
              <kbd className="px-2 py-1 bg-muted rounded text-xs ml-2">Esc</kbd> Fechar
            </div>
            
            <div className="flex gap-2">
              {/* Botão Editar Aluno */}
              <Button 
                variant="outline"
                onClick={() => window.open(`/app/students/${card.studentId}/edit`, '_blank')}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar Aluno
              </Button>

              {/* Botão Excluir Card */}
              <Button
                variant="outline"
                className="gap-2"
                onClick={async () => {
                  const ok = window.confirm('Excluir este card? Esta ação não pode ser desfeita.')
                  if (!ok) return
                  try {
                    const res = await fetch(`/api/kanban/items/${card.id}`, { method: 'DELETE' })
                    if (!res.ok) {
                      const msg = (await res.json().catch(()=>({error:'Erro'}))).error || 'Erro ao excluir card'
                      throw new Error(msg)
                    }
                    onClose()
                    // Dispara evento de atualização do board
                    window.dispatchEvent(new CustomEvent('kanban:invalidateCache'))
                  } catch (e) {
                    console.error(e)
                  }
                }}
              >
                <X className="h-4 w-4" />
                Excluir
              </Button>
              
              {!isLastColumn && (
                <Button 
                  onClick={() => setAdvanceConfirmOpen(true)}
                  disabled={!canAdvance || isAdvancing}
                  className="gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  {isAdvancing ? "Avançando..." : "Avançar Etapa"}
                </Button>
              )}
              
              {isLastColumn && (
                <Button 
                  onClick={() => setCompleteConfirmOpen(true)}
                  disabled={!canAdvance}
                  variant="destructive"
                  className="gap-2 bg-red-600 hover:bg-red-700 text-white font-medium"
                  data-testid="encerrar-onboarding-button"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Encerrar
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modais de Confirmação */}
      <ConfirmDialog
        open={advanceConfirmOpen}
        onOpenChange={setAdvanceConfirmOpen}
        title="Avançar para próxima etapa"
        description="Tarefas concluídas. Deseja avançar para a próxima etapa?"
        onCancel={() => setAdvanceConfirmOpen(false)}
        onConfirm={handleAdvance}
        confirmText={isAdvancing ? "Avançando..." : "Avançar"}
        cancelText="Cancelar"
      />

      <ConfirmDialog
        open={completeConfirmOpen}
        onOpenChange={setCompleteConfirmOpen}
        title="Encerrar onboarding"
        description="Treino entregue. Deseja encerrar o onboarding e enviar para o Histórico?"
        onCancel={() => setCompleteConfirmOpen(false)}
        onConfirm={handleComplete}
        confirmText={isCompleting ? "Encerrando..." : "Encerrar"}
        cancelText="Manter aqui"
        variant="destructive"
      />

      {/* Log Drawer */}
      <KanbanLogDrawer
        isOpen={logsDrawerOpen}
        onClose={() => setLogsDrawerOpen(false)}
        cardId={card.id}
        cardTitle={card.title}
      />
    </>
  )
}
