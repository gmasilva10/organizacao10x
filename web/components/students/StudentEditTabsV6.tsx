"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  User, 
  MapPin, 
  Users, 
  Calendar,
  Camera,
  Upload,
  Search,
  Plus,
  X,
  Save,
  User2,
  Home,
  Users2,
  Image,
  Settings,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react"
import { showStudentUpdated, showStudentError, showSuccessToast, showErrorToast, showStudentInactivated } from "@/lib/toast-utils"

// Importar componentes compartilhados
import StudentActions from "./shared/StudentActions"
import StudentAttachments from "./StudentAttachments"

type Student = {
  id: string
  name: string
  email: string
  phone: string
  status: 'onboarding' | 'active' | 'paused' | 'inactive'
  created_at: string
  birth_date?: string
  gender?: 'masculino' | 'feminino' | 'outro'
  marital_status?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo'
  nationality?: string
  birth_place?: string
  photo_url?: string
  onboard_opt?: 'nao_enviar' | 'enviar' | 'enviado'
  address?: {
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
    zip_code: string
  }
  trainer?: {
    id: string
    name: string
  } | null
  trainer_id?: string | null
  trainer_name?: string | null
}

type StudentEditTabsV6Props = {
  student: Student
  studentId: string
  onSave: (data: Partial<Student>) => Promise<void>
  onSaveAddress: (address: Student['address']) => Promise<void>
  onSaveResponsaveis: (responsaveis: any[]) => Promise<void>
  onCancel: () => void
  onSaveAndRedirect?: () => void
}

export default function StudentEditTabsV6({ 
  student, 
  studentId, 
  onSave, 
  onSaveAddress, 
  onSaveResponsaveis,
  onCancel,
  onSaveAndRedirect
}: StudentEditTabsV6Props) {
  const [activeTab, setActiveTab] = useState("identificacao")
  const [saving, setSaving] = useState(false)
  const [expandedResponsaveis, setExpandedResponsaveis] = useState(false)
  const [formData, setFormData] = useState({
    name: student.name,
    email: student.email,
    phone: student.phone,
    status: student.status,
    birth_date: student.birth_date || '',
    gender: student.gender || '',
    marital_status: student.marital_status || '',
    nationality: student.nationality || '',
    birth_place: student.birth_place || '',
    onboard_opt: student.onboard_opt || 'nao_enviar'
  })

  const [addressData, setAddressData] = useState({
    zip_code: student.address?.zip_code || '',
    street: student.address?.street || '',
    number: student.address?.number || '',
    complement: student.address?.complement || '',
    neighborhood: student.address?.neighborhood || '',
    city: student.address?.city || '',
    state: student.address?.state || ''
  })

  const [responsaveisData, setResponsaveisData] = useState({
    trainer_principal: student.trainer?.name || '',
    trainer_principal_id: student.trainer?.id || '',
    treinadores_apoio: [] as any[],
    responsaveis_especificos: [] as any[]
  })

  const [photoData, setPhotoData] = useState({
    file: null as File | null,
    preview: student?.photo_url || '',
    uploading: false
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  const [attachments, setAttachments] = useState<any[]>([])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200'
      case 'onboarding': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'paused': return 'Pausado'
      case 'inactive': return 'Inativo'
      case 'onboarding': return 'Onboarding'
      default: return status
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    // Validações obrigatórias (apenas Nome, Email e Telefone)
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido'
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Telefone é obrigatório'
    }
    
    if (!formData.status) {
      errors.status = 'Status é obrigatório'
    }
    
    // Endereço e Responsável são opcionais - sem validações obrigatórias
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      showErrorToast('Por favor, corrija os erros antes de salvar')
      return
    }
    
    setSaving(true)
    try {
      // Preparar dados completos para salvamento
      const saveData = {
        ...formData,
        address: addressData,
        trainer_id: responsaveisData.trainer_principal_id,
        // Não enviar photo_url se for uma URL local (blob)
        ...(photoData.preview && !photoData.preview.startsWith('blob:') && { photo_url: photoData.preview })
      }
      
      await onSave(saveData)
      setValidationErrors({})
      
      // Toast específico para inativação
      if (saveData.status === 'inactive') {
        showStudentInactivated()
      } else {
        showStudentUpdated()
      }
      
      // Não redirecionar automaticamente - apenas salvar
    } catch (error) {
      console.error('Erro ao salvar:', error)
      showStudentError("salvar")
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (file: File) => {
    // Validar tipo e tamanho
    if (!file.type.startsWith('image/')) {
      showErrorToast('Por favor, selecione apenas arquivos de imagem (JPG, PNG)')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      showErrorToast('O arquivo deve ter no máximo 10MB')
      return
    }

    setPhotoData(prev => ({ ...prev, uploading: true, file }))
    
    try {
      // Criar preview local imediato
      const preview = URL.createObjectURL(file)
      setPhotoData(prev => ({ ...prev, preview }))
      
      // Upload real para Supabase Storage
      const formData = new FormData()
      formData.append('file', file)
      formData.append('studentId', studentId)
      
      const response = await fetch('/api/upload/photo', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Erro no upload')
      }
      
      const result = await response.json()
      
      if (result.success && result.photo_url) {
        // Atualizar com URL real do Supabase
        setPhotoData(prev => ({ ...prev, preview: result.photo_url }))
        showSuccessToast('Foto enviada com sucesso!')
      } else {
        throw new Error('URL da foto não retornada')
      }

    } catch (error) {
      console.error('Erro ao enviar foto:', error)
      showErrorToast('Erro ao enviar foto')
      // Reverter preview em caso de erro
      setPhotoData(prev => ({ ...prev, preview: student?.photo_url || '' }))
    } finally {
      setPhotoData(prev => ({ ...prev, uploading: false }))
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handlePhotoUpload(file)
    }
  }

  const handleCepSearch = async () => {
    const cep = addressData.zip_code.replace(/\D/g, '')
    
    if (cep.length !== 8) {
      showErrorToast('CEP deve ter 8 dígitos')
      return
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      
      if (data.erro) {
        showErrorToast('CEP não encontrado')
        return
      }

      setAddressData({
        ...addressData,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || ''
      })
      
      showSuccessToast('Endereço preenchido automaticamente!')

    } catch (error) {
      showErrorToast('Erro ao buscar CEP')
    }
  }

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
  }

  // Verificação de segurança mais flexível
  if (!student) {
    return (
      <div className="max-w-[1200px]">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando dados do aluno...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px]">

      {/* Linha superior: botões (esquerda) + ações (direita) */}
      <div className="flex flex-col">
        {/* Ações (esquerda) + Botões (direita) */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <StudentActions 
              studentId={studentId} 
              studentName={student.name} 
              variant="edit"
              onActionComplete={() => {
                // Callback para atualizar dados após ações
                console.log('Ação completada, dados podem ser atualizados')
              }}
            />
          </div>
          
          {/* Botões de Ação */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button 
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Salvar
                </>
              )}
            </Button>
            <Button 
              size="sm"
              disabled={saving}
              onClick={onSaveAndRedirect}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  OK
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tabs TOTVS-like (parte do formulário) */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
          <TabsList className="h-9">
            <TabsTrigger value="identificacao">Identificação</TabsTrigger>
            <TabsTrigger value="endereco">Endereço</TabsTrigger>
            <TabsTrigger value="responsaveis">Responsáveis</TabsTrigger>
          </TabsList>

          {/* Identificação */}
          <TabsContent value="identificacao" className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dados Pessoais */}
              <div className="lg:col-span-2">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User2 className="h-5 w-5 text-primary" />
                      Dados Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium">Nome Completo *</Label>
                                    <Input
                                      id="name"
                                      value={formData.name}
                                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                                      className={`h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                                        validationErrors.name ? 'border-red-500 focus:border-red-500' : ''
                                      }`}
                                      placeholder="Digite o nome completo"
                                    />
                                    {validationErrors.name && (
                                      <p className="text-sm text-red-600">{validationErrors.name}</p>
                                    )}
                                  </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className={`h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                            validationErrors.email ? 'border-red-500 focus:border-red-500' : ''
                          }`}
                          placeholder="Digite o email"
                        />
                        {validationErrors.email && (
                          <p className="text-sm text-red-600">{validationErrors.email}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">Telefone *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: formatPhone(e.target.value)})}
                          className="h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-sm font-medium">Status *</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as any})}>
                          <SelectTrigger className={`h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                            validationErrors.status ? 'border-red-500 focus:border-red-500' : ''
                          }`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="onboarding">Onboarding</SelectItem>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="paused">Pausado</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        {validationErrors.status && (
                          <p className="text-sm text-red-600">{validationErrors.status}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birth_date" className="text-sm font-medium">Data de Nascimento</Label>
                        <Input
                          id="birth_date"
                          type="date"
                          value={formData.birth_date}
                          onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                          className="h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-sm font-medium">Sexo</Label>
                        <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                          <SelectTrigger className="h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
                            <SelectValue placeholder="Selecione o sexo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="feminino">Feminino</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="marital_status" className="text-sm font-medium">Estado Civil</Label>
                        <Select value={formData.marital_status} onValueChange={(value) => setFormData({...formData, marital_status: value})}>
                          <SelectTrigger className="h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
                            <SelectValue placeholder="Selecione o estado civil" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solteiro">Solteiro</SelectItem>
                            <SelectItem value="casado">Casado</SelectItem>
                            <SelectItem value="divorciado">Divorciado</SelectItem>
                            <SelectItem value="viuvo">Viúvo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nationality" className="text-sm font-medium">Nacionalidade</Label>
                        <Input
                          id="nationality"
                          value={formData.nationality}
                          onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                          className="h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                          placeholder="Ex: Brasileira"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birth_place" className="text-sm font-medium">Naturalidade</Label>
                        <Input
                          id="birth_place"
                          value={formData.birth_place}
                          onChange={(e) => setFormData({...formData, birth_place: e.target.value})}
                          className="h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                          placeholder="Ex: São Paulo, SP"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="onboard_opt" className="text-sm font-medium">Onboarding</Label>
                        <Select value={formData.onboard_opt} onValueChange={(value) => setFormData({...formData, onboard_opt: value as 'nao_enviar' | 'enviar' | 'enviado'})}>
                          <SelectTrigger className="h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
                            <SelectValue placeholder="Selecione a opção de onboarding" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nao_enviar">Não Enviar</SelectItem>
                            <SelectItem value="enviar">Enviar</SelectItem>
                            <SelectItem value="enviado">Enviado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Foto e Infos do Sistema */}
              <div className="space-y-6">
                {/* Foto do Aluno */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Image className="h-5 w-5 text-primary" />
                      Foto do Aluno
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-30 h-30 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/20 overflow-hidden">
                        {photoData.preview ? (
                          <img 
                            src={photoData.preview} 
                            alt="Preview da foto" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          onChange={handleFileInputChange}
                          className="hidden"
                          id="photo-upload"
                        />
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8"
                          disabled={photoData.uploading}
                          onClick={() => document.getElementById('photo-upload')?.click()}
                        >
                          {photoData.uploading ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3 mr-1" />
                          )}
                          {photoData.uploading ? 'Enviando...' : 'Upload'}
                        </Button>
                        <Button size="sm" variant="outline" className="h-8">
                          <Camera className="h-3 w-3 mr-1" />
                          Câmera
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Informações do Sistema */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Criado em {new Date(student.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>ID: {student.id ? student.id.slice(0, 8) + '...' : studentId ? studentId.slice(0, 8) + '...' : 'N/A'}</span>
                    </div>
                    {student.trainer && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Treinador: {student.trainer.name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Endereço */}
          <TabsContent value="endereco" className="pt-6">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  Endereço Completo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="zip_code" className="text-sm font-medium">CEP</Label>
                                <div className="flex gap-2">
                                  <Input
                                    id="zip_code"
                                    value={addressData.zip_code}
                                    onChange={(e) => setAddressData({...addressData, zip_code: formatCep(e.target.value)})}
                                    className={`h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                                      validationErrors.zip_code ? 'border-red-500 focus:border-red-500' : ''
                                    }`}
                                    placeholder="00000-000"
                                  />
                                  <Button
                                    size="sm"
                                    className="h-9 px-3"
                                    onClick={handleCepSearch}
                                    type="button"
                                  >
                                    <Search className="h-4 w-4" />
                                  </Button>
                                </div>
                                {validationErrors.zip_code && (
                                  <p className="text-sm text-red-600">{validationErrors.zip_code}</p>
                                )}
                              </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="street" className="text-sm font-medium">Rua</Label>
                    <Input
                      id="street"
                      value={addressData.street}
                      onChange={(e) => setAddressData({...addressData, street: e.target.value})}
                      className={`h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                        validationErrors.street ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      placeholder="Digite o nome da rua"
                    />
                    {validationErrors.street && (
                      <p className="text-sm text-red-600">{validationErrors.street}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number" className="text-sm font-medium">Número</Label>
                    <Input
                      id="number"
                      value={addressData.number}
                      onChange={(e) => setAddressData({...addressData, number: e.target.value})}
                      className={`h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                        validationErrors.number ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      placeholder="123"
                    />
                    {validationErrors.number && (
                      <p className="text-sm text-red-600">{validationErrors.number}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complement" className="text-sm font-medium">Complemento</Label>
                    <Input
                      id="complement"
                      value={addressData.complement}
                      onChange={(e) => setAddressData({...addressData, complement: e.target.value})}
                      className="h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      placeholder="Apto, bloco, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood" className="text-sm font-medium">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={addressData.neighborhood}
                      onChange={(e) => setAddressData({...addressData, neighborhood: e.target.value})}
                      className={`h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                        validationErrors.neighborhood ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      placeholder="Digite o bairro"
                    />
                    {validationErrors.neighborhood && (
                      <p className="text-sm text-red-600">{validationErrors.neighborhood}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium">Cidade</Label>
                    <Input
                      id="city"
                      value={addressData.city}
                      onChange={(e) => setAddressData({...addressData, city: e.target.value})}
                      className={`h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                        validationErrors.city ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      placeholder="Digite a cidade"
                    />
                    {validationErrors.city && (
                      <p className="text-sm text-red-600">{validationErrors.city}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium">Estado</Label>
                    <Select value={addressData.state} onValueChange={(value) => setAddressData({...addressData, state: value})}>
                      <SelectTrigger className={`h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                        validationErrors.state ? 'border-red-500 focus:border-red-500' : ''
                      }`}>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AC">Acre</SelectItem>
                        <SelectItem value="AL">Alagoas</SelectItem>
                        <SelectItem value="AP">Amapá</SelectItem>
                        <SelectItem value="AM">Amazonas</SelectItem>
                        <SelectItem value="BA">Bahia</SelectItem>
                        <SelectItem value="CE">Ceará</SelectItem>
                        <SelectItem value="DF">Distrito Federal</SelectItem>
                        <SelectItem value="ES">Espírito Santo</SelectItem>
                        <SelectItem value="GO">Goiás</SelectItem>
                        <SelectItem value="MA">Maranhão</SelectItem>
                        <SelectItem value="MT">Mato Grosso</SelectItem>
                        <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                        <SelectItem value="MG">Minas Gerais</SelectItem>
                        <SelectItem value="PA">Pará</SelectItem>
                        <SelectItem value="PB">Paraíba</SelectItem>
                        <SelectItem value="PR">Paraná</SelectItem>
                        <SelectItem value="PE">Pernambuco</SelectItem>
                        <SelectItem value="PI">Piauí</SelectItem>
                        <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                        <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                        <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                        <SelectItem value="RO">Rondônia</SelectItem>
                        <SelectItem value="RR">Roraima</SelectItem>
                        <SelectItem value="SC">Santa Catarina</SelectItem>
                        <SelectItem value="SP">São Paulo</SelectItem>
                        <SelectItem value="SE">Sergipe</SelectItem>
                        <SelectItem value="TO">Tocantins</SelectItem>
                      </SelectContent>
                    </Select>
                    {validationErrors.state && (
                      <p className="text-sm text-red-600">{validationErrors.state}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Responsáveis */}
          <TabsContent value="responsaveis" className="pt-6 space-y-6">
            {/* Treinador Principal */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Treinador Principal *
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    value={responsaveisData.trainer_principal}
                    onChange={(e) => setResponsaveisData({...responsaveisData, trainer_principal: e.target.value})}
                    className="h-9 flex-1 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Adicionar responsável da equipe"
                  />
                  <Button size="sm" className="h-9 px-3">
                    <Search className="h-4 w-4 mr-1" />
                    Buscar
                  </Button>
                </div>
                {student.trainer && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Responsável atual: {student.trainer.name}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Treinadores de Apoio */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Treinadores de Apoio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-9 flex-1 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      placeholder="Adicionar responsável da equipe"
                    />
                    <Button size="sm" className="h-9 px-3">
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Nenhum treinador de apoio adicionado
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Responsáveis Específicos */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-primary" />
                  Responsáveis Específicos
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedResponsaveis(!expandedResponsaveis)}
                    className="ml-auto h-6 w-6 p-0"
                  >
                    {expandedResponsaveis ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-9 flex-1 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      placeholder="Adicionar responsável da equipe"
                    />
                    <Select>
                      <SelectTrigger className="h-9 w-40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
                        <SelectValue placeholder="Papel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comercial">Comercial</SelectItem>
                        <SelectItem value="anamnese">Anamnese</SelectItem>
                        <SelectItem value="suporte">Suporte Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="h-9 px-3">
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Nenhum responsável específico adicionado
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Anexos do Aluno */}
            <StudentAttachments
              studentId={studentId}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
