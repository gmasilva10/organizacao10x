"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/toast"
import { Plus, Lock, Edit, List, Trash2, Check, ChevronDown, ChevronUp, X, ArrowLeft } from "lucide-react"

type Column = {
  id: string
  title: string
  position: number
  is_fixed: boolean
  stage_code: string
  templates: Template[]
}

type Template = {
  id: string
  title: string
  description: string
  is_required: boolean
  order_index: number
  task_code: string
  sla_hours: number | null
}

export default function ServicesOnboardPage() {
  const [columns, setColumns] = useState<Column[]>([])
  const [loading, setLoading] = useState(true)
  const [newTemplateModal, setNewTemplateModal] = useState<{ open: boolean; column: Column | null }>({ open: false, column: null })
  const [editColumnModal, setEditColumnModal] = useState<{ open: boolean; column: Column | null }>({ open: false, column: null })
  const [newColumnModal, setNewColumnModal] = useState<{ open: boolean }>({ open: false })
  const [manageTemplatesModal, setManageTemplatesModal] = useState<{ open: boolean; column: Column | null }>({ open: false, column: null })
  const [viewMode, setViewMode] = useState<'default' | 'compact'>('default')
  const { success, error } = useToast()

  useEffect(() => {
    loadBoard()
    
    // Carregar preferência de visualização do localStorage
    const savedViewMode = localStorage.getItem('servicesOnboard.view') as 'default' | 'compact' | null
    if (savedViewMode && ['default', 'compact'].includes(savedViewMode)) {
      setViewMode(savedViewMode)
    }
  }, [])

  // Persistir preferência quando mudar
  useEffect(() => {
    localStorage.setItem('servicesOnboard.view', viewMode)
  }, [viewMode])

  async function loadBoard() {
    setLoading(true)
    try {
      // Carregar colunas do Kanban
      const boardResponse = await fetch('/api/kanban/board', { cache: 'no-store' })
      const boardData = await boardResponse.json()
      
      if (boardData.columns) {
        const cols: Column[] = await Promise.all(
          boardData.columns.map(async (col: any) => {
            // Carregar templates para cada coluna
            const templatesResponse = await fetch(`/api/services/onboarding/tasks?stage_code=${col.stage_code}`, { cache: 'no-store' })
            const templatesData = await templatesResponse.json()
            
            return {
              id: col.id,
              title: col.title,
              position: col.sort || 0,
              is_fixed: col.is_fixed || ["Novo Aluno", "Entrega do Treino"].includes(col.title),
              stage_code: col.stage_code,
              templates: templatesData.tasks || []
            }
          })
        )

        // Ordenar colunas por posição
        cols.sort((a, b) => a.position - b.position)
        setColumns(cols)
      }
    } catch (err) {
      console.error('Erro ao carregar board:', err)
      error('Erro ao carregar dados do onboarding')
    } finally {
      setLoading(false)
    }
  }

  async function createNewTemplate(templateData: any) {
    if (!newTemplateModal.column) return

    try {
      const response = await fetch('/api/services/onboarding/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...templateData,
          stage_code: newTemplateModal.column.stage_code
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao criar template')
      }

      const result = await response.json()
      
      // Disparar evento para invalidar cache do Kanban
      if (result.invalidateCache) {
        window.dispatchEvent(new CustomEvent('kanban:invalidateCache', {
          detail: { reason: 'template_created', stageCode: newTemplateModal.column.stage_code }
        }))
      }
      
      success('Tarefa padrão criada com sucesso!')
      setNewTemplateModal({ open: false, column: null })
      loadBoard()
    } catch (err) {
      console.error('Erro ao criar template:', err)
      error('Erro ao criar tarefa padrão')
    }
  }

  async function deleteTemplate(templateId: string) {
    try {
      const response = await fetch(`/api/services/onboarding/tasks/${templateId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir template')
      }

      const result = await response.json()
      
      // Disparar evento para invalidar cache do Kanban
      if (result.invalidateCache) {
        window.dispatchEvent(new CustomEvent('kanban:invalidateCache', {
          detail: { reason: 'template_deleted', templateId }
        }))
      }

      success('Tarefa padrão excluída com sucesso!')
      loadBoard()
    } catch (err) {
      console.error('Erro ao excluir template:', err)
      error('Erro ao excluir tarefa padrão')
    }
  }

  async function createNewColumn(columnData: any) {
    try {
      // Se não foi especificada posição, calcular automaticamente
      let finalData = { ...columnData }
      
      if (!finalData.position) {
        // Buscar a última posição antes da coluna #99
        const lastColumn = columns
          .filter(col => col.position < 99)
          .sort((a, b) => b.position - a.position)[0]
        
        finalData.position = lastColumn ? lastColumn.position + 1 : 2
      }

      // Garantir que a posição seja < 99
      if (finalData.position >= 99) {
        finalData.position = 98
      }

      const response = await fetch('/api/kanban/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: finalData.name,
          position: finalData.position,
          stage_code: `stage_${finalData.position}`,
          is_fixed: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao criar coluna')
      }

      success('Coluna criada com sucesso!')
      setNewColumnModal({ open: false })
      loadBoard()
    } catch (err) {
      console.error('Erro ao criar coluna:', err)
      error(err instanceof Error ? err.message : 'Erro ao criar coluna')
    }
  }

  async function updateTemplate(templateId: string, updates: any) {
    try {
      const response = await fetch(`/api/services/onboarding/tasks/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar template')
      }

      const result = await response.json()
      
      // Disparar evento para invalidar cache do Kanban
      if (result.invalidateCache) {
        window.dispatchEvent(new CustomEvent('kanban:invalidateCache', {
          detail: { reason: 'template_updated', templateId }
        }))
      }

      success('Template atualizado com sucesso!')
      loadBoard()
    } catch (err) {
      console.error('Erro ao atualizar template:', err)
      error('Erro ao atualizar template')
    }
  }

  async function reorderTemplates(columnId: string, templates: Template[]) {
    try {
      // Atualizar order_index de cada template
      const updates = templates.map((template, index) => ({
        id: template.id,
        order_index: index + 1
      }))

      // Fazer requisições em paralelo
      await Promise.all(
        updates.map(update => 
          fetch(`/api/services/onboarding/tasks/${update.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index: update.order_index })
          })
        )
      )

      success('Ordem das tarefas atualizada!')
      loadBoard()
    } catch (err) {
      console.error('Erro ao reordenar templates:', err)
      error('Erro ao reordenar tarefas')
    }
  }

  async function updateColumn(columnId: string, newTitle: string) {
    try {
      const response = await fetch(`/api/kanban/stages/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar coluna')
      }

      success('Coluna atualizada com sucesso!')
      setEditColumnModal({ open: false, column: null })
      loadBoard()
    } catch (err) {
      console.error('Erro ao atualizar coluna:', err)
      error('Erro ao atualizar coluna')
    }
  }

  async function deleteColumn(columnId: string) {
    try {
      const res = await fetch(`/api/kanban/stages/${columnId}`, { method: 'DELETE' })
      if (!res.ok) {
        const msg = res.status === 403 ? 'Coluna fixa não pode ser excluída' : (res.status === 422 ? 'Coluna não vazia ou sem coluna padrão' : 'Erro ao excluir coluna')
        throw new Error(msg)
      }
      success('Coluna excluída com sucesso!')
      loadBoard()
    } catch (err:any) {
      console.error('Erro ao excluir coluna:', err)
      error(err?.message || 'Erro ao excluir coluna')
    }
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/app/services" className="hover:underline">Serviços</Link>
          <span>/</span>
          <span className="text-foreground">Onboarding</span>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando onboarding...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/app/services" className="hover:underline">Serviços</Link>
        <span>/</span>
        <span className="text-foreground">Onboarding</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Onboarding</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as tarefas padrão de cada coluna do Kanban
        </p>
      </div>

      {/* Toolbar Fixa */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="h-8"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={() => setNewColumnModal({ open: true })}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Coluna
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Modo compacto</span>
            <Switch
              checked={viewMode === 'compact'}
              onCheckedChange={(checked: boolean) => setViewMode(checked ? 'compact' : 'default')}
            />
          </div>
        </div>
      </div>

      {/* Columns Container com Scroll Horizontal */}
      <div className="overflow-x-auto scroll-smooth scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        <div className="flex gap-3 pb-4" style={{ minWidth: 'max-content' }}>
        {columns.map((column) => (
          <Card key={column.id} className={`h-fit ${viewMode === 'compact' ? 'w-48' : 'w-64'} flex-shrink-0`}>
            <CardHeader className={`pb-2 px-3 ${viewMode === 'compact' ? 'space-y-2' : ''}`}>
              {viewMode === 'compact' ? (
                // Layout compacto - otimizado para evitar estouro
                <>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <CardTitle className="text-xs font-medium truncate max-w-[120px]">
                        {column.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => setEditColumnModal({ open: true, column })}
                        title={column.is_fixed ? "Renomear coluna" : "Editar coluna"}
                      >
                        <Edit className="h-2.5 w-2.5" />
                      </Button>
                      {!column.is_fixed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 ml-1 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteColumn(column.id)}
                          title="Excluir coluna"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="h-px bg-muted/50 my-2" />
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <List className="h-2.5 w-2.5" />
                        {column.templates.length}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => setNewTemplateModal({ open: true, column })}
                        title="Nova Tarefa"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 ml-1"
                        onClick={() => setManageTemplatesModal({ open: true, column })}
                        title="Gerenciar"
                      >
                        <Edit className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                // Layout padrão - original
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-medium">
                        {column.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setEditColumnModal({ open: true, column })}
                        title={column.is_fixed ? "Renomear coluna" : "Editar coluna"}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {!column.is_fixed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-1 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteColumn(column.id)}
                          title="Excluir coluna"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="h-px bg-muted/50 my-2" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <List className="h-3 w-3" />
                      {column.templates.length} {column.templates.length === 1 ? 'tarefa' : 'tarefas'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setNewTemplateModal({ open: true, column })}
                        title="Nova Tarefa"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-1"
                        onClick={() => setManageTemplatesModal({ open: true, column })}
                        title="Gerenciar"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardHeader>
            {/* Separador entre header e conteúdo da coluna */}
            <div className="mx-3 h-px bg-muted/60" />
            {viewMode === 'default' && (
            <CardContent className="pt-0 px-3">
            {/* Templates List */}
            {/* removido separador extra */}
              <div className="space-y-1 mb-4">
                {column.templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-2 bg-muted/50 rounded-lg border mb-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-xs">{template.title}</div>
                        {template.sla_hours && (
                          <div className="text-xs text-muted-foreground mt-1">
                            SLA: {template.sla_hours}h
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {column.templates.length === 0 && (
                  <div className="p-2 text-center text-muted-foreground text-xs">
                    Nenhuma tarefa padrão ainda
                  </div>
                )}
              </div>
            </CardContent>
            )}
          </Card>
        ))}
        </div>
      </div>

      {/* New Template Modal */}
      <Dialog open={newTemplateModal.open} onOpenChange={(open: boolean) => !open && setNewTemplateModal({ open: false, column: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
            <DialogDescription>
              Criar uma nova tarefa padrão para a coluna {newTemplateModal.column?.title}
            </DialogDescription>
          </DialogHeader>
          {newTemplateModal.column && (
            <NewTemplateForm
              column={newTemplateModal.column}
              onSave={createNewTemplate}
              onCancel={() => setNewTemplateModal({ open: false, column: null })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Templates Modal */}
      <Dialog open={manageTemplatesModal.open} onOpenChange={(open: boolean) => !open && setManageTemplatesModal({ open: false, column: null })}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Tarefas da Coluna</DialogTitle>
            {manageTemplatesModal.column && (
              <DialogDescription>
                {manageTemplatesModal.column.title} (#{manageTemplatesModal.column.position})
              </DialogDescription>
            )}
          </DialogHeader>
          {manageTemplatesModal.column && (
            <ManageTemplatesForm
              column={manageTemplatesModal.column}
              onUpdate={updateTemplate}
              onDelete={deleteTemplate}
              onReorder={reorderTemplates}
              onCancel={() => setManageTemplatesModal({ open: false, column: null })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* New Column Modal */}
      <Dialog open={newColumnModal.open} onOpenChange={(open: boolean) => !open && setNewColumnModal({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Coluna</DialogTitle>
            <DialogDescription>
              Adicionar uma nova coluna ao quadro de onboarding
            </DialogDescription>
          </DialogHeader>
          <NewColumnForm
            onSave={createNewColumn}
            onCancel={() => setNewColumnModal({ open: false })}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Column Modal */}
      <Dialog open={editColumnModal.open} onOpenChange={(open: boolean) => !open && setEditColumnModal({ open: false, column: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Coluna</DialogTitle>
            <DialogDescription>
              Editar o nome da coluna {editColumnModal.column?.title}
            </DialogDescription>
          </DialogHeader>
          {editColumnModal.column && (
            <EditColumnForm
              column={editColumnModal.column}
              onSave={(newTitle) => updateColumn(editColumnModal.column!.id, newTitle)}
              onCancel={() => setEditColumnModal({ open: false, column: null })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ManageTemplatesForm({ 
  column, 
  onUpdate, 
  onDelete, 
  onReorder, 
  onCancel 
}: { 
  column: Column
  onUpdate: (id: string, updates: any) => void
  onDelete: (id: string) => void
  onReorder: (columnId: string, templates: Template[]) => void
  onCancel: () => void 
}) {
  const [templates, setTemplates] = useState<Template[]>(column.templates)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEdit = (template: Template) => {
    setEditingId(template.id)
    setEditTitle(template.title)
  }

  const handleSave = (templateId: string) => {
    if (!editTitle.trim()) return
    
    onUpdate(templateId, { title: editTitle.trim() })
    setEditingId(null)
    setEditTitle('')
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const handleToggleRequired = (templateId: string, currentValue: boolean) => {
    onUpdate(templateId, { is_required: !currentValue })
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    
    const newTemplates = [...templates]
    const temp = newTemplates[index]
    newTemplates[index] = newTemplates[index - 1]
    newTemplates[index - 1] = temp
    
    setTemplates(newTemplates)
    onReorder(column.id, newTemplates)
  }

  const handleMoveDown = (index: number) => {
    if (index === templates.length - 1) return
    
    const newTemplates = [...templates]
    const temp = newTemplates[index]
    newTemplates[index] = newTemplates[index + 1]
    newTemplates[index + 1] = temp
    
    setTemplates(newTemplates)
    onReorder(column.id, newTemplates)
  }

  return (
    <div className="space-y-4">
      {/* Templates Table */}
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Ordem</th>
                <th className="text-left p-3 font-medium">Nome</th>
                <th className="text-left p-3 font-medium">SLA</th>
                <th className="text-left p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template, index) => (
                <tr key={template.id} className="border-t">
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        #{template.order_index}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === templates.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="p-3">
                    {editingId === template.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-8"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave(template.id)
                            if (e.key === 'Escape') handleCancel()
                          }}
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleSave(template.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={handleCancel}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="cursor-pointer hover:bg-muted/50 p-1 rounded"
                        onClick={() => handleEdit(template)}
                      >
                        {template.title}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={template.sla_hours || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : null
                          onUpdate(template.id, { sla_hours: value })
                        }}
                        placeholder="Ex: 48"
                        className="w-20 h-8"
                      />
                      <span className="text-xs text-muted-foreground">h</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(template.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma tarefa padrão nesta coluna
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Fechar
        </Button>
      </DialogFooter>
    </div>
  )
}

function NewColumnForm({ onSave, onCancel }: { onSave: (data: any) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [position, setPosition] = useState<number | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    onSave({
      name: name.trim(),
      position: position || null
    })
  }

  return (
    <div className="space-y-6">
      {/* Seção Principal */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
          📝 Informações da Coluna
        </h3>
        <div className="border rounded-lg p-4 space-y-4">
          <div>
            <Label htmlFor="name" className="mb-2 block">Nome da Coluna *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Avaliação Física"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="position" className="mb-2 block">Posição (opcional)</Label>
            <Input
              id="position"
              type="number"
              value={position || ''}
              onChange={(e) => setPosition(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Ex: 5"
              min="2"
              max="98"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se não especificado, será alocada automaticamente antes da coluna #99 (Entrega do Treino)
            </p>
          </div>
        </div>
      </div>

      {/* Informações Contextuais */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
          ℹ️ Regras
        </h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• A coluna será criada como não-fixa e poderá ser editada/reordenada</p>
          <p>• Colunas #1 (Novo Aluno) e #99 (Entrega do Treino) são fixas e não podem ser alteradas</p>
          <p>• Posição deve estar entre 2 e 98</p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" onClick={handleSubmit} disabled={!name.trim()}>
          Criar Coluna
        </Button>
      </DialogFooter>
    </div>
  )
}

function NewTemplateForm({ column, onSave, onCancel }: { column: Column; onSave: (data: any) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [isRequired, setIsRequired] = useState(true)
  const [hasSla, setHasSla] = useState(false)
  const [slaHours, setSlaHours] = useState<number | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    
    onSave({
      title: title.trim(),
      description: '', // Removido campo description
      is_required: isRequired,
      sla_hours: hasSla ? slaHours : null
    })
  }

  return (
    <div className="space-y-6">
      {/* Seção Principal */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
          📝 Informações Básicas
        </h3>
        <div className="border rounded-lg p-4 space-y-4">
          <div>
            <Label htmlFor="title" className="mb-2 block">Título da Tarefa *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Preencher ficha de anamnese"
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isRequired"
              checked={isRequired}
              onCheckedChange={(checked: boolean) => setIsRequired(checked)}
            />
            <Label htmlFor="isRequired">Tarefa obrigatória</Label>
          </div>
        </div>
      </div>

      {/* Seção SLA */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
          ⏱️ SLA (Service Level Agreement)
        </h3>
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="hasSla"
              checked={hasSla}
              onCheckedChange={(checked: boolean) => setHasSla(checked)}
            />
            <Label htmlFor="hasSla">Definir SLA</Label>
          </div>
          {hasSla && (
            <div>
              <Label htmlFor="slaHours" className="mb-2 block">Prazo (horas) *</Label>
              <Input
                id="slaHours"
                type="number"
                min="1"
                value={slaHours || ''}
                onChange={(e) => setSlaHours(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Ex: 48"
              />
            </div>
          )}
        </div>
      </div>

      {/* Informações Contextuais */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
          ℹ️ Informações
        </h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Coluna:</strong> {column.title} (#{column.position})</p>
          <p>A tarefa será adicionada automaticamente aos novos alunos nesta coluna.</p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" onClick={handleSubmit} disabled={!title.trim() || (hasSla && !slaHours)}>
          Criar Tarefa
        </Button>
      </DialogFooter>
    </div>
  )
}

function EditColumnForm({ column, onSave, onCancel }: { column: Column; onSave: (title: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(column.title)

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Nome da Coluna *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Avaliação Física"
          required
        />
      </div>

      <div className="text-sm text-muted-foreground">
        {column.is_fixed ? (
          <div className="space-y-1">
            <p><strong>Coluna fixa:</strong> Apenas o nome pode ser alterado.</p>
            <p>A posição (#{column.position}) não pode ser modificada.</p>
          </div>
        ) : (
          <p>Alterar o nome da coluna não afeta as tarefas existentes.</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(title)} disabled={!title.trim()}>
          {column.is_fixed ? 'Renomear' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}
