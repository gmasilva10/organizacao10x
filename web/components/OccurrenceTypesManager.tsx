"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

interface OccurrenceGroup {
  id: number
  name: string
  description?: string
  is_active: boolean
}

interface OccurrenceType {
  id: number
  name: string
  description?: string
  applies_to: 'student'|'professional'|'both'
  is_active: boolean
  group_id: number
  occurrence_groups: OccurrenceGroup
  created_at: string
  updated_at: string
}

export function OccurrenceTypesManager() {
  // Toast functions using sonner
  const showSuccess = (message: string) => toast.success(message)
  const showError = (message: string) => toast.error(message)
  const [types, setTypes] = useState<OccurrenceType[]>([])
  const [groups, setGroups] = useState<OccurrenceGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingType, setEditingType] = useState<OccurrenceType | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<OccurrenceType | null>(null)

  // Filtros
  const [appliesTo, setAppliesTo] = useState<'all'|'student'|'professional'|'both'>('all')
  const [statusFilter, setStatusFilter] = useState<'active'|'inactive'|'all'>('active')
  const [query, setQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState<'all'|number>('all')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group_id: '',
    applies_to: 'student' as 'student'|'professional'|'both',
    is_active: true
  })

  useEffect(() => {
    loadData()
    function onGroupsRefresh() { loadData() }
    window.addEventListener('pg:occurrence:groups:refresh', onGroupsRefresh)
    return () => window.removeEventListener('pg:occurrence:groups:refresh', onGroupsRefresh)
  }, [appliesTo, statusFilter, query, groupFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (appliesTo !== 'all') params.set('applies_to', appliesTo)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (query) params.set('query', query)
      if (groupFilter !== 'all') params.set('group_id', String(groupFilter))
      
      const [typesResponse, groupsResponse] = await Promise.all([
        fetch(`/api/occurrence-types?${params.toString()}`),
        fetch('/api/occurrence-groups')
      ])

      if (!typesResponse.ok) throw new Error('Erro ao carregar tipos')
      if (!groupsResponse.ok) throw new Error('Erro ao carregar grupos')

      const [typesData, groupsData] = await Promise.all([
        typesResponse.json(),
        groupsResponse.json()
      ])

      setTypes(Array.isArray(typesData?.types) ? typesData.types : [])
      setGroups(Array.isArray(groupsData?.groups) ? groupsData.groups : [])
    } catch (err) {
      showError('Erro ao carregar dados')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.group_id) return

    try {
      setSaving(true)
      const url = editingType 
        ? `/api/occurrence-types/${editingType.id}`
        : '/api/occurrence-types'
      
      const method = editingType ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          group_id: parseInt(formData.group_id)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar tipo')
      }

      showSuccess(editingType ? 'Tipo atualizado com sucesso!' : 'Tipo criado com sucesso!')
      setIsModalOpen(false)
      setFormData({ name: '', description: '', group_id: '', applies_to: 'student', is_active: true })
      setEditingType(null)
      loadData()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erro ao salvar tipo')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (type: OccurrenceType) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      description: type.description || '',
      group_id: type.group_id.toString(),
      applies_to: type.applies_to,
      is_active: type.is_active
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (type: OccurrenceType) => {
    try {
      const response = await fetch(`/api/occurrence-types/${type.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir tipo')
      }

      showSuccess('Tipo excluído com sucesso!')
      loadData()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erro ao excluir tipo')
      console.error(err)
    }
  }

  const openCreateModal = () => {
    setEditingType(null)
    setFormData({ name: '', description: '', group_id: '', applies_to: 'student', is_active: true })
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Tipos de Ocorrências</h2>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <Input placeholder="Buscar tipos..." value={query} onChange={(e)=>setQuery(e.target.value)} className="w-64" />
        <select value={groupFilter} onChange={(e)=>setGroupFilter(e.target.value==='all' ? 'all' : Number(e.target.value))} className="rounded-md border px-2 py-2 text-sm">
          <option value="all">Todos os grupos</option>
          {groups.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
        </select>
        <select value={appliesTo} onChange={(e)=>setAppliesTo(e.target.value as any)} className="rounded-md border px-2 py-2 text-sm">
          <option value="all">Todos</option>
          <option value="student">Aluno</option>
          <option value="professional">Profissional</option>
          <option value="both">Ambos</option>
        </select>
        <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value as any)} className="rounded-md border px-2 py-2 text-sm">
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="all">Todos</option>
        </select>
      </div>

      {types.length === 0 ? (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Nenhum tipo cadastrado
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Cadastre seu primeiro tipo de ocorrência para começar
          </p>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Cadastrar Tipo
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Aplicabilidade</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {type.occurrence_groups.name}
                    </span>
                  </TableCell>
                  <TableCell>{type.applies_to === 'student' ? 'Aluno' : type.applies_to === 'professional' ? 'Profissional' : 'Ambos'}</TableCell>
                  <TableCell>
                    {type.description ? (
                      <span className="text-sm text-muted-foreground">
                        {type.description}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        Sem descrição
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      type.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {type.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(type)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteConfirm(type)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de Criação/Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Editar Tipo' : 'Novo Tipo de Ocorrência'}
            </DialogTitle>
            <DialogDescription>
              {editingType
                ? 'Atualize as informações do tipo de ocorrência'
                : 'Crie um novo tipo de ocorrência dentro de um grupo'
              }
            </DialogDescription>
          </DialogHeader>

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="group_id">Grupo *</Label>
                <Select value={formData.group_id} onValueChange={(value: string) => setFormData({ ...formData, group_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.filter(group => group.is_active).map(group => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Aplicabilidade *</Label>
                <Select value={formData.applies_to} onValueChange={(value: string)=>setFormData({ ...formData, applies_to: value as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Aluno</SelectItem>
                    <SelectItem value="professional">Profissional</SelectItem>
                    <SelectItem value="both">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Lesão muscular, Falta, Pagamento pendente..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva quando este tipo de ocorrência deve ser usado..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Tipo ativo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </form>
          </div>

          {/* Rodapé Sticky */}
          <div className="border-t bg-background p-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                editingType ? 'Atualizar' : 'Criar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Delete */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o tipo "{deleteConfirm?.name}"?
              Esta ação não pode ser desfeita e pode afetar ocorrências já registradas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  handleDelete(deleteConfirm)
                  setDeleteConfirm(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
