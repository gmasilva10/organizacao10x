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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Edit, Trash2, Search, Filter } from "lucide-react"
import { toast } from "sonner"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"

interface OccurrenceGroup {
  id: number
  name: string
  is_active: boolean
}

interface OccurrenceType {
  id: number
  name: string
  description: string | null
  group_id: number
  group_name: string
  applies_to: "student" | "professional" | "both"
  is_active: boolean
  created_at: string
  updated_at: string
}

export function OccurrenceTypesManager() {
  const [types, setTypes] = useState<OccurrenceType[]>([])
  const [groups, setGroups] = useState<OccurrenceGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [groupFilter, setGroupFilter] = useState<"all" | string>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<OccurrenceType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    group_id: "",
    applies_to: "both" as "student" | "professional" | "both",
    is_active: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [typesRes, groupsRes] = await Promise.all([
        fetch('/api/occurrence-types'),
        fetch('/api/occurrence-groups')
      ])

      if (typesRes.ok && groupsRes.ok) {
        const [typesData, groupsData] = await Promise.all([
          typesRes.json(),
          groupsRes.json()
        ])
        setTypes(typesData.types || [])
        setGroups(groupsData.groups || [])
      } else {
        toast.error('Erro ao carregar dados')
      }
    } catch (error) {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  function handleCreate() {
    setEditingType(null)
    setFormData({ 
      name: "", 
      description: "", 
      group_id: "", 
      applies_to: "both", 
      is_active: true 
    })
    setIsDialogOpen(true)
  }

  function handleEdit(type: OccurrenceType) {
    setEditingType(type)
    setFormData({
      name: type.name,
      description: type.description || "",
      group_id: type.group_id.toString(),
      applies_to: type.applies_to,
      is_active: type.is_active
    })
    setIsDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (!formData.group_id) {
      toast.error('Grupo é obrigatório')
      return
    }

    try {
      setSaving(true)
      const url = editingType ? `/api/occurrence-types/${editingType.id}` : '/api/occurrence-types'
      const method = editingType ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          group_id: parseInt(formData.group_id)
        })
      })

      if (res.ok) {
        toast.success(editingType ? 'Tipo atualizado com sucesso' : 'Tipo criado com sucesso')
        setIsDialogOpen(false)
        fetchData()
      } else {
        const error = await res.json()
        toast.error(error?.error || 'Erro ao salvar tipo', {
          description: error?.details || 'Verifique os dados e tente novamente'
        })
      }
    } catch (error) {
      toast.error('Erro ao salvar tipo')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(type: OccurrenceType) {
    const { confirm, ConfirmDialog } = useConfirmDialog()
    
    confirm({
      title: "Excluir Tipo de Ocorrência",
      description: `Tem certeza que deseja excluir o tipo "${type.name}"? Esta ação não pode ser desfeita.`,
      confirmText: "Sim, excluir",
      cancelText: "Cancelar",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/occurrence-types/${type.id}`, {
            method: 'DELETE'
          })

          if (res.ok) {
            toast.success('Tipo excluído com sucesso')
            fetchData()
          } else {
            const error = await res.json()
            toast.error(error?.error || 'Erro ao excluir tipo')
          }
        } catch (error) {
          toast.error('Erro ao excluir tipo')
        }
      }
    })
  }

  async function handleToggleStatus(type: OccurrenceType) {
    try {
      const res = await fetch(`/api/occurrence-types/${type.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !type.is_active })
      })

      if (res.ok) {
        toast.success(`Tipo ${!type.is_active ? 'ativado' : 'desativado'} com sucesso`)
        fetchData()
      } else {
        const error = await res.json()
        toast.error(error?.error || 'Erro ao alterar status do tipo')
      }
    } catch (error) {
      toast.error('Erro ao alterar status do tipo')
    }
  }

  const filteredTypes = types.filter(type => {
    const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesGroup = groupFilter === "all" || type.group_id.toString() === groupFilter
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && type.is_active) ||
                         (statusFilter === "inactive" && !type.is_active)
    
    return matchesSearch && matchesGroup && matchesStatus
  })

  const activeGroups = groups.filter(g => g.is_active)

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
              placeholder="Buscar tipos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os grupos</SelectItem>
                {activeGroups.map(group => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button onClick={handleCreate} disabled={activeGroups.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Tipo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Editar Tipo' : 'Novo Tipo'}
              </DialogTitle>
              <DialogDescription>
                {editingType ? 'Atualize as informações do tipo' : 'Crie um novo tipo de ocorrência'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Falta"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição opcional do tipo"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="group_id">Grupo *</Label>
                <Select value={formData.group_id} onValueChange={(value) => setFormData(prev => ({ ...prev, group_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeGroups.map(group => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="applies_to">Aplica-se a *</Label>
                <Select value={formData.applies_to} onValueChange={(value: "student" | "professional" | "both") => setFormData(prev => ({ ...prev, applies_to: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Apenas Alunos</SelectItem>
                    <SelectItem value="professional">Apenas Profissionais</SelectItem>
                    <SelectItem value="both">Alunos e Profissionais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Tipo ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingType ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de Tipos */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Aplica-se a</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm || groupFilter !== "all" || statusFilter !== "all"
                      ? "Nenhum tipo encontrado com os filtros aplicados"
                      : activeGroups.length === 0
                      ? "Crie primeiro um grupo de ocorrências"
                      : "Nenhum tipo criado ainda"
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{type.group_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {type.applies_to === "student" ? "Alunos" :
                         type.applies_to === "professional" ? "Profissionais" : "Ambos"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={type.is_active ? "default" : "secondary"}>
                        {type.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(type.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(type)}
                          title={type.is_active ? "Desativar" : "Ativar"}
                        >
                          {type.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(type)}
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

      <ConfirmDialog />
    </div>
  )
}
