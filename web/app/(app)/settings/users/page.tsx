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
  Search, 
  Link as LinkIcon, 
  Unlink, 
  User,
  Loader2
} from "lucide-react"

type UserRow = { 
  user_id: string
  email: string | null
  status: string
  last_login_at: string | null
  roles?: string[]
  linked_collaborator?: {
    id: string
    full_name: string
  } | null
}

type Collaborator = {
  id: string
  full_name: string
  email?: string | null
  role: string
  status: string
  user_id?: string | null
}

export default function SettingsUsersPage() {
  const { success, error } = useToast()
  
  const [items, setItems] = useState<UserRow[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingCollaborators, setLoadingCollaborators] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [linking, setLinking] = useState<string | null>(null)
  const [roleCode, setRoleCode] = useState("viewer")
  
  // Estado dos modais
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const resp = await fetch(`/api/settings/users`, { cache: "no-store" })
        const json = await resp.json()
        if (!cancelled && resp.ok) setItems(json.items || [])
      } catch {}
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Carregar colaboradores para o modal de vínculo
  const loadCollaborators = async () => {
    setLoadingCollaborators(true)
    try {
      const resp = await fetch("/api/collaborators?status=active", { cache: "no-store" })
      const json = await resp.json()
      if (resp.ok && json?.ok) {
        setCollaborators(json.items || [])
      }
    } catch {
      error("Erro ao carregar colaboradores.")
    } finally {
      setLoadingCollaborators(false)
    }
  }

  // Recarregar usuários
  const reloadUsers = async () => {
    try {
      const resp = await fetch(`/api/settings/users`, { cache: "no-store" })
      const json = await resp.json()
      if (resp.ok) setItems(json.items || [])
    } catch {}
  }

  // Vincular usuário a colaborador
  const handleLink = async () => {
    if (!selectedUser || !selectedCollaboratorId) return

    setLinking(selectedUser.user_id)
    try {
      const resp = await fetch(`/api/settings/users/${selectedUser.user_id}/link-collaborator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaborator_id: selectedCollaboratorId })
      })

      const json = await resp.json()
      
      if (resp.ok && json?.ok) {
        success("Usuário vinculado ao colaborador com sucesso!")
        setLinkModalOpen(false)
        setSelectedUser(null)
        setSelectedCollaboratorId("")
        reloadUsers()
      } else if (json?.code === "collaborator_already_linked") {
        error("Colaborador já está vinculado a outro usuário.")
      } else if (json?.code === "user_already_linked") {
        error(`Usuário já está vinculado ao colaborador: ${json.details?.current_collaborator}`)
      } else {
        error("Erro ao vincular usuário ao colaborador.")
      }
    } catch {
      error("Erro ao vincular usuário ao colaborador.")
    } finally {
      setLinking(null)
    }
  }

  // Desvincular usuário de colaborador
  const handleUnlink = async (user: UserRow) => {
    if (!user.linked_collaborator) return

    setLinking(user.user_id)
    try {
      const resp = await fetch(`/api/settings/users/${user.user_id}/link-collaborator`, {
        method: "DELETE"
      })

      const json = await resp.json()
      
      if (resp.ok && json?.ok) {
        success("Vínculo removido com sucesso!")
        reloadUsers()
      } else {
        error("Erro ao remover vínculo.")
      }
    } catch {
      error("Erro ao remover vínculo.")
    } finally {
      setLinking(null)
    }
  }

  // Abrir modal de vínculo
  const openLinkModal = (user: UserRow) => {
    setSelectedUser(user)
    setSelectedCollaboratorId("")
    setLinkModalOpen(true)
    loadCollaborators()
  }

  const filtered = items.filter((x) => !q || (x.email || '').toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="container mx-auto px-4 py-8">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md">Pular para o conteúdo</a>
      
      <header className="mb-8">
        <nav className="mb-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href="/app" className="underline">Dashboard</Link></li>
            <li aria-hidden> / </li>
            <li><Link href="/app/settings" className="underline">Configurações</Link></li>
            <li aria-hidden> / </li>
            <li aria-current="page">Usuários</li>
          </ol>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
        <p className="text-muted-foreground mt-1">Gerencie usuários, papéis e vínculos com colaboradores.</p>
      </header>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>
      </div>

      <div id="main-content" className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Colaborador vinculado</th>
                <th className="text-left p-4 font-medium">Papéis</th>
                <th className="text-left p-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-4">
                      <div className="h-4 bg-muted rounded w-48 animate-pulse" />
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                    </td>
                    <td className="p-4">
                      <div className="h-8 bg-muted rounded w-32 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-muted-foreground">
                    {q ? "Nenhum usuário encontrado com esse email." : "Nenhum usuário encontrado."}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.user_id} className="border-b hover:bg-muted/30">
                    <td className="p-4 font-medium">{item.email || "—"}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {item.linked_collaborator ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{item.linked_collaborator.full_name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {(item.roles || []).map((role) => (
                          <span key={role} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Assign Role */}
                        <div className="flex items-center gap-1">
                          <select 
                            value={roleCode} 
                            onChange={(e) => setRoleCode(e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="trainer">Trainer</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <Button 
                            size="sm" 
                            onClick={() => {
                              console.log("[QA] assign_role clicked", { user_id: item.user_id, role: roleCode })
                              setAssigning(item.user_id)
                              // Simular delay
                              setTimeout(() => setAssigning(null), 1000)
                            }}
                            disabled={assigning === item.user_id}
                          >
                            {assigning === item.user_id ? "..." : "Atribuir"}
                          </Button>
                        </div>

                        {/* Link/Unlink Collaborator */}
                        <div className="flex items-center gap-1">
                          {item.linked_collaborator ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUnlink(item)}
                              disabled={linking === item.user_id}
                              className="text-red-600 hover:text-red-700"
                            >
                              {linking === item.user_id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Unlink className="h-3 w-3" />
                              )}
                              Desvincular
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openLinkModal(item)}
                              disabled={linking === item.user_id}
                            >
                              <LinkIcon className="h-3 w-3" />
                              Vincular
                            </Button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Vínculo */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Usuário a Colaborador</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>Usuário</Label>
                <div className="p-2 bg-muted rounded text-sm">
                  {selectedUser.email}
                </div>
              </div>

              <div>
                <Label htmlFor="collaborator-select">Colaborador</Label>
                <Select value={selectedCollaboratorId} onValueChange={setSelectedCollaboratorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um colaborador..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCollaborators ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : collaborators.length === 0 ? (
                      <SelectItem value="empty" disabled>Nenhum colaborador ativo encontrado</SelectItem>
                    ) : (
                      collaborators
                        .filter(c => !c.user_id) // Apenas não vinculados
                        .map((collaborator) => (
                          <SelectItem key={collaborator.id} value={collaborator.id}>
                            <div className="flex items-center gap-2">
                              <span>{collaborator.full_name}</span>
                              <span className="text-xs text-muted-foreground">({collaborator.role})</span>
                            </div>
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setLinkModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleLink}
                  disabled={!selectedCollaboratorId || linking === selectedUser.user_id}
                >
                  {linking === selectedUser.user_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Vincular"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}