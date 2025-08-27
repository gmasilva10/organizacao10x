"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toast"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Users, 
  Mail, 
  Phone, 
  Edit2, 
  Power,
  PowerOff,
  Loader2
} from "lucide-react"

type Collaborator = {
  id: string
  org_id: string
  full_name: string
  email?: string | null
  phone?: string | null
  role: string
  status: string
  user_id?: string | null
  created_at: string
  updated_at: string
}

type CreateFormData = {
  full_name: string
  email: string
  phone: string
  role: string
  status: string
}

export default function TeamPage() {
  const { success, error } = useToast()
  
  // Estado da lista
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  
  // Estado dos modais
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null)
  
  // Estado dos formulários
  const [createForm, setCreateForm] = useState<CreateFormData>({
    full_name: "",
    email: "",
    phone: "",
    role: "trainer",
    status: "active"
  })
  const [editForm, setEditForm] = useState<Partial<CreateFormData>>({})
  
  // Estados de loading
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  // Carregar colaboradores
  const loadCollaborators = async () => {
    try {
      const searchParams = new URLSearchParams()
      if (query) searchParams.set("query", query)
      if (statusFilter) searchParams.set("status", statusFilter)
      if (roleFilter) searchParams.set("role", roleFilter)
      
      const resp = await fetch(`/api/collaborators?${searchParams}`, { cache: "no-store" })
      const json = await resp.json()
      
      if (resp.ok && json?.ok) {
        setCollaborators(json.items || [])
      } else {
        error("Erro ao carregar colaboradores.")
      }
    } catch {
      error("Erro ao carregar colaboradores.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCollaborators()
  }, [query, statusFilter, roleFilter])

  // Criar colaborador
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (createForm.full_name.trim().length < 2) {
      error("Nome deve ter pelo menos 2 caracteres.")
      return
    }

    setCreating(true)
    try {
      const resp = await fetch("/api/collaborators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: createForm.full_name.trim(),
          email: createForm.email.trim() || null,
          phone: createForm.phone.trim() || null,
          role: createForm.role,
          status: createForm.status
        })
      })

      const json = await resp.json()
      
      if (resp.ok && json?.ok) {
        success("Colaborador criado com sucesso!")
        setCreateModalOpen(false)
        setCreateForm({
          full_name: "",
          email: "",
          phone: "",
          role: "trainer",
          status: "active"
        })
        loadCollaborators()
      } else if (json?.code === "limit_reached") {
        error(`Limite atingido: máximo ${json.details.max} colaboradores ativos no plano ${json.details.plan.toUpperCase()}.`)
      } else if (json?.code === "validation_error") {
        error(json.details?.message || "Dados inválidos.")
      } else {
        error("Erro ao criar colaborador.")
      }
    } catch {
      error("Erro ao criar colaborador.")
    } finally {
      setCreating(false)
    }
  }

  // Editar colaborador
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCollaborator) return

    setUpdating(true)
    try {
      const resp = await fetch(`/api/collaborators/${editingCollaborator.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      })

      const json = await resp.json()
      
      if (resp.ok && json?.ok) {
        success("Colaborador atualizado com sucesso!")
        setEditModalOpen(false)
        setEditingCollaborator(null)
        setEditForm({})
        loadCollaborators()
      } else if (json?.code === "validation_error") {
        error(json.details?.message || "Dados inválidos.")
      } else {
        error("Erro ao atualizar colaborador.")
      }
    } catch {
      error("Erro ao atualizar colaborador.")
    } finally {
      setUpdating(false)
    }
  }

  // Toggle status
  const handleToggle = async (collaborator: Collaborator) => {
    setToggling(collaborator.id)
    try {
      const resp = await fetch(`/api/collaborators/${collaborator.id}/toggle`, {
        method: "PATCH"
      })

      const json = await resp.json()
      
      if (resp.ok && json?.ok) {
        const action = json.action === "activated" ? "ativado" : "desativado"
        success(`Colaborador ${action} com sucesso!`)
        loadCollaborators()
      } else if (json?.code === "limit_reached") {
        error(`Limite atingido: máximo ${json.details.max} colaboradores ativos no plano ${json.details.plan.toUpperCase()}.`)
      } else {
        error("Erro ao alterar status do colaborador.")
      }
    } catch {
      error("Erro ao alterar status do colaborador.")
    } finally {
      setToggling(null)
    }
  }

  // Abrir modal de edição
  const openEditModal = (collaborator: Collaborator) => {
    setEditingCollaborator(collaborator)
    setEditForm({
      full_name: collaborator.full_name,
      email: collaborator.email || "",
      phone: collaborator.phone || "",
      role: collaborator.role,
      status: collaborator.status
    })
    setEditModalOpen(true)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md">Pular para o conteúdo</a>
      
      <header className="mb-8">
        <nav className="mb-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href="/app" className="underline">Dashboard</Link></li>
            <li aria-hidden> / </li>
            <li aria-current="page">Equipe</li>
          </ol>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight">Equipe</h1>
        <p className="text-muted-foreground mt-1">Gerencie os colaboradores da sua organização.</p>
      </header>

      <div id="main-content" className="space-y-6">
        {/* Filtros e Novo */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="trainer">Trainer</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Colaborador</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="create-name">Nome completo *</Label>
                  <Input
                    id="create-name"
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="João Silva"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="joao@exemplo.com"
                  />
                </div>

                <div>
                  <Label htmlFor="create-phone">Telefone</Label>
                  <Input
                    id="create-phone"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+5511999999999"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-role">Papel</Label>
                    <Select value={createForm.role} onValueChange={(value) => setCreateForm(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="trainer">Trainer</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="create-status">Status</Label>
                    <Select value={createForm.status} onValueChange={(value) => setCreateForm(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Colaboradores */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-8 bg-muted rounded w-16 animate-pulse" />
                  <div className="h-8 bg-muted rounded w-16 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : collaborators.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Nenhum colaborador encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {query || statusFilter || roleFilter 
                ? "Tente ajustar os filtros de busca." 
                : "Comece adicionando seu primeiro colaborador."}
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Colaborador
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collaborators.map((collaborator) => (
              <div 
                key={collaborator.id} 
                className={`border rounded-lg p-4 space-y-3 transition-opacity ${
                  collaborator.status === "inactive" ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium">{collaborator.full_name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        collaborator.role === "admin" ? "bg-red-100 text-red-700" :
                        collaborator.role === "manager" ? "bg-blue-100 text-blue-700" :
                        collaborator.role === "trainer" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {collaborator.role}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        collaborator.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {collaborator.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  {collaborator.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{collaborator.email}</span>
                    </div>
                  )}
                  {collaborator.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span>{collaborator.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => openEditModal(collaborator)}
                    className="flex items-center gap-1"
                  >
                    <Edit2 className="h-3 w-3" />
                    Editar
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleToggle(collaborator)}
                    disabled={toggling === collaborator.id}
                    className={`flex items-center gap-1 ${
                      collaborator.status === "active" 
                        ? "text-red-600 hover:text-red-700" 
                        : "text-green-600 hover:text-green-700"
                    }`}
                  >
                    {toggling === collaborator.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : collaborator.status === "active" ? (
                      <PowerOff className="h-3 w-3" />
                    ) : (
                      <Power className="h-3 w-3" />
                    )}
                    {collaborator.status === "active" ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Edição */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Colaborador</DialogTitle>
            </DialogHeader>
            {editingCollaborator && (
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Nome completo</Label>
                  <Input
                    id="edit-name"
                    value={editForm.full_name || ""}
                    onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="João Silva"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email || ""}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="joao@exemplo.com"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input
                    id="edit-phone"
                    value={editForm.phone || ""}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+5511999999999"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-role">Papel</Label>
                    <Select value={editForm.role || ""} onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="trainer">Trainer</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select value={editForm.status || ""} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updating}>
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
