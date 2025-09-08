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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
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
import { TeamUpgradeModal } from "@/components/TeamUpgradeModal"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Loader2,
  Copy,
  Check,
  User,
  Key,
  MoreHorizontal
} from "lucide-react"

interface ProfessionalProfile {
  id: number
  name: string
  description?: string
}

interface Professional {
  id: number
  full_name: string
  cpf: string
  sex: string
  birth_date: string
  whatsapp_personal?: string
  whatsapp_work: string
  email: string
  notes?: string
  professional_profiles: {
    name: string
  }
  users?: {
    email: string
  }
  created_at: string
}

export function ProfessionalsManager() {
  const { success, error } = useToast()
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [profiles, setProfiles] = useState<ProfessionalProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null)
  const [saving, setSaving] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [linkingUser, setLinkingUser] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Professional | null>(null)
  const [activeTab, setActiveTab] = useState<'professional' | 'user'>('professional')
  const [searchTerm, setSearchTerm] = useState('')
  const [profileFilter, setProfileFilter] = useState('')
  const [userFormData, setUserFormData] = useState({
    password: '',
    userProfile: 'admin',
    isActive: false
  })

  // Filtrar profissionais
  const filteredProfessionals = professionals.filter(professional => {
    const matchesSearch = !searchTerm || 
      professional.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professional.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesProfile = !profileFilter || profileFilter === 'all' ||
      professional.profile_id.toString() === profileFilter
    
    return matchesSearch && matchesProfile
  })
  
  // Form state
  const [formData, setFormData] = useState({
    profile_id: '',
    full_name: '',
    cpf: '',
    sex: '',
    birth_date: '',
    whatsapp_personal: '',
    whatsapp_work: '',
    email: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Carregar profissionais e perfis em paralelo
      const [professionalsRes, profilesRes] = await Promise.all([
        fetch('/api/professionals'),
        fetch('/api/professional-profiles')
      ])

      const [professionalsData, profilesData] = await Promise.all([
        professionalsRes.json(),
        profilesRes.json()
      ])

      if (professionalsRes.ok) {
        setProfessionals(professionalsData.professionals || [])
      } else {
        error('Erro ao carregar profissionais')
      }

      if (profilesRes.ok) {
        setProfiles(profilesData.profiles || [])
      } else {
        error('Erro ao carregar perfis')
      }
    } catch (err) {
      error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const checkProfessionalLimit = async () => {
    try {
      const response = await fetch('/api/professionals/count')
      const data = await response.json()
      
      if (response.ok) {
        return data.canAddMore
      }
      return false
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verificar limite antes de salvar
    if (!editingProfessional) {
      const canAdd = await checkProfessionalLimit()
      if (!canAdd) {
        setShowUpgradeModal(true)
        return
      }
    }

    setSaving(true)

    try {
      const url = editingProfessional 
        ? `/api/professionals/${editingProfessional.id}`
        : '/api/professionals'
      
      const method = editingProfessional ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          profile_id: parseInt(formData.profile_id)
        })
      })

      const data = await response.json()

      if (response.ok) {
        success(editingProfessional ? 'Profissional atualizado com sucesso!' : 'Profissional criado com sucesso!')
        
        // Se foi criado um novo usuário, mostrar senha temporária
        if (data.tempPassword) {
          setTempPassword(data.tempPassword.password)
        }
        
        setIsModalOpen(false)
        setEditingProfessional(null)
        setFormData({
          profile_id: '',
          full_name: '',
          cpf: '',
          sex: '',
          birth_date: '',
          whatsapp_personal: '',
          whatsapp_work: '',
          email: '',
          notes: ''
        })
        loadData()
      } else {
        if (data.error === 'cpf_already_exists') {
          error('Já existe um profissional com este CPF')
        } else if (data.error === 'email_already_exists') {
          error('Já existe um profissional com este e-mail')
        } else if (data.error === 'email_already_linked') {
          error(data.message || 'E-mail já vinculado a outro profissional')
        } else {
          error(data.error || 'Erro ao salvar profissional')
        }
      }
    } catch (err) {
      error('Erro ao salvar profissional')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (professional: Professional) => {
    setEditingProfessional(professional)
    setFormData({
      profile_id: professional.profile_id.toString(),
      full_name: professional.full_name,
      cpf: professional.cpf,
      sex: professional.sex,
      birth_date: professional.birth_date,
      whatsapp_personal: professional.whatsapp_personal || '',
      whatsapp_work: professional.whatsapp_work,
      email: professional.email,
      notes: professional.notes || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (professional: Professional) => {
    if (!confirm(`Tem certeza que deseja excluir o profissional "${professional.full_name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/professionals/${professional.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        success('Profissional excluído com sucesso!')
        loadData()
      } else {
        error('Erro ao excluir profissional')
      }
    } catch (err) {
      error('Erro ao excluir profissional')
    }
  }

  const handleLinkUser = async (professional: Professional) => {
    if (!professional) return

    setLinkingUser(true)
    try {
      const response = await fetch(`/api/professionals/${professional.id}/link-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: professional.email
        })
      })

      const data = await response.json()

      if (response.ok) {
        if (data.tempPassword) {
          setTempPassword(data.tempPassword.password)
          success('Acesso criado com sucesso! Senha temporária gerada.')
        } else {
          success('Acesso criado com sucesso!')
        }
        loadData()
      } else {
        error(data.error || 'Erro ao criar acesso')
      }
    } catch (err) {
      error('Erro ao criar acesso')
    } finally {
      setLinkingUser(false)
    }
  }

  const handleUserSave = async () => {
    if (!editingProfessional) return

    try {
      const response = await fetch(`/api/professionals/${editingProfessional.id}/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editingProfessional.email,
          password: userFormData.password,
          userProfile: userFormData.userProfile,
          isActive: userFormData.isActive
        })
      })

      const data = await response.json()

      if (response.ok) {
        success('Usuário criado com sucesso!')
        setActiveTab('professional')
        setUserFormData({ password: '', userProfile: 'admin', isActive: false })
        loadData()
      } else {
        error(data.error || 'Erro ao criar usuário')
      }
    } catch (err) {
      error('Erro ao criar usuário')
    }
  }

  const openCreateModal = () => {
    setEditingProfessional(null)
    setFormData({
      profile_id: '',
      full_name: '',
      cpf: '',
      sex: '',
      birth_date: '',
      whatsapp_personal: '',
      whatsapp_work: '',
      email: '',
      notes: ''
    })
    setIsModalOpen(true)
  }

  const copyPassword = async () => {
    if (tempPassword) {
      try {
        await navigator.clipboard.writeText(tempPassword)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // Fallback para navegadores que não suportam clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = tempPassword
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatWhatsApp = (whatsapp: string) => {
    return whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando profissionais...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Profissionais</h2>
        <Button size="sm" className="flex items-center gap-2" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Novo Profissional
        </Button>
      </div>

      {/* Barra de Ferramentas Premium */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="profile-filter" className="text-sm font-medium">
            Perfil:
          </Label>
          <Select value={profileFilter} onValueChange={setProfileFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos os perfis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os perfis</SelectItem>
              {profiles.map(profile => (
                <SelectItem key={profile.id} value={profile.id.toString()}>
                  {profile.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredProfessionals.length === 0 ? (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            {professionals.length === 0 
              ? 'Nenhum profissional cadastrado'
              : 'Nenhum resultado encontrado'
            }
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {professionals.length === 0 
              ? 'Cadastre seu primeiro profissional para começar a gerenciar sua equipe'
              : 'Tente ajustar os filtros de busca.'
            }
          </p>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Cadastrar Profissional
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfessionals.map((professional) => (
                <TableRow key={professional.id}>
                  <TableCell className="font-medium">{professional.full_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {professional.professional_profiles.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono">
                      {formatCPF(professional.cpf)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatWhatsApp(professional.whatsapp_work)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{professional.email}</span>
                  </TableCell>
                  <TableCell>
                    {professional.user_id ? (
                      <Badge variant="secondary" className="text-xs">
                        Vinculado
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Não vinculado
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLinkUser(professional)}
                          disabled={linkingUser}
                          className="text-xs h-6 px-2"
                        >
                          {linkingUser ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Criar Acesso'
                          )}
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(professional)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteConfirm(professional)}
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

      {/* Modal de criação/edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}
            </DialogTitle>
            <DialogDescription>
              {editingProfessional 
                ? 'Atualize as informações do profissional'
                : 'Cadastre um novo profissional na equipe'
              }
            </DialogDescription>
          </DialogHeader>

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-y-auto">
            {/* Sub-abas */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('professional')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'professional'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="h-4 w-4" />
              Profissional
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('user')}
              disabled={!editingProfessional && !formData.email}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'user'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              } ${(!editingProfessional && !formData.email) || (editingProfessional?.user_id) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Key className="h-4 w-4" />
              Usuário
            </button>
          </div>
          
          {/* Conteúdo das abas */}
          {activeTab === 'professional' && (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nome completo do profissional"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="profile_id">Perfil Profissional *</Label>
                <Select value={formData.profile_id} onValueChange={(value) => setFormData({ ...formData, profile_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id.toString()}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => {
                    const masked = e.target.value
                      .replace(/\D/g, '')
                      .replace(/(\d{3})(\d)/, '$1.$2')
                      .replace(/(\d{3})(\d)/, '$1.$2')
                      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                      .replace(/(-\d{2})\d+?$/, '$1')
                    setFormData({ ...formData, cpf: masked })
                  }}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="sex">Sexo *</Label>
                <Select value={formData.sex} onValueChange={(value) => setFormData({ ...formData, sex: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="birth_date">Data de Nascimento *</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="whatsapp_personal">WhatsApp Pessoal</Label>
                <Input
                  id="whatsapp_personal"
                  value={formData.whatsapp_personal}
                  onChange={(e) => {
                    const masked = e.target.value
                      .replace(/\D/g, '')
                      .replace(/(\d{2})(\d)/, '($1) $2')
                      .replace(/(\d{5})(\d)/, '$1-$2')
                      .replace(/(-\d{4})\d+?$/, '$1')
                    setFormData({ ...formData, whatsapp_personal: masked })
                  }}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
              
              <div>
                <Label htmlFor="whatsapp_work">WhatsApp Profissional *</Label>
                <Input
                  id="whatsapp_work"
                  value={formData.whatsapp_work}
                  onChange={(e) => {
                    const masked = e.target.value
                      .replace(/\D/g, '')
                      .replace(/(\d{2})(\d)/, '($1) $2')
                      .replace(/(\d{5})(\d)/, '$1-$2')
                      .replace(/(-\d{4})\d+?$/, '$1')
                    setFormData({ ...formData, whatsapp_work: masked })
                  }}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações adicionais sobre o profissional..."
                rows={3}
              />
            </div>
            
          </form>
          )}

          {/* Aba Usuário */}
          {activeTab === 'user' && (
            <div className="space-y-4">
              {editingProfessional?.user_id ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-sm text-green-800 mb-2">Usuário Já Vinculado</h3>
                  <p className="text-sm text-green-700">
                    Este profissional já possui um usuário vinculado ao sistema. Para alterar as configurações, use a funcionalidade de gerenciamento de usuários.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Configuração de Acesso</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure o acesso do usuário ao sistema
                  </p>
                </div>
              )}

              {!editingProfessional?.user_id && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="user_email">E-mail</Label>
                    <Input
                      id="user_email"
                      value={editingProfessional?.email || formData.email}
                      disabled
                      className="bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      E-mail puxado automaticamente do cadastro do profissional
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="user_password">Senha</Label>
                    <Input
                      id="user_password"
                      type="password"
                      value={userFormData.password}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Digite uma senha para o usuário"
                    />
                  </div>

                  <div>
                    <Label htmlFor="user_profile">Perfil de Usuário</Label>
                    <Select
                      value={userFormData.userProfile}
                      onValueChange={(value) => setUserFormData(prev => ({ ...prev, userProfile: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="user_active">Ativar usuário</Label>
                    <Switch
                      id="user_active"
                      checked={userFormData.isActive}
                      onCheckedChange={(checked) => setUserFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                  </div>
                </div>
              )}


            </div>
          )}
          </div>

          {/* Rodapé Sticky */}
          <div className="border-t bg-background p-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            {activeTab === 'professional' && (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingProfessional ? 'Salvar Alterações' : 'Cadastrar Profissional'}
              </Button>
            )}
            {activeTab === 'user' && !editingProfessional?.user_id && (
              <Button
                type="button"
                onClick={handleUserSave}
                disabled={!userFormData.password || !userFormData.isActive}
              >
                Salvar Usuário
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de senha temporária */}
      {tempPassword && (
        <Dialog open={!!tempPassword} onOpenChange={() => setTempPassword(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Usuário Criado com Sucesso</DialogTitle>
              <DialogDescription>
                Um usuário foi criado automaticamente para este profissional com uma senha temporária.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-sm font-medium">Senha Temporária:</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={tempPassword}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyPassword}
                    className="flex items-center gap-2"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>⚠️ <strong>Importante:</strong> Compartilhe esta senha com o profissional de forma segura.</p>
                <p>Ele poderá alterar a senha após o primeiro login.</p>
              </div>
              
              <Button onClick={() => setTempPassword(null)} className="w-full">
                Entendi
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de upgrade */}
      <TeamUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onViewPlans={() => {
          // Implementar navegação para planos
          console.log('Navegar para planos')
        }}
        onContactSupport={() => {
          // Implementar contato com suporte
          console.log('Contatar suporte')
        }}
      />

      {/* Modal de Confirmação de Delete */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o profissional "{deleteConfirm?.full_name}"? 
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
    </div>
  )
}
