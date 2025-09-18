"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { useConfirmDialog, ConfirmDialog } from "@/components/ui/confirm-dialog"
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
  UserCheck,
  Loader2,
  MoreHorizontal
} from "lucide-react"

interface ProfessionalProfile {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export function ProfessionalProfilesManager() {
  const { success, error } = useToast()
  const [profiles, setProfiles] = useState<ProfessionalProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<ProfessionalProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<ProfessionalProfile | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      const response = await fetch('/api/professional-profiles')
      const data = await response.json()
      
      if (response.ok) {
        setProfiles(data.profiles || [])
      } else {
        error('Erro ao carregar perfis profissionais')
      }
    } catch (err) {
      error('Erro ao carregar perfis profissionais')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingProfile 
        ? `/api/professional-profiles/${editingProfile.id}`
        : '/api/professional-profiles'
      
      const method = editingProfile ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        success(editingProfile ? 'Perfil atualizado com sucesso!' : 'Perfil criado com sucesso!')
        setIsModalOpen(false)
        setEditingProfile(null)
        setFormData({ name: '', description: '' })
        loadProfiles()
      } else {
        if (data.error === 'profile_name_already_exists') {
          error('Já existe um perfil com este nome')
        } else {
          error(data.error || 'Erro ao salvar perfil')
        }
      }
    } catch (err) {
      error('Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (profile: ProfessionalProfile) => {
    setEditingProfile(profile)
    setFormData({
      name: profile.name,
      description: profile.description || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (profile: ProfessionalProfile) => {
    const { confirm, ConfirmDialog } = useConfirmDialog()
    
    confirm({
      title: "Excluir Perfil Profissional",
      description: `Tem certeza que deseja excluir o perfil "${profile.name}"? Esta ação não pode ser desfeita.`,
      confirmText: "Sim, excluir",
      cancelText: "Cancelar",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/professional-profiles/${profile.id}`, {
            method: 'DELETE'
          })

          if (response.ok) {
            success('Perfil excluído com sucesso!')
            loadProfiles()
          } else {
            error('Erro ao excluir perfil')
          }
        } catch (err) {
          error('Erro ao excluir perfil')
        }
      }
    })
  }

  const openCreateModal = () => {
    setEditingProfile(null)
    setFormData({ name: '', description: '' })
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando perfis...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Card de listagem com título e ações alinhadas */}
      <div className="rounded-2xl shadow-sm border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Perfis Profissionais</h2>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2" onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Novo Perfil
              </Button>
            </DialogTrigger>
          <DialogContent className="flex flex-col max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingProfile ? 'Editar Perfil' : 'Novo Perfil Profissional'}
              </DialogTitle>
              <DialogDescription>
                {editingProfile 
                  ? 'Atualize as informações do perfil profissional'
                  : 'Crie um novo perfil profissional para organizar sua equipe'
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
                    placeholder="Ex: Personal Trainer, Nutricionista..."
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva as responsabilidades deste perfil..."
                    rows={3}
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
                  editingProfile ? 'Atualizar' : 'Criar'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

        {profiles.length === 0 ? (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <UserCheck className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhum perfil profissional cadastrado
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cadastre seu primeiro perfil profissional para começar a organizar sua equipe
            </p>
            <Button onClick={openCreateModal} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Cadastrar Perfil
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.name}</TableCell>
                  <TableCell>
                    {profile.description ? (
                      <span className="text-sm text-muted-foreground">
                        {profile.description}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        Sem descrição
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString('pt-BR')}
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
                        <DropdownMenuItem onClick={() => handleEdit(profile)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteConfirm(profile)}
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
      </div>

      {/* Modal de Confirmação de Delete */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o perfil "{deleteConfirm?.name}"? 
              Esta ação não pode ser desfeita.
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

      <ConfirmDialog />
    </div>
  )
}
