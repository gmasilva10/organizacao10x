"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFeature } from "@/lib/feature-flags"
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  Move, 
  CheckCircle, 
  Circle, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight,
  Clock,
  BarChart3,
  Settings,
  Lock,
  Unlock,
  ListTodo,
  Users,
  Package,
  CheckCircle2,
  CircleDot,
  Hash,
  Settings as SettingsIcon
} from "lucide-react"

// Toast temporário - será implementado depois
const toast = {
  success: (msg: string) => console.log('✅', msg),
  error: (msg: string) => console.error('❌', msg),
  info: (msg: string) => console.log('ℹ️', msg)
}

interface KanbanColumn {
  id: string
  title: string
  position: number
  stage_code?: string
  is_fixed: boolean
  org_id: string
}

interface OnboardingTask {
  id: string
  org_id: string
  stage_code: string
  title: string
  description: string
  is_required: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export default function ServicesPage() {
  // v0.3.1-dev: Feature flags SEMPRE habilitadas
  const { enabled: servicesOnboardingEnabled } = useFeature("features.services.onboarding")

  // DEBUG: Sempre mostrar o módulo, independente de feature flag
  const forceShowServices = true // HARDCODE - SEMPRE TRUE

  // Usar a flag forçada
  const shouldShowServices = forceShowServices || servicesOnboardingEnabled

  const [tab, setTab] = useState<'planos'|'onboarding'|'relacionamento'>('onboarding')
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [tasks, setTasks] = useState<OnboardingTask[]>([])
  const [loading, setLoading] = useState(true)
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null)
  const [editingTask, setEditingTask] = useState<OnboardingTask | null>(null)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [newColumnPosition, setNewColumnPosition] = useState(2)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [columnToDelete, setColumnToDelete] = useState<KanbanColumn | null>(null)
  const [taskDeleteConfirmOpen, setTaskDeleteConfirmOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<OnboardingTask | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedColumnForTasks, setSelectedColumnForTasks] = useState<KanbanColumn | null>(null)
  const [showTaskManager, setShowTaskManager] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskRequired, setNewTaskRequired] = useState(true)
  const [applyToExisting, setApplyToExisting] = useState(false)
  
  // P1-01: Estados para gerenciamento de tarefas
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [newTaskMode, setNewTaskMode] = useState<string | null>(null)
  const [tempTaskData, setTempTaskData] = useState({
    title: '',
    description: '',
    is_required: true
  })
  const [validationErrors, setValidationErrors] = useState<{
    title?: string
    description?: string
  }>({})
  const [isSubmittingTask, setIsSubmittingTask] = useState(false)

  // Carregar colunas do Kanban
  useEffect(() => {
    if (tab === 'onboarding') {
      loadColumns()
    }
  }, [tab])

  // Carregar tarefas quando uma coluna é selecionada
  useEffect(() => {
    if (selectedColumnForTasks) {
      loadTasks(selectedColumnForTasks.stage_code || `stage_${selectedColumnForTasks.position}`)
    }
  }, [selectedColumnForTasks])

  const loadColumns = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/kanban/board')
      if (response.ok) {
        const data = await response.json()
        // Incluir todas as colunas (fixas e intermediárias) e ordenar por posição
        const allColumns = data.columns
          ?.map((col: any) => ({
            id: col.id,
            title: col.title,
            position: col.sort || col.position || 1, // Usar sort ou position
            stage_code: col.stage_code,
            is_fixed: col.is_fixed || false,
            org_id: col.org_id || ''
          }))
          ?.sort((a: any, b: any) => a.position - b.position) || []
        
        setColumns(allColumns)
      }
    } catch (error) {
      console.error('Erro ao carregar colunas:', error)
      toast.error('Erro ao carregar colunas')
    } finally {
      setLoading(false)
    }
  }

  // P1-02: Funções de validação
  const validateTaskData = () => {
    const errors: { title?: string; description?: string } = {}
    
    if (!tempTaskData.title.trim()) {
      errors.title = 'Título da tarefa é obrigatório'
    } else if (tempTaskData.title.trim().length < 3) {
      errors.title = 'Título deve ter pelo menos 3 caracteres'
    } else if (tempTaskData.title.trim().length > 100) {
      errors.title = 'Título deve ter no máximo 100 caracteres'
    }
    
    if (tempTaskData.description.trim().length > 500) {
      errors.description = 'Descrição deve ter no máximo 500 caracteres'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const clearValidationErrors = () => {
    setValidationErrors({})
  }

  const startEditingTask = (task: OnboardingTask) => {
    setEditingTaskId(task.id)
    setTempTaskData({
      title: task.title,
      description: task.description || '',
      is_required: task.is_required
    })
  }

  const cancelEditingTask = () => {
    setEditingTaskId(null)
    setTempTaskData({ title: '', description: '', is_required: true })
  }

  const saveTaskEdit = async (taskId: string) => {
    if (!validateTaskData()) {
      return
    }

    try {
      setIsSubmittingTask(true)
      const response = await fetch(`/api/services/onboarding/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: tempTaskData.title.trim(),
          description: tempTaskData.description.trim(),
          is_required: tempTaskData.is_required,
          apply_to_existing: applyToExisting
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Tarefa atualizada com sucesso! ${result.applied_to_existing ? 'Mudanças aplicadas aos cards existentes.' : ''}`)
        
        // Recarregar todas as tarefas para sincronizar
        await loadAllTasks()
        
        // Log da atualização
        window.dispatchEvent(new CustomEvent('pg:kanban:log', {
          detail: { 
            action: 'task_catalog_updated', 
            task: { id: taskId, title: tempTaskData.title, is_required: tempTaskData.is_required },
            applied_to_existing: applyToExisting
          }
        }))
        
        cancelEditingTask()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar tarefa')
      }
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar tarefa')
    } finally {
      setIsSubmittingTask(false)
    }
  }

  const startNewTask = (columnId: string) => {
    setNewTaskMode(columnId)
    setTempTaskData({ title: '', description: '', is_required: true })
    // P1-02: Focar no primeiro campo automaticamente
    setTimeout(() => {
      const titleInput = document.getElementById('new-task-title')
      if (titleInput) titleInput.focus()
    }, 100)
  }

  const cancelNewTask = () => {
    setNewTaskMode(null)
    setTempTaskData({ title: '', description: '', is_required: true })
  }

  const saveNewTask = async (columnId: string) => {
    if (!validateTaskData()) {
      return
    }

    try {
      setIsSubmitting(true)
      const column = columns.find(col => col.id === columnId)
      if (!column) {
        toast.error('Coluna não encontrada')
        return
      }

      // Preparar dados da tarefa
      const taskData = {
        title: tempTaskData.title.trim(),
        description: tempTaskData.description.trim(),
        is_required: tempTaskData.is_required,
        stage_code: column.stage_code || `stage_${column.position}`,
        order_index: tasks.length + 1
      }

      console.log('🚀 Criando tarefa:', taskData)

      const response = await fetch('/api/services/onboarding/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })

      console.log('📡 Resposta da API:', response.status, response.statusText)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Tarefa criada:', result)
        
        toast.success('Tarefa criada com sucesso!')
        
        // Recarregar tarefas da coluna específica primeiro
        await loadTasks(taskData.stage_code)
        
        // Log da criação
        window.dispatchEvent(new CustomEvent('pg:kanban:log', {
          detail: { 
            action: 'task_catalog_created', 
            task: { title: taskData.title, is_required: taskData.is_required },
            stage_code: taskData.stage_code
          }
        }))
        
        cancelNewTask()
      } else {
        let errorMessage = 'Erro ao criar tarefa'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = `Erro ${response.status}: ${response.statusText}`
        }
        
        console.error('❌ Erro da API:', errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('❌ Erro ao criar tarefa:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar tarefa')
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadTasks = async (stageCode: string) => {
    try {
      console.log('🔄 Carregando tarefas para stage_code:', stageCode)
      
      const response = await fetch(`/api/services/onboarding/tasks?stage_code=${stageCode}`)
      console.log('📡 Resposta da API:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Dados recebidos:', data)
        
        if (data.tasks && Array.isArray(data.tasks)) {
          setTasks(prevTasks => {
            // Filtrar tarefas existentes que não são deste stage_code
            const otherTasks = prevTasks.filter(task => task.stage_code !== stageCode)
            // Adicionar novas tarefas deste stage_code
            const newTasks = [...otherTasks, ...data.tasks]
            console.log('📊 Tarefas atualizadas:', newTasks)
            return newTasks
          })
        } else {
          console.warn('⚠️ API não retornou array de tarefas:', data)
        }
      } else {
        console.error('❌ Erro da API:', response.status, response.statusText)
        let errorMessage = 'Erro ao carregar tarefas'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = `Erro ${response.status}: ${response.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar tarefas:', error)
      toast.error('Erro ao carregar tarefas')
    }
  }

  // P1-02: Carregar todas as tarefas para sincronização
  const loadAllTasks = async () => {
    try {
      // Buscar tarefas de todas as colunas
      const allTasks: OnboardingTask[] = []
      
      for (const column of columns) {
        try {
          const stageCode = column.stage_code || `stage_${column.position}`
          const response = await fetch(`/api/services/onboarding/tasks?stage_code=${stageCode}`)
          if (response.ok) {
            const data = await response.json()
            if (data.tasks && Array.isArray(data.tasks)) {
              allTasks.push(...data.tasks)
            }
          }
        } catch (columnError) {
          console.error(`Erro ao carregar tarefas da coluna ${column.title}:`, columnError)
          // Continua para outras colunas
        }
      }
      
      setTasks(allTasks)
    } catch (error) {
      console.error('Erro ao carregar todas as tarefas:', error)
      toast.error('Erro ao carregar tarefas')
    }
  }

  // Criar nova coluna
  const createColumn = async () => {
    if (!newColumnTitle.trim()) {
      toast.error('Título da coluna é obrigatório')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/kanban/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newColumnTitle.trim(),
          position: newColumnPosition,
          stage_code: `stage_${newColumnPosition}`,
          is_fixed: false
        })
      })

      if (response.ok) {
        toast.success('Coluna criada com sucesso!')
        setNewColumnTitle('')
        setNewColumnPosition(2)
        await loadColumns()
        // Recarregar Kanban em tempo real
        window.dispatchEvent(new Event('pg:kanban:refresh'))
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar coluna')
      }
    } catch (error) {
      console.error('Erro ao criar coluna:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar coluna')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Editar coluna
  const updateColumn = async () => {
    if (!editingColumn || !editingColumn.title.trim()) {
      toast.error('Título da coluna é obrigatório')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/kanban/stages/${editingColumn.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingColumn.title.trim(),
          position: editingColumn.position
        })
      })

      if (response.ok) {
        toast.success('Coluna atualizada com sucesso!')
        setEditingColumn(null)
        await loadColumns()
        // Recarregar Kanban em tempo real
        window.dispatchEvent(new Event('pg:kanban:refresh'))
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar coluna')
      }
    } catch (error) {
      console.error('Erro ao atualizar coluna:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar coluna')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Excluir coluna
  const deleteColumn = async () => {
    if (!columnToDelete) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/kanban/stages/${columnToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Coluna excluída com sucesso!')
        setColumnToDelete(null)
        setDeleteConfirmOpen(false)
        await loadColumns()
        // Recarregar Kanban em tempo real
        window.dispatchEvent(new Event('pg:kanban:refresh'))
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir coluna')
      }
    } catch (error) {
      console.error('Erro ao excluir coluna:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir coluna')
    } finally {
      setIsSubmitting(false)
    }
  }

  // P1-02: Excluir tarefa com melhor integração
  const deleteTask = async () => {
    if (!taskToDelete) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/services/onboarding/tasks/${taskToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Tarefa excluída com sucesso!')
        setTaskToDelete(null)
        setTaskDeleteConfirmOpen(false)
        
        // Recarregar todas as tarefas para sincronizar
        await loadAllTasks()
        
        // Log da exclusão
        window.dispatchEvent(new CustomEvent('pg:kanban:log', {
          detail: { 
            action: 'task_catalog_deleted', 
            task: { id: taskToDelete.id, title: taskToDelete.title },
            stage_code: taskToDelete.stage_code
          }
        }))
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir tarefa')
      }
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir tarefa')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reordenar colunas
  const reorderColumns = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return

    try {
      const newColumns = [...columns]
      const [movedColumn] = newColumns.splice(fromIndex, 1)
      newColumns.splice(toIndex, 0, movedColumn)

      // Atualizar posições
      const updatedColumns = newColumns.map((col, index) => ({
        ...col,
        position: index + 1 // Manter posições sequenciais
      }))

      setColumns(updatedColumns)

      // Atualizar no backend
      await Promise.all(updatedColumns.map(col => 
        fetch(`/api/kanban/stages/${col.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: col.position })
        })
      ))

      toast.success('Ordem das colunas atualizada!')
      // Recarregar Kanban em tempo real
      window.dispatchEvent(new Event('pg:kanban:refresh'))
    } catch (error) {
      console.error('Erro ao reordenar colunas:', error)
      toast.error('Erro ao reordenar colunas')
      await loadColumns() // Reverter mudanças
    }
  }

  // Função helper para obter tarefas de uma coluna
  const getColumnTasks = (column: KanbanColumn) => {
    return tasks.filter(task => task.stage_code === column.stage_code)
  }

  const handleEditColumn = (column: KanbanColumn) => {
    setEditingColumn(column)
    setNewColumnTitle(column.title)
    setNewColumnPosition(column.position)
    setShowColumnEditor(true)
  }

  const [showColumnEditor, setShowColumnEditor] = useState(false)

  const handleSaveColumnChanges = async () => {
    if (!editingColumn) return

    if (!newColumnTitle.trim()) {
      toast.error('Título da coluna é obrigatório')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/kanban/stages/${editingColumn.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newColumnTitle.trim(),
          position: newColumnPosition
        })
      })

      if (response.ok) {
        toast.success('Coluna atualizada com sucesso!')
        setEditingColumn(null)
        setShowColumnEditor(false)
        await loadColumns()
        // Recarregar Kanban em tempo real
        window.dispatchEvent(new Event('pg:kanban:refresh'))
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar coluna')
      }
    } catch (error) {
      console.error('Erro ao atualizar coluna:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar coluna')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteColumn = async (column: KanbanColumn) => {
    try {
      // Verificar se há cards vinculados à coluna
      const response = await fetch(`/api/kanban/columns/${column.id}/cards-count`)
      const data = await response.json()
      
      if (data.count > 0) {
        toast.error(`Não é possível excluir a coluna "${column.title}". Existem ${data.count} card(s) vinculado(s) a ela.`)
        return
      }

      // Confirmar exclusão
      if (!confirm(`Tem certeza que deseja excluir a coluna "${column.title}"? Esta ação não pode ser desfeita.`)) {
        return
      }

      // Excluir coluna
      const deleteResponse = await fetch(`/api/kanban/columns/${column.id}`, {
        method: 'DELETE'
      })

      if (!deleteResponse.ok) {
        throw new Error('Erro ao excluir coluna')
      }

      // Excluir tarefas da coluna
      await fetch(`/api/services/onboarding-tasks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage_code: column.stage_code })
      })

      toast.success(`Coluna "${column.title}" excluída com sucesso!`)
      
      // Atualizar estado local
      setColumns(prev => prev.filter(col => col.id !== column.id))
      setShowColumnEditor(false)
      setEditingColumn(null)
      
    } catch (error) {
      console.error('Erro ao excluir coluna:', error)
      toast.error('Erro ao excluir coluna. Tente novamente.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
          <p className="text-muted-foreground mt-2">
            Estruture seus serviços como Planos, Onboarding e Relacionamento.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={tab==='planos'?'default':'outline'} 
            onClick={()=> setTab('planos')}
          >
            Planos
          </Button>
          <Button 
            variant={tab==='onboarding'?'default':'outline'} 
            onClick={()=> setTab('onboarding')}
          >
            Onboarding
          </Button>
          <Button 
            variant={tab==='relacionamento'?'default':'outline'} 
            onClick={()=> setTab('relacionamento')}
          >
            Relacionamento
          </Button>
        </div>
      </div>

      <div className="rounded-lg border p-6 bg-card">
        {tab==='planos' && (
          <div className="text-sm text-muted-foreground">
            Scaffold de Planos — em construção.
          </div>
        )}
        
        {tab==='onboarding' && (
          <div className="space-y-6">
            {/* P1-01: Header com Botão de Nova Coluna */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Colunas do Kanban</h2>
                <p className="text-sm text-muted-foreground">
                  Gerencie as colunas e tarefas do seu processo de onboarding
                </p>
              </div>
              
              {/* Modal para criar nova coluna */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Coluna
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Coluna</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título da Coluna</Label>
                      <Input
                        id="title"
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        placeholder="Ex: Avaliação Inicial"
                      />
                    </div>
                    <div>
                      <Label htmlFor="position">Posição</Label>
                      <Input
                        id="position"
                        type="number"
                        min="2"
                        max="98"
                        value={newColumnPosition}
                        onChange={(e) => setNewColumnPosition(Number(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Posição entre 2 e 98 (colunas 1 e 99 são fixas)
                      </p>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        onClick={createColumn}
                        disabled={isSubmitting || !newColumnTitle.trim()}
                      >
                        {isSubmitting ? 'Criando...' : 'Criar Coluna'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* P1-01: Layout Premium das Colunas */}
            {!shouldShowServices ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Funcionalidade de Onboarding em Serviços não está disponível.</p>
                <p className="text-sm">Entre em contato com o administrador.</p>
              </div>
            ) : loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Carregando colunas...</p>
              </div>
            ) : columns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma coluna criada ainda.</p>
                <p className="text-sm">Crie a primeira coluna para começar seu processo de onboarding.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {columns.map((column) => {
                  const columnTasks = getColumnTasks(column)
                  const requiredTasks = columnTasks.filter(task => task.is_required)

                  return (
                    <Card key={column.id} className="group hover:shadow-md transition-all duration-200 border-0 shadow-sm">
                      <CardHeader className="pb-2 px-3">
                        <div className="flex items-start justify-between">
                          {/* Indicador de posição */}
                          <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                            <span className="text-xs font-bold text-primary">
                              {column.position}
                            </span>
                          </div>
                          
                          {/* Badge fixa se aplicável */}
                          {column.is_fixed && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary border-primary/20">
                              <Lock className="h-2.5 w-2.5 mr-1" />
                              Fixa
                            </Badge>
                          )}
                        </div>
                        
                        {/* Título da coluna */}
                        <CardTitle className="text-sm font-semibold text-gray-900 mt-1.5">
                          {column.title}
                        </CardTitle>
                        
                        {/* Informações das tarefas */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <ListTodo className="h-3 w-3" />
                            <span className="font-medium">{columnTasks.length} tarefas</span>
                            {requiredTasks.length > 0 && (
                              <span className="text-gray-500">• {requiredTasks.length} obrigatórias</span>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0 px-3 pb-3">
                        {/* Botões de ação */}
                        <div className="flex gap-2">
                          {/* Botão Nova Tarefa */}
                          <Button 
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                            size="sm"
                            onClick={() => {
                              setSelectedColumnForTasks(column)
                              setShowTaskManager(true)
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1.5" />
                            Nova Tarefa
                          </Button>
                          
                          {/* Botão Editar */}
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditColumn(column)}
                          >
                            <Settings className="h-3 w-3 mr-1.5" />
                            Editar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Informações sobre colunas fixas */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium mb-2">Colunas Fixas do Sistema</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-mono">#1</span> - <strong>Novo Aluno</strong>
                  <p className="text-muted-foreground">Coluna inicial, pode ter tarefas mas não pode ser editada</p>
                </div>
                <div>
                  <span className="font-mono">#99</span> - <strong>Entrega do Treino</strong>
                  <p className="text-muted-foreground">Coluna final, pode ter tarefas mas não pode ser editada</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {tab==='relacionamento' && (
          <div className="text-sm text-muted-foreground">
            Scaffold de Relacionamento — em construção.
          </div>
        )}
      </div>

      {/* Modal de confirmação para exclusão de coluna */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Excluir Coluna"
        description={`Tem certeza que deseja excluir a coluna "${columnToDelete?.title}"? Esta ação não pode ser desfeita.`}
        onCancel={() => {
          setDeleteConfirmOpen(false)
          setColumnToDelete(null)
        }}
        onConfirm={deleteColumn}
        confirmText={isSubmitting ? "Excluindo..." : "Excluir"}
        cancelText="Cancelar"
        destructive
      />

      {/* Modal de confirmação para exclusão de tarefa */}
      <ConfirmDialog
        open={taskDeleteConfirmOpen}
        title="Excluir Tarefa"
        description={`Tem certeza que deseja excluir a tarefa "${taskToDelete?.title}"? Esta ação não pode ser desfeita.`}
        onCancel={() => {
          setTaskDeleteConfirmOpen(false)
          setTaskToDelete(null)
        }}
        onConfirm={deleteTask}
        confirmText={isSubmitting ? "Excluindo..." : "Excluir"}
        cancelText="Cancelar"
        destructive
      />

      {/* Modal de Gerenciamento de Tarefas */}
      <Dialog open={showTaskManager} onOpenChange={setShowTaskManager}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                <span className="text-sm font-bold text-primary">
                  #{selectedColumnForTasks?.position}
                </span>
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {selectedColumnForTasks?.title}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Gerenciar tarefas da coluna
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Header das Tarefas */}
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-gray-900">Tarefas da Coluna</h4>
              <Button
                variant="outline"
                size="sm"
                className="bg-white hover:bg-gray-50 border-gray-300"
                onClick={() => startNewTask(selectedColumnForTasks?.id || '')}
              >
                <Plus className="h-3 w-3 mr-2" />
                Nova Tarefa
              </Button>
            </div>

            {/* Formulário Inline para Nova Tarefa */}
            {newTaskMode === selectedColumnForTasks?.id && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="new-task-title" className="text-sm font-medium text-gray-700">Título da Tarefa</Label>
                    <Input
                      id="new-task-title"
                      value={tempTaskData.title}
                      onChange={(e) => setTempTaskData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Digite o título da tarefa"
                      className={`mt-1 h-8 text-sm ${validationErrors.title ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-primary'}`}
                    />
                    {validationErrors.title && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.title}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="new-task-description" className="text-sm font-medium text-gray-700">Descrição (opcional)</Label>
                    <Textarea
                      id="new-task-description"
                      value={tempTaskData.description}
                      onChange={(e) => setTempTaskData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Digite a descrição da tarefa"
                      rows={2}
                      className={`mt-1 text-sm ${validationErrors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-primary'}`}
                    />
                    {validationErrors.description && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="new-task-required"
                      checked={tempTaskData.is_required}
                      onCheckedChange={(checked) => setTempTaskData(prev => ({ ...prev, is_required: checked }))}
                    />
                    <Label htmlFor="new-task-required" className="text-sm font-medium text-gray-700">Tarefa obrigatória</Label>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 h-8 px-3"
                      onClick={() => saveNewTask(selectedColumnForTasks?.id || '')}
                      disabled={isSubmittingTask}
                    >
                      {isSubmittingTask ? 'Salvando...' : 'Salvar Tarefa'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      onClick={cancelNewTask}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Tarefas - Design Compacto */}
            <div className="space-y-2">
              {selectedColumnForTasks && getColumnTasks(selectedColumnForTasks).length === 0 ? (
                <div className="text-center py-6 text-muted-foreground bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <CircleDot className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium text-gray-600 text-sm">Nenhuma tarefa configurada</p>
                  <p className="text-xs text-gray-500">Clique em "Nova Tarefa" para começar</p>
                </div>
              ) : (
                selectedColumnForTasks && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {getColumnTasks(selectedColumnForTasks)
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((task, index) => (
                        <div key={task.id} className={`group relative p-3 hover:bg-gray-50 transition-colors duration-150 ${index !== getColumnTasks(selectedColumnForTasks).length - 1 ? 'border-b border-gray-100' : ''}`}>
                          {editingTaskId === task.id ? (
                            /* Modo de Edição Inline - Compacto */
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor={`edit-task-title-${task.id}`} className="text-sm font-medium text-gray-700">Título</Label>
                                <Input
                                  id={`edit-task-title-${task.id}`}
                                  value={tempTaskData.title}
                                  onChange={(e) => setTempTaskData(prev => ({ ...prev, title: e.target.value }))}
                                  className={`mt-1 h-8 text-sm ${validationErrors.title ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-primary'}`}
                                />
                                {validationErrors.title && (
                                  <p className="text-xs text-red-500 mt-1">{validationErrors.title}</p>
                                )}
                              </div>
                              <div>
                                <Label htmlFor={`edit-task-description-${task.id}`} className="text-sm font-medium text-gray-700">Descrição</Label>
                                <Textarea
                                  id={`edit-task-description-${task.id}`}
                                  value={tempTaskData.description}
                                  onChange={(e) => setTempTaskData(prev => ({ ...prev, description: e.target.value }))}
                                  rows={2}
                                  className={`mt-1 text-sm ${validationErrors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-primary'}`}
                                />
                                {validationErrors.description && (
                                  <p className="text-xs text-red-500 mt-1">{validationErrors.description}</p>
                                )}
                              </div>
                              <div className="flex items-center space-x-3">
                                <Switch
                                  id={`edit-task-required-${task.id}`}
                                  checked={tempTaskData.is_required}
                                  onCheckedChange={(checked) => setTempTaskData(prev => ({ ...prev, is_required: checked }))}
                                />
                                <Label htmlFor={`edit-task-required-${task.id}`} className="text-sm font-medium text-gray-700">Obrigatória</Label>
                              </div>
                              
                              {/* Opção "Aplicar aos cards existentes" */}
                              <div className="flex items-center space-x-3">
                                <Switch
                                  id={`apply-to-existing-${task.id}`}
                                  checked={applyToExisting}
                                  onCheckedChange={setApplyToExisting}
                                />
                                <Label htmlFor={`apply-to-existing-${task.id}`} className="text-sm font-medium text-gray-700">
                                  Aplicar aos cards existentes
                                </Label>
                              </div>
                              
                              <div className="flex gap-2 pt-1">
                                <Button
                                  size="sm"
                                  className="bg-primary hover:bg-primary/90 h-8 px-3"
                                  onClick={() => saveTaskEdit(task.id)}
                                  disabled={isSubmittingTask}
                                >
                                  {isSubmittingTask ? 'Salvando...' : 'Salvar'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3"
                                  onClick={cancelEditingTask}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            /* Modo de Visualização - Design Compacto */
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                {/* Checkbox Visual */}
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                  <Circle className="h-2 w-2 text-gray-400" />
                                </div>
                                
                                {/* Conteúdo da Tarefa */}
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-gray-900 text-sm truncate">{task.title}</h5>
                                  {task.description && (
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{task.description}</p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Badges e Ações */}
                              <div className="flex items-center gap-2">
                                {/* Badge de Obrigatoriedade */}
                                {task.is_required ? (
                                  <Badge variant="destructive" className="text-xs px-2 py-0.5 bg-red-50 text-red-700 border-red-200">
                                    🔴 Obrigatória
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                                    🔵 Opcional
                                  </Badge>
                                )}
                                
                                {/* Número da Ordem */}
                                <Badge variant="outline" className="text-xs px-2 py-0.5 text-gray-600 border-gray-300">
                                  #{task.order_index}
                                </Badge>
                                
                                {/* Ações (só visíveis no hover) */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-gray-100"
                                    onClick={() => startEditingTask(task)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                                    onClick={() => {
                                      setTaskToDelete(task)
                                      setTaskDeleteConfirmOpen(true)
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Coluna */}
      <Dialog open={showColumnEditor} onOpenChange={setShowColumnEditor}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Coluna</DialogTitle>
            <DialogDescription>
              Modifique as propriedades da coluna ou exclua-a se necessário.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Título da coluna */}
            <div className="space-y-2">
              <Label htmlFor="column-title">Título da Coluna</Label>
              <Input
                id="column-title"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Digite o título da coluna"
              />
            </div>
            
            {/* Posição da coluna */}
            <div className="space-y-2">
              <Label htmlFor="column-position">Posição</Label>
              <Input
                id="column-position"
                type="number"
                value={newColumnPosition}
                onChange={(e) => setNewColumnPosition(Number(e.target.value))}
                min="1"
                max="99"
              />
            </div>
            
            {/* Botões de ação */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveColumnChanges}
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => editingColumn && handleDeleteColumn(editingColumn)}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Coluna
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
