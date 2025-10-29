"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
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
import { processImageForUpload, validateImageRequirements, formatFileSize } from "@/utils/image-processing"
import { studentIdentificationSchema, studentAddressSchema, formatZodErrors } from "@/lib/validators/student-schema"
// import { ImageCropModal } from "@/components/ui/ImageCropModal" // Removido - processamento direto

// Importar componentes compartilhados
import StudentActions from "./shared/StudentActions"
import RelationshipTimeline from "../relationship/RelationshipTimeline"
import ProfessionalSearchModal from "./ProfessionalSearchModal"
import FinancialTab from "./FinancialTab"

type Student = {
  id: string
  name: string
  email: string
  phone: string
  status: 'onboarding' | 'active' | 'paused' | 'inactive'
  created_at: string
  birth_date?: string
  first_workout_date?: string
  last_workout_date?: string
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
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("identificacao")
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: student.name,
    email: student.email,
    phone: student.phone,
    status: student.status,
    birth_date: student.birth_date || '',
    first_workout_date: student.first_workout_date || '',
    last_workout_date: student.last_workout_date || '',
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
    principal: null as any,
    apoio: [] as any[],
    especificos: [] as any[]
  })
  const [responsaveisLoading, setResponsaveisLoading] = useState(false)

  const [photoData, setPhotoData] = useState({
    file: null as File | null,
    preview: student?.photo_url || '',
    uploading: false,
    originalSize: 0,
    processedSize: 0,
    dimensions: { width: 0, height: 0 }
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const currentYear = new Date().getFullYear()
  const minBirthDate = '1900-01-01'
  const maxBirthDate = `${currentYear}-12-31`

  function handleBirthDateChange(v: string) {
    const m = /^(\d{4,})-(\d{2})-(\d{2})$/.exec(v)
    if (m) {
      const yearStr = m[1].slice(0, 4)
      let year = Number(yearStr)
      const mm = m[2]
      const dd = m[3]
      if (Number.isFinite(year)) {
        if (year < 1900) year = 1900
        if (year > currentYear) year = currentYear
        setFormData({...formData, birth_date: `${String(year).padStart(4, '0')}-${mm}-${dd}`})
        return
      }
    }
    setFormData({...formData, birth_date: v})
  }
  
  // Estados para modais de busca
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [searchModalType, setSearchModalType] = useState<'principal' | 'apoio' | 'especifico'>('principal')
  
  // Estados para modal de crop de imagem
  // Estados do modal de crop removidos - processamento direto
  
  // Função setModalState removida - processamento direto
  
  // Detectar parâmetro action da URL
  const actionParam = searchParams.get('action')
  const [openModal, setOpenModal] = useState<'gerar-anamnese' | null>(null)
  
  useEffect(() => {
    if (actionParam === 'gerar-anamnese') {
      setOpenModal('gerar-anamnese')
      // Limpar o parâmetro da URL após abrir o modal
      const url = new URL(window.location.href)
      url.searchParams.delete('action')
      window.history.replaceState({}, '', url.toString())
    }
  }, [actionParam])

  // Carregar responsáveis do aluno
  const loadResponsaveis = async () => {
    try {
      setResponsaveisLoading(true)
      
      // Carregar responsáveis atuais
      const response = await fetch(`/api/students/${studentId}/responsibles`)
      if (!response.ok) throw new Error('Erro ao carregar responsáveis')
      
      const data = await response.json()
      
      // Se não há responsáveis, carregar defaults do Equipe
      if (data.total === 0) {
        const defaultsResponse = await fetch('/api/team/defaults')
        if (defaultsResponse.ok) {
          const defaultsData = await defaultsResponse.json()
          setResponsaveisData({
            principal: defaultsData.defaults.principal || null,
            apoio: defaultsData.defaults.apoio || [],
            especificos: defaultsData.defaults.especificos || []
          })
          return
        }
      }
      
      setResponsaveisData({
        principal: data.responsibles.principal[0] || null,
        apoio: data.responsibles.apoio || [],
        especificos: data.responsibles.especificos || []
      })
    } catch (error) {
      console.error('Erro ao carregar responsáveis:', error)
      showErrorToast('Erro ao carregar responsáveis')
    } finally {
      setResponsaveisLoading(false)
    }
  }

  // Adicionar responsável
  const addResponsavel = async (role: 'principal' | 'apoio' | 'especifico', professional: any, note?: string) => {
    try {
      const response = await fetch(`/api/students/${studentId}/responsibles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, professional_id: professional.id, note })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao adicionar responsável')
      }

      const data = await response.json()
      
      // Atualizar estado local
      if (role === 'principal') {
        setResponsaveisData(prev => ({ ...prev, principal: data.responsible }))
      } else if (role === 'apoio') {
        setResponsaveisData(prev => ({ ...prev, apoio: [...prev.apoio, data.responsible] }))
      } else {
        setResponsaveisData(prev => ({ ...prev, especificos: [...prev.especificos, data.responsible] }))
      }

      showSuccessToast('Responsável adicionado com sucesso')
    } catch (error: any) {
      console.error('Erro ao adicionar responsável:', error)
      showErrorToast(error.message || 'Erro ao adicionar responsável')
    }
  }

  // Remover responsável
  const removeResponsavel = async (responsibleId: string, role: 'principal' | 'apoio' | 'especifico') => {
    try {
      const response = await fetch(`/api/students/${studentId}/responsibles/${responsibleId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao remover responsável')
      }

      // Atualizar estado local
      if (role === 'principal') {
        setResponsaveisData(prev => ({ ...prev, principal: null }))
      } else if (role === 'apoio') {
        setResponsaveisData(prev => ({ ...prev, apoio: prev.apoio.filter(r => r.id !== responsibleId) }))
      } else {
        setResponsaveisData(prev => ({ ...prev, especificos: prev.especificos.filter(r => r.id !== responsibleId) }))
      }

      showSuccessToast('Responsável removido com sucesso')
    } catch (error: any) {
      console.error('Erro ao remover responsável:', error)
      showErrorToast(error.message || 'Erro ao remover responsável')
    }
  }

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
    try {
      // Preparar dados para validação: transformar strings vazias em undefined
      const dataToValidate = {
        ...formData,
        // Campos opcionais: transformar string vazia em undefined
        gender: formData.gender === '' ? undefined : formData.gender,
        marital_status: formData.marital_status === '' ? undefined : formData.marital_status,
        nationality: formData.nationality === '' ? undefined : formData.nationality,
        birth_place: formData.birth_place === '' ? undefined : formData.birth_place,
        birth_date: formData.birth_date === '' ? undefined : formData.birth_date,
        first_workout_date: formData.first_workout_date === '' ? undefined : formData.first_workout_date,
        last_workout_date: formData.last_workout_date === '' ? undefined : formData.last_workout_date,
      }
      
      // Validar dados de identificação com Zod
      studentIdentificationSchema.parse(dataToValidate)
      
      // Limpar erros se validação passar
      setValidationErrors({})
      return true
    } catch (error: any) {
      // Formatar erros do Zod
      const errors = formatZodErrors(error)
      setValidationErrors(errors)
      
      // Log detalhado para debug
      console.error('🔍 Erro de validação Zod:', errors)
      
      return false
    }
  }

  const validateAddress = () => {
    try {
      // Validar endereço com Zod (opcional)
      studentAddressSchema.parse(addressData)
      setValidationErrors({})
      return true
    } catch (error: any) {
      const errors = formatZodErrors(error)
      setValidationErrors(errors)
      return false
    }
  }

  const handleSave = async () => {
    if (!validateForm()) {
      // Verificar se há erros de validação específicos
      const errorFields = Object.keys(validationErrors)
      if (errorFields.length > 0) {
        const firstField = errorFields[0]
        const errorMessage = validationErrors[firstField]
        console.error('❌ Erro de validação:', { field: firstField, message: errorMessage })
        
        // Mensagem mais específica
        const fieldLabels: Record<string, string> = {
          name: 'Nome Completo',
          email: 'Email',
          phone: 'Telefone',
          status: 'Status',
          gender: 'Sexo',
          marital_status: 'Estado Civil',
          nationality: 'Nacionalidade',
          birth_place: 'Naturalidade'
        }
        
        const fieldLabel = fieldLabels[firstField] || firstField
        showErrorToast(`${fieldLabel}: ${errorMessage}`)
      } else {
        showErrorToast('Por favor, corrija os erros antes de salvar')
      }
      return
    }
    
    setSaving(true)
    try {
      let photoUrl = photoData.preview
      
      // Se há uma foto nova (blob), fazer upload primeiro
      if (photoData.file && photoData.preview.startsWith('blob:')) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', photoData.file)
        uploadFormData.append('studentId', student.id)
        
        const uploadResponse = await fetch('/api/upload/photo', {
          method: 'POST',
          body: uploadFormData
        })
        
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json()
          throw new Error(error.error || 'Erro ao fazer upload da foto')
        }
        
        const uploadData = await uploadResponse.json()
        photoUrl = uploadData.photo_url
      }
      
      // Preparar dados completos para salvamento
      const saveData = {
        ...formData,
        address: addressData,
        trainer_id: (responsaveisData as any).trainer_principal_id,
        // Incluir photo_url se disponível
        ...(photoUrl && { photo_url: photoUrl })
      }
      
      await onSave(saveData as any)
      setValidationErrors({})
      
      // Atualizar estado local com a URL final
      if (photoUrl) {
        setPhotoData(prev => ({ ...prev, preview: photoUrl }))
      }
      
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
    try {
      console.log('📸 Iniciando upload de foto:', file.name)
      
      // Validar requisitos da imagem
      const validation = validateImageRequirements(file)
      if (!validation.isValid) {
        showErrorToast(validation.errors.join(', '))
        return
      }

      console.log('✅ Validação passou, processando diretamente')
      
      // Processar imagem diretamente sem modal de crop
      const processedImage = await processImageForUpload(file, true) // true = forçar quadrado
      
      // Atualizar estado com imagem processada
      setPhotoData(prev => ({
        ...prev,
        file: processedImage.file,
        preview: processedImage.previewUrl,
        originalSize: processedImage.originalSize,
        processedSize: processedImage.processedSize,
        dimensions: processedImage.dimensions
      }))
      
      // Feedback de sucesso com informações do processamento
      const compressionRatio = Math.round((1 - processedImage.processedSize / processedImage.originalSize) * 100)
      showSuccessToast(
        `Foto carregada! ${processedImage.dimensions.width}x${processedImage.dimensions.height}px, ${formatFileSize(processedImage.processedSize)}${compressionRatio > 0 ? ` (${compressionRatio}% menor)` : ''}`
      )
      
    } catch (error) {
      console.error('Erro ao processar imagem:', error)
      showErrorToast('Erro ao processar a imagem. Tente novamente.')
    }
  }

  // Função chamada quando o crop é finalizado
  // Função handleCropComplete removida - processamento direto

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔄 handleFileInputChange chamado')
    const file = e.target.files?.[0]
    if (file) {
      console.log('📁 Arquivo selecionado:', file.name)
      console.log('🎯 Chamando handlePhotoUpload...')
      handlePhotoUpload(file)
    } else {
      console.log('❌ Nenhum arquivo selecionado')
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

  const handleSearchProfessional = (type: 'principal' | 'apoio' | 'especifico') => {
    setSearchModalType(type)
    setSearchModalOpen(true)
  }

  const handleSelectProfessional = (professional: any) => {
    addResponsavel(searchModalType, professional)
    setSearchModalOpen(false)
  }

  // useEffect do modal removido - processamento direto

  // Carregar responsáveis quando o componente montar
  useEffect(() => {
    console.log('🔄 useEffect loadResponsaveis chamado, studentId:', studentId)
    loadResponsaveis()
  }, [studentId])

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
              studentPhone={student.phone}
              studentData={{
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                status: formData.status,
                birth_date: formData.birth_date,
                gender: formData.gender,
                marital_status: formData.marital_status,
                nationality: formData.nationality,
                birth_place: formData.birth_place
              }}
              variant="edit"
              openModal={openModal}
              onActionComplete={(actionType?: string) => {
                // Callback para atualizar dados após ações
                console.log('Ação completada, dados podem ser atualizados')
                setOpenModal(null) // Limpar modal após ação
                
                // Se a ação foi de exclusão, redirecionar para a listagem
                if (actionType === 'delete') {
                  window.location.href = '/app/students'
                }
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
              disabled={saving}
              aria-label="Cancelar edição"
            >
              Cancelar
            </Button>
            <Button 
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={handleSave}
              aria-label="Aplicar alterações sem sair da tela"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Aplicar
                </>
              )}
            </Button>
            <Button 
              size="sm"
              disabled={saving}
              onClick={async () => {
                await handleSave()
                onSaveAndRedirect?.()
              }}
              aria-label="Salvar e voltar para a lista de alunos"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Salvar e Voltar
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
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
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
                          className={`h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                            validationErrors.phone ? 'border-red-500 focus:border-red-500' : ''
                          }`}
                          placeholder="(11) 99999-9999"
                        />
                        {validationErrors.phone && (
                          <p className="text-sm text-red-600">{validationErrors.phone}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-sm font-medium">Status *</Label>
                        <Select value={formData.status} onValueChange={(value: string) => setFormData({...formData, status: value as any})}>
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
                          min={minBirthDate}
                          max={maxBirthDate}
                          onChange={(e) => handleBirthDateChange(e.target.value)}
                          className="h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                          title={`Selecione uma data entre ${minBirthDate} e ${maxBirthDate}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="first_workout_date" className="text-sm font-medium">Primeiro Treino</Label>
                        <Input
                          id="first_workout_date"
                          type="date"
                          value={formData.first_workout_date}
                          onChange={(e) => setFormData({...formData, first_workout_date: e.target.value})}
                          className="h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_workout_date" className="text-sm font-medium">Último Treino</Label>
                        <Input
                          id="last_workout_date"
                          type="date"
                          value={formData.last_workout_date}
                          onChange={(e) => setFormData({...formData, last_workout_date: e.target.value})}
                          className="h-9 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-sm font-medium">Sexo</Label>
                        <Select value={formData.gender} onValueChange={(value: string) => setFormData({...formData, gender: value})}>
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
                        <Select value={formData.marital_status} onValueChange={(value: string) => setFormData({...formData, marital_status: value})}>
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
                        <Select value={formData.onboard_opt} onValueChange={(value: string) => setFormData({...formData, onboard_opt: value as 'nao_enviar' | 'enviar' | 'enviado'})}>
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
                      <div className="text-xs text-muted-foreground text-center space-y-1">
                        <p>Formatos: JPG, PNG, WEBP (máx. 2MB)</p>
                        {photoData.dimensions.width > 0 && photoData.dimensions.height > 0 && (
                          <p className="text-primary font-medium">
                            {photoData.dimensions.width}×{photoData.dimensions.height}px • {formatFileSize(photoData.processedSize)}
                          </p>
                        )}
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
                      <span>Criado em {student.created_at ? new Date(student.created_at).toLocaleDateString('pt-BR') : 'Data não disponível'}</span>
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
                    <Select value={addressData.state} onValueChange={(value: string) => setAddressData({...addressData, state: value})}>
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
            {responsaveisLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Carregando responsáveis...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Treinador Principal */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Treinador Principal
                      {!responsaveisData.principal && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                          Recomendado
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {responsaveisData.principal ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-green-900">{responsaveisData.principal?.professionals?.full_name ?? responsaveisData.principal?.full_name ?? 'Profissional'}</p>
                            <p className="text-sm text-green-700">{responsaveisData.principal?.professionals?.email ?? responsaveisData.principal?.email ?? ''}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeResponsavel(responsaveisData.principal.id, 'principal')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          className="h-9 flex-1"
                          placeholder="Nenhum treinador principal definido"
                          disabled
                        />
                        <Button 
                          size="sm" 
                          className="h-9 px-3"
                          onClick={() => handleSearchProfessional('principal')}
                        >
                          <Search className="h-4 w-4 mr-1" />
                          Selecionar
                        </Button>
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
                      <Badge variant="secondary" className="text-xs">
                        {responsaveisData.apoio.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {responsaveisData.apoio.length > 0 ? (
                        <div className="space-y-2">
                          {responsaveisData.apoio.map((responsavel) => (
                            <div key={responsavel.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-blue-900">{responsavel.professionals?.full_name ?? responsavel.full_name ?? 'Profissional'}</p>
                                  <p className="text-sm text-blue-700">{responsavel.professionals?.email ?? responsavel.email ?? ''}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeResponsavel(responsavel.id, 'apoio')}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>Nenhum treinador de apoio adicionado</p>
                        </div>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleSearchProfessional('apoio')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Treinador de Apoio
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Responsáveis Específicos */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users2 className="h-5 w-5 text-primary" />
                      Responsáveis Específicos
                      <Badge variant="secondary" className="text-xs">
                        {responsaveisData.especificos.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {responsaveisData.especificos.length > 0 ? (
                        <div className="space-y-2">
                          {responsaveisData.especificos.map((responsavel) => (
                            <div key={responsavel.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                  <Users2 className="h-5 w-5 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-purple-900">{responsavel.professionals?.full_name ?? responsavel.full_name ?? 'Profissional'}</p>
                                  <p className="text-sm text-purple-700">{responsavel.professionals?.email ?? responsavel.email ?? ''}</p>
                                  {responsavel.note && (
                                    <p className="text-xs text-purple-600 mt-1 italic">"{responsavel.note}"</p>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeResponsavel(responsavel.id, 'especifico')}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <Users2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>Nenhum responsável específico adicionado</p>
                        </div>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleSearchProfessional('especifico')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Responsável Específico
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              </>
            )}
          </TabsContent>

          {/* Financeiro */}
          <TabsContent value="financeiro" className="pt-6">
            <FinancialTab studentId={studentId} studentName={formData.name} />
          </TabsContent>

        </Tabs>

        {/* Modal de Busca de Profissionais */}
        <ProfessionalSearchModal
          open={searchModalOpen}
          onOpenChange={setSearchModalOpen}
          onSelect={handleSelectProfessional}
          title={
            searchModalType === 'principal' ? 'Selecionar Treinador Principal' :
            searchModalType === 'apoio' ? 'Adicionar Treinador de Apoio' :
            'Adicionar Responsável Específico'
          }
          placeholder="Buscar profissional ativo..."
        />

        {/* Modal de Crop removido - processamento direto */}
      </div>
    </div>
  )
}
