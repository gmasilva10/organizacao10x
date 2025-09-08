"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  created_at: string
  updated_at: string
}

interface GroupTypesModalProps {
  open: boolean
  group: OccurrenceGroup
  onClose: () => void
}

function GroupTypesModal({ open, group, onClose }: GroupTypesModalProps) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Array<{ id:number; name:string; description?:string; applies_to:'student'|'professional'|'both'; is_active:boolean; updated_at?:string }>>([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'active'|'inactive'|'all'>('active')
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<null | { id?: number; name: string; description?: string; applies_to: 'student'|'professional'|'both'; is_active: boolean }>(null)

  useEffect(() => {
    if (!open) return
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ group_id: String(group.id) })
        const res = await fetch(`/api/occurrence-types?${params.toString()}`)
        const data = await res.json()
        setItems(Array.isArray(data) ? data : [])
      } finally { setLoading(false) }
    })()
  }, [open, group?.id])

  const filtered = items.filter(t => {
    if (status !== 'all' && t.is_active !== (status==='active')) return false
    if (q && !(t.name.toLowerCase().includes(q.toLowerCase()) || (t.description||'').toLowerCase().includes(q.toLowerCase()))) return false
    return true
  })

  return (
    <Dialog open={open} onOpenChange={(v)=>{ if(!v) onClose() }}>
      <DialogContent className="flex max-h-[90vh] w-[900px] max-w-[90vw] flex-col">
        <DialogHeader>
          <DialogTitle>Tipos do Grupo: {group.name}</DialogTitle>
          <DialogDescription>Gerencie os tipos vinculados a este grupo</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input placeholder="Buscar tipos..." value={q} onChange={(e)=>setQ(e.target.value)} className="w-64" />
          <select value={status} onChange={(e)=>setStatus(e.target.value as any)} className="rounded-md border px-2 py-2 text-sm">
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
            <option value="all">Todos</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto rounded-md border">
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Nenhum tipo encontrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Aplicabilidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atualizado em</TableHead>
                  <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.applies_to === 'student' ? 'Aluno' : t.applies_to === 'professional' ? 'Profissional' : 'Ambos'}</TableCell>
                    <TableCell>{t.is_active ? 'Ativo' : 'Inativo'}</TableCell>
                    <TableCell>{t.updated_at ? new Date(t.updated_at).toLocaleString() : '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={()=>setEditing({ id:t.id, name:t.name, description:t.description, applies_to:t.applies_to, is_active:t.is_active })}>Editar</Button>
                        <Button variant="outline" size="sm" onClick={async()=>{
                          setSaving(true)
                          try{
                            await fetch(`/api/occurrence-types/${t.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ is_active: !t.is_active }) })
                            const params = new URLSearchParams({ group_id: String(group.id) })
                            const res = await fetch(`/api/occurrence-types?${params.toString()}`)
                            const data = await res.json(); setItems(Array.isArray(data)?data:[])
                          } finally { setSaving(false) }
                        }}>{t.is_active?'Desativar':'Ativar'}</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="border-t bg-background p-4 flex justify-between gap-2">
          <Button onClick={()=>setEditing({ name:'', description:'', applies_to:'student', is_active:true })} className="" variant="secondary">+ Criar Tipo</Button>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>

        {/* Formulário criar/editar tipo */}
        {editing && (
          <div className="rounded-md border p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Input placeholder="Nome" value={editing.name} onChange={(e)=>setEditing({ ...editing, name:e.target.value })} />
              <select value={editing.applies_to} onChange={(e)=>setEditing({ ...editing, applies_to: e.target.value as any })} className="rounded-md border px-2 py-2 text-sm">
                <option value="student">Aluno</option>
                <option value="professional">Profissional</option>
                <option value="both">Ambos</option>
              </select>
              <select value={editing.is_active? '1':'0'} onChange={(e)=>setEditing({ ...editing, is_active: e.target.value==='1' })} className="rounded-md border px-2 py-2 text-sm">
                <option value="1">Ativo</option>
                <option value="0">Inativo</option>
              </select>
            </div>
            <Textarea placeholder="Descrição (opcional)" value={editing.description||''} onChange={(e)=>setEditing({ ...editing, description:e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setEditing(null)}>Cancelar</Button>
              <Button onClick={async()=>{
                if (!editing.name.trim()) { toast.error('Nome é obrigatório'); return }
                setSaving(true)
                try{
                  const payload = { group_id: group.id, name: editing.name.trim(), description: editing.description || undefined, applies_to: editing.applies_to, is_active: editing.is_active }
                  const url = editing.id ? `/api/occurrence-types/${editing.id}` : '/api/occurrence-types'
                  const method = editing.id ? 'PATCH' : 'POST'
                  const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
                  if (!res.ok) { const b = await res.json().catch(()=>({})); toast.error(b?.error||'Falha ao salvar tipo'); return }
                  const params = new URLSearchParams({ group_id: String(group.id) })
                  const r = await fetch(`/api/occurrence-types?${params.toString()}`)
                  const data = await r.json(); setItems(Array.isArray(data)?data:[])
                  setEditing(null)
                } finally { setSaving(false) }
              }}>{saving?'Salvando…':'Salvar'}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function OccurrenceGroupsManager() {
  // Toast functions using sonner
  const showSuccess = (message: string) => toast.success(message)
  const showError = (message: string) => toast.error(message)
  const [groups, setGroups] = useState<OccurrenceGroup[]>([])
  const [loading, setLoading] = useState(true)
  // Filtros
  const [statusFilter, setStatusFilter] = useState<'active'|'inactive'|'all'>('active')
  const [query, setQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<OccurrenceGroup | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<OccurrenceGroup | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  })

  // Carrega inicialmente
  useEffect(() => { loadGroups() }, [])

  // Recarrega com debounce ao alterar filtros
  useEffect(() => {
    const t = setTimeout(() => { loadGroups() }, 300)
    return () => clearTimeout(t)
  }, [statusFilter, query])

  const loadGroups = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('status', statusFilter)
      if (query) params.set('query', query)
      const response = await fetch(`/api/occurrence-groups?${params.toString()}`)
      if (!response.ok) throw new Error('Erro ao carregar grupos')
      
      const data = await response.json()
      const arr = Array.isArray(data?.groups) ? data.groups : (Array.isArray(data) ? data : [])
      setGroups(arr)
    } catch (err) {
      error('Erro ao carregar grupos de ocorrências')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      setSaving(true)
      const url = editingGroup 
        ? `/api/occurrence-groups/${editingGroup.id}`
        : '/api/occurrence-groups'
      
      const method = editingGroup ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar grupo')
      }

      success(editingGroup ? 'Grupo atualizado com sucesso!' : 'Grupo criado com sucesso!')
      setIsModalOpen(false)
      setFormData({ name: '', description: '', is_active: true })
      setEditingGroup(null)
      loadGroups()
      try { window.dispatchEvent(new Event('pg:occurrence:groups:refresh')) } catch {}
    } catch (err) {
      error(err instanceof Error ? err.message : 'Erro ao salvar grupo')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (group: OccurrenceGroup) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description || '',
      is_active: group.is_active
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (group: OccurrenceGroup) => {
    try {
      const response = await fetch(`/api/occurrence-groups/${group.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir grupo')
      }

      success('Grupo excluído com sucesso!')
      loadGroups()
      try { window.dispatchEvent(new Event('pg:occurrence:groups:refresh')) } catch {}
    } catch (err) {
      error(err instanceof Error ? err.message : 'Erro ao excluir grupo')
      console.error(err)
    }
  }

  const openCreateModal = () => {
    setEditingGroup(null)
    setFormData({ name: '', description: '', is_active: true })
    setIsModalOpen(true)
  }

  // Modal Tipos do Grupo
  const [typesModal, setTypesModal] = useState<{ open: boolean; group: OccurrenceGroup | null }>({ open: false, group: null })
  function openTypesModal(group: OccurrenceGroup) {
    setTypesModal({ open: true, group })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Grupos de Ocorrências</h2>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Grupo
        </Button>
      </div>

      {/* Barra de filtros */}
      <div className="flex items-center gap-2">
        <Input placeholder="Buscar grupos..." value={query} onChange={(e)=>setQuery(e.target.value)} className="w-64" />
        <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value as any)} className="rounded-md border px-2 py-2 text-sm">
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="all">Todos</option>
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
      )}

      {groups.length === 0 && !loading ? (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Nenhum grupo cadastrado
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Cadastre seu primeiro grupo de ocorrências para começar
          </p>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Cadastrar Grupo
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[160px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>
                    {group.description ? (
                      <span className="text-sm text-muted-foreground">
                        {group.description}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        Sem descrição
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      group.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {group.is_active ? 'Ativo' : 'Inativo'}
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
                        <DropdownMenuItem onClick={() => handleEdit(group)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openTypesModal(group)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Tipos
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteConfirm(group)}
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
              {editingGroup ? 'Editar Grupo' : 'Novo Grupo de Ocorrências'}
            </DialogTitle>
            <DialogDescription>
              {editingGroup
                ? 'Atualize as informações do grupo de ocorrências'
                : 'Crie um novo grupo de ocorrências para organizar os tipos'
              }
            </DialogDescription>
          </DialogHeader>

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Saúde, Financeiro, Logística..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o propósito deste grupo de ocorrências..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Grupo ativo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
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
                editingGroup ? 'Atualizar' : 'Criar'
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
              Tem certeza que deseja excluir o grupo "{deleteConfirm?.name}"?
              Esta ação não pode ser desfeita e pode afetar tipos de ocorrências vinculados.
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
      {/* Modal Tipos do Grupo */}
      {typesModal.open && typesModal.group && (
        <GroupTypesModal
          group={typesModal.group}
          open={typesModal.open}
          onClose={() => setTypesModal({ open:false, group:null })}
        />
      )}
    </div>
  )
}
