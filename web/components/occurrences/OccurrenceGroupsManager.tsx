"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, Edit, Trash2, Search, Filter } from "lucide-react"
import { toast } from "sonner"

interface OccurrenceGroup {
  id: number
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  types_count?: number
}

export function OccurrenceGroupsManager() {
  const [groups, setGroups] = useState<OccurrenceGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<OccurrenceGroup | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true
  })

  useEffect(() => {
    fetchGroups()
  }, [])

  async function fetchGroups() {
    try {
      setLoading(true)
      const res = await fetch('/api/occurrence-groups')
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groups || [])
      } else {
        toast.error('Erro ao carregar grupos')
      }
    } catch (error) {
      toast.error('Erro ao carregar grupos')
    } finally {
      setLoading(false)
    }
  }

  function handleCreate() {
    setEditingGroup(null)
    setFormData({ name: "", description: "", is_active: true })
    setIsDialogOpen(true)
  }

  function handleEdit(group: OccurrenceGroup) {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description || "",
      is_active: group.is_active
    })
    setIsDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    try {
      setSaving(true)
      const url = editingGroup ? `/api/occurrence-groups/${editingGroup.id}` : '/api/occurrence-groups'
      const method = editingGroup ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success(editingGroup ? 'Grupo atualizado com sucesso' : 'Grupo criado com sucesso')
        setIsDialogOpen(false)
        fetchGroups()
      } else {
        const error = await res.json()
        toast.error(error?.error || 'Erro ao salvar grupo', {
          description: error?.details || 'Verifique os dados e tente novamente'
        })
      }
    } catch (error) {
      toast.error('Erro ao salvar grupo')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(group: OccurrenceGroup) {
    if (!confirm(`Tem certeza que deseja excluir o grupo "${group.name}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/occurrence-groups/${group.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Grupo excluído com sucesso')
        fetchGroups()
      } else {
        const error = await res.json()
        toast.error(error?.error || 'Erro ao excluir grupo')
      }
    } catch (error) {
      toast.error('Erro ao excluir grupo')
    }
  }

  async function handleToggleStatus(group: OccurrenceGroup) {
    try {
      const res = await fetch(`/api/occurrence-groups/${group.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !group.is_active })
      })

      if (res.ok) {
        toast.success(`Grupo ${!group.is_active ? 'ativado' : 'desativado'} com sucesso`)
        fetchGroups()
      } else {
        const error = await res.json()
        toast.error(error?.error || 'Erro ao alterar status do grupo')
      }
    } catch (error) {
      toast.error('Erro ao alterar status do grupo')
    }
  }

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && group.is_active) ||
                         (statusFilter === "inactive" && !group.is_active)
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros e Ações */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar grupos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? 'Editar Grupo' : 'Novo Grupo'}
              </DialogTitle>
              <DialogDescription>
                {editingGroup ? 'Atualize as informações do grupo' : 'Crie um novo grupo de ocorrências'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Comportamento"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição opcional do grupo"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Grupo ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingGroup ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de Grupos */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tipos</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm || statusFilter !== "all" 
                      ? "Nenhum grupo encontrado com os filtros aplicados"
                      : "Nenhum grupo criado ainda"
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {group.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={group.is_active ? "default" : "secondary"}>
                        {group.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {group.types_count || 0} tipos
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(group.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(group)}
                          title={group.is_active ? "Desativar" : "Ativar"}
                        >
                          {group.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(group)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(group)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
