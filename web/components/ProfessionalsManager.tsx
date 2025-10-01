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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  MoreHorizontal, 
  Search, 
  Loader2, 
  Copy, 
  Check,
  User,
  Key,
  Phone,
  Settings
} from "lucide-react"
import { TeamUpgradeModal } from "./TeamUpgradeModal"

interface ProfessionalProfile {
  id: number
  name: string
  description: string
}

interface Professional {
  id: number
  profile_id: number
  full_name: string
  cpf: string
  sex: string
  birth_date: string
  whatsapp_personal?: string
  whatsapp_work: string
  email: string
  notes?: string
  is_active: boolean
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
  const { confirm } = useConfirmDialog()
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
    notes: '',
    is_active: true
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
    setSaving(true)

    // Verificar limite antes de salvar
    if (!editingProfessional) {
      const canAdd = await checkProfessionalLimit()
      if (!canAdd) {
        setShowUpgradeModal(true)
        return
      }
    }

    try {
      const url = editingProfessional 
        ? `/api/professionals/${editingProfessional.id}`
        : '/api/professionals'
      
      const method = editingProfessional ? 'PATCH' : 'POST'
      
      // Validar profile_id antes de enviar
      const profileId = parseInt(formData.profile_id)
      if (isNaN(profileId) || profileId <= 0) {
        error('Perfil profissional é obrigatório')
        return
      }

      const requestBody = {
        ...formData,
        profile_id: profileId
      }
      
      console.log('Enviando dados:', requestBody) // Debug

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()
      console.log('Resposta da API:', { status: response.status, data }) // Debug

      if (response.ok) {
        success(editingProfessional ? 'Profissional atualizado com sucesso!' : 'Profissional criado com sucesso!')
        // Atualiza a lista local imediatamente
        if (data?.professional) {
          setProfessionals((prev) => {
            const idx = prev.findIndex(p => p.id === data.professional.id)
            if (idx >= 0) {
              const next = [...prev]
              next[idx] = { ...prev[idx], ...data.professional }
              return next
            }
            return prev
          })
        }
        setIsModalOpen(false)
        loadData()
        resetForm()

        // Se foi criado um novo usuário, mostrar senha temporária
        if (data.tempPassword) {
          setTempPassword(data.tempPassword.password)
        }
      } else {
        if (data.error === 'cpf_already_exists') {
          error('Já existe um profissional com este CPF')
        } else if (data.error === 'email_already_exists') {
          error('Já existe um profissional com este e-mail')
        } else if (data.error === 'email_already_linked') {
          error(data.message || 'E-mail já vinculado a outro profissional')
        } else if (data.error === 'validation_error') {
          error(`Erro de validação: ${data.details?.map((d: any) => d.message).join(', ') || 'Dados inválidos'}`)
        } else {
          console.error('Erro na API:', data) // Debug
          error(data.error || data.message || 'Erro ao salvar profissional')
        }
      }
    } catch (err) {
      error('Erro ao salvar profissional')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (professional: Professional) => {
    console.log('Editando profissional:', professional) // Debug
    try {
      // Buscar os dados completos do profissional (inclui cpf, sexo, nascimento, etc.)
      const res = await fetch(`/api/professionals/${professional.id}`)
      const data = await res.json()
      const p = res.ok && data?.professional ? data.professional : professional

      setEditingProfessional(p)
      setFormData({
        profile_id: p.profile_id ? p.profile_id.toString() : '',
        full_name: p.full_name || '',
        cpf: p.cpf || '',
        sex: p.sex || '',
        birth_date: p.birth_date || '',
        whatsapp_personal: p.whatsapp_personal || '',
        whatsapp_work: p.whatsapp_work || '',
        email: p.email || '',
        notes: p.notes || '',
        is_active: p.is_active ?? true
      })
    } catch (e) {
      // fallback com dados da lista
      setEditingProfessional(professional)
      setFormData({
        profile_id: professional.profile_id ? professional.profile_id.toString() : '',
        full_name: professional.full_name || '',
        cpf: professional.cpf || '',
        sex: professional.sex || '',
        birth_date: professional.birth_date || '',
        whatsapp_personal: professional.whatsapp_personal || '',
        whatsapp_work: professional.whatsapp_work || '',
        email: professional.email || '',
        notes: professional.notes || '',
        is_active: professional.is_active ?? true
      })
    } finally {
      setIsModalOpen(true)
    }
  }

  const handleToggleStatus = async (professional: Professional) => {
    try {
      const response = await fetch(`/api/professionals/${professional.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !professional.is_active
        })
      })

      const data = await response.json()

      if (response.ok) {
        success(data.message || `Profissional ${!professional.is_active ? 'ativado' : 'inativado'} com sucesso!`)
        loadData()
      } else {
        error(data.message || 'Erro ao alterar status do profissional')
      }
    } catch (err) {
      error('Erro ao alterar status do profissional')
    }
  }

  const handleDelete = async (professional: Professional) => {
    confirm({
      title: "Excluir Profissional",
      description: `Tem certeza que deseja excluir o profissional "${professional.full_name}"? Esta ação não pode ser desfeita.`,
      confirmText: "Sim, excluir",
      cancelText: "Cancelar",
      variant: "destructive",
      onConfirm: async () => {
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
    })
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
        }
        success('Usuário vinculado com sucesso!')
        loadData()
      } else {
        error(data.message || 'Erro ao vincular usuário')
      }
    } catch (err) {
      error('Erro ao vincular usuário')
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
          profile: userFormData.userProfile,
          isActive: userFormData.isActive
        })
      })

      const data = await response.json()

      if (response.ok) {
        success('Usuário criado com sucesso!')
        if (data.tempPassword) {
          setTempPassword(data.tempPassword.password)
        }
        loadData()
      } else {
        error(data.message || 'Erro ao criar usuário')
      }
    } catch (err) {
      error('Erro ao criar usuário')
    }
  }

  const openCreateModal = () => {
    setEditingProfessional(null)
    resetForm()
    setUserFormData({
      password: '',
      userProfile: 'admin',
      isActive: false
    })
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      profile_id: '',
      full_name: '',
      cpf: '',
      sex: '',
      birth_date: '',
      whatsapp_personal: '',
      whatsapp_work: '',
      email: '',
      notes: '',
      is_active: true
    })
  }

  const copyPassword = async () => {
    if (tempPassword) {
      try {
        await navigator.clipboard.writeText(tempPassword)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
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
    const digits = (whatsapp || '').replace(/\D/g, '')
    const local = digits.startsWith('55') ? digits.slice(2) : digits
    if (local.length === 11) {
      return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
    }
    if (local.length === 10) {
      return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
    }
    return whatsapp
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

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={profileFilter} onValueChange={setProfileFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os perfis</SelectItem>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id.toString()}>
                {profile.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfessionals.map((professional) => (
              <TableRow key={professional.id}>
                <TableCell className="font-medium">
                  {professional.full_name}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {professional.professional_profiles.name}
                  </Badge>
                </TableCell>
                <TableCell>{professional.email}</TableCell>
                <TableCell>{formatWhatsApp(professional.whatsapp_work)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={professional.is_active}
                      onCheckedChange={(_checked: boolean) => handleToggleStatus(professional)}
                      disabled={saving}
                    />
                    <span className="text-sm text-muted-foreground">
                      {professional.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
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
                        onClick={() => handleDelete(professional)}
                        className="text-red-600"
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

      {/* Modal de Edição/Criação */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-visible">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <DialogTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div>{editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}</div>
                <DialogDescription className="text-sm font-normal text-muted-foreground mt-1">
                  {editingProfessional
                    ? 'Atualize as informações do profissional'
                    : 'Cadastre um novo profissional na equipe'
                  }
                </DialogDescription>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Tabs */}
            <div className="flex space-x-1 bg-muted/50 p-1 rounded-xl mb-6 border">
              <button
                type="button"
                onClick={() => setActiveTab('professional')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === 'professional'
                    ? 'bg-background text-foreground shadow-sm border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <User className="h-4 w-4" />
                Dados Profissionais
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('user')}
                disabled={!editingProfessional && !formData.email}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === 'user'
                    ? 'bg-background text-foreground shadow-sm border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                } ${(!editingProfessional && !formData.email) || (editingProfessional?.user_id) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Key className="h-4 w-4" />
                Acesso ao Sistema
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {activeTab === 'professional' && (
                <>
                  {/* Card de Informações Básicas */}
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Informações Básicas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="full_name">Nome Completo *</Label>
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="h-10"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="profile_id">Perfil Profissional *</Label>
                          <Select value={formData.profile_id} onValueChange={(value) => setFormData({ ...formData, profile_id: value })}>
                            <SelectTrigger className="h-10">
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
                    </CardContent>
                  </Card>

                  {/* Card de Documentos e Contato */}
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary" />
                        Documentos e Contato
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="cpf" className="text-sm font-medium">CPF *</Label>
                          <Input
                            id="cpf"
                            value={formData.cpf}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '')
                              if (value.length <= 11) {
                                setFormData({ ...formData, cpf: value })
                              }
                            }}
                            placeholder="000.000.000-00"
                            className="h-10"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="sex" className="text-sm font-medium">Sexo *</Label>
                          <Select value={formData.sex} onValueChange={(value) => setFormData({ ...formData, sex: value })}>
                            <SelectTrigger className="h-10">
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
                          <Label htmlFor="birth_date" className="text-sm font-medium">Data de Nascimento *</Label>
                          <Input
                            id="birth_date"
                            type="date"
                            value={formData.birth_date}
                            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                            className="h-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="whatsapp_personal" className="text-sm font-medium">WhatsApp Pessoal</Label>
                          <Input
                            id="whatsapp_personal"
                            value={formData.whatsapp_personal}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '')
                              if (value.length <= 11) {
                                setFormData({ ...formData, whatsapp_personal: value })
                              }
                            }}
                            placeholder="(00) 00000-0000"
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label htmlFor="whatsapp_work" className="text-sm font-medium">WhatsApp Profissional *</Label>
                          <Input
                            id="whatsapp_work"
                            value={formData.whatsapp_work}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '')
                              if (value.length <= 11) {
                                setFormData({ ...formData, whatsapp_work: value })
                              }
                            }}
                            placeholder="(00) 00000-0000"
                            className="h-10"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-sm font-medium">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="h-10"
                          required
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card de Perfil e Status */}
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        Perfil e Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="profile_id" className="text-sm font-medium">Perfil Profissional *</Label>
                          <Select value={formData.profile_id} onValueChange={(value) => setFormData({ ...formData, profile_id: value })}>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Selecione o perfil" />
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
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                          <div className="space-y-0.5">
                            <Label htmlFor="is_active" className="text-sm font-medium">Status do Profissional</Label>
                            <p className="text-xs text-muted-foreground">
                              {formData.is_active ? 'Profissional ativo no sistema' : 'Profissional inativo no sistema'}
                            </p>
                          </div>
                          <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked: boolean) => setFormData({ ...formData, is_active: checked })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="notes" className="text-sm font-medium">Observações</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Observações sobre o profissional..."
                          rows={3}
                          className="resize-none"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === 'user' && (
                <div className="space-y-4">
                  {editingProfessional?.user_id ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-medium text-sm text-green-800 mb-2">Usuário Já Vinculado</h3>
                      <p className="text-sm text-green-700">
                        Este profissional já possui acesso ao sistema.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h3 className="font-medium text-sm text-muted-foreground mb-2">Configuração de Acesso</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure as credenciais de acesso para este profissional.
                      </p>
                    </div>
                  )}

                  {!editingProfessional?.user_id && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="user_email">E-mail</Label>
                        <Input
                          id="user_email"
                          value={formData.email}
                          disabled
                          className="bg-muted/50"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          O e-mail será usado para fazer login no sistema
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="user_password">Senha</Label>
                        <Input
                          id="user_password"
                          type="password"
                          value={userFormData.password}
                          onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
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
                            <SelectItem value="manager">Gerente</SelectItem>
                            <SelectItem value="user">Usuário</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="user_active">Ativar usuário</Label>
                        <Switch
                          id="user_active"
                          checked={userFormData.isActive}
                          onCheckedChange={(checked: boolean) => setUserFormData(prev => ({ ...prev, isActive: checked }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Footer do Modal */}
          <div className="border-t bg-muted/30 px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-10 px-6"
              >
                Cancelar
              </Button>
              {activeTab === 'professional' && (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="h-10 px-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
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
                  className="h-10 px-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                >
                  Salvar Usuário
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de senha temporária */}
      <Dialog open={!!tempPassword} onOpenChange={() => setTempPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuário Criado com Sucesso</DialogTitle>
            <DialogDescription>
              O usuário foi criado com sucesso. Anote a senha temporária abaixo.
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

      <TeamUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={() => {
          setShowUpgradeModal(false)
          // Aqui você pode redirecionar para a página de upgrade
        }}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o profissional "{deleteConfirm?.full_name}"? Esta ação não pode ser desfeita.
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