"use client"

import { useState, useRef, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  Users,
  Camera,
  Upload,
  Loader2,
  User2,
  Home,
  Search,
  Plus,
  X,
  Shield,
  Users2
} from "lucide-react"
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils"
import { processImageForUpload, validateImageRequirements, formatFileSize } from "@/utils/image-processing"
import { studentIdentificationSchema, studentAddressSchema, formatZodErrors, validateField } from "@/lib/validators/student-schema"
import ProfessionalSearchModal from "./ProfessionalSearchModal"

type StudentCreatePayload = {
  name: string
  email: string
  phone?: string | null
  status?: 'onboarding' | 'active' | 'paused'
  trainer_id?: string | null
  onboard_opt?: 'nao_enviar' | 'enviar' | 'enviado'
  birth_date?: string
  gender?: 'masculino' | 'feminino' | 'outro'
  marital_status?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo'
  nationality?: string
  birth_place?: string
  photo_url?: string
  address?: {
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
    zip_code: string
  }
  responsibles?: Array<{
    professional_id: string
    roles: string[]
    note?: string
  }>
}

export function StudentCreateModal({
	open,
	onClose,
	onCreate,
	trainers,
}: {
	open: boolean
	onClose: () => void
  onCreate: (payload: StudentCreatePayload) => Promise<void>
	trainers: Array<{ id: string; name: string }>
}) {
  const [activeTab, setActiveTab] = useState("dados-basicos")
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Dados Básicos
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [phone, setPhone] = useState("")
	const [status, setStatus] = useState<'onboarding' | 'active' | 'paused'>("onboarding")
  const [onboardOpt, setOnboardOpt] = useState<'nao_enviar' | 'enviar' | 'enviado'>(
    "onboarding" === 'onboarding' ? 'enviar' : 'nao_enviar'
  )

  // Sincronizar onboard_opt quando status mudar
  useEffect(() => {
    if (status === 'onboarding') {
      setOnboardOpt('enviar')
    } else if (status === 'active' || status === 'paused') {
      setOnboardOpt('nao_enviar')
    }
  }, [status])

  // Informações Pessoais
  const [birthDate, setBirthDate] = useState("")
  const [gender, setGender] = useState("")
  const [maritalStatus, setMaritalStatus] = useState("")
  const [nationality, setNationality] = useState("")
  const [birthPlace, setBirthPlace] = useState("")
  
  // Foto
  const [photoData, setPhotoData] = useState({
    file: null as File | null,
    preview: '',
    uploading: false,
    originalSize: 0,
    processedSize: 0,
    dimensions: { width: 0, height: 0 }
  })

  // Endereço
  const [addressData, setAddressData] = useState({
    zip_code: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  })

  // Responsáveis
  const [responsaveisData, setResponsaveisData] = useState<{
    principal: any | null
    apoio: any[]
    especificos: any[]
  }>({
    principal: null,
    apoio: [],
    especificos: []
  })
  const [responsaveisLoading, setResponsaveisLoading] = useState(false)
  
  // Estados para modais de busca
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [searchModalType, setSearchModalType] = useState<'principal' | 'apoio' | 'especifico'>('principal')

  // Ref para o input de foto
  const fileInputRef = useRef<HTMLInputElement>(null)

	const validEmail = (v: string) => /.+@.+\..+/.test(v)

	function formatPhone(value: string) {
		const digits = value.replace(/\D/g, "").slice(0, 11)
		if (digits.length <= 2) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
	}

	function sanitizePhoneToDigits(value: string) {
		const digits = value.replace(/\D/g, "")
		return digits.length ? digits : ""
	}

  function formatZipCode(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8)
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }

  const handlePhotoUpload = async (file: File) => {
    setPhotoData(prev => ({ ...prev, uploading: true }))
    
    try {
      // Validar requisitos da imagem
      const validation = validateImageRequirements(file)
      if (!validation.isValid) {
        showErrorToast(validation.errors.join(', '))
        return
      }

      // Processar imagem (redimensionar, comprimir)
      const processedImage = await processImageForUpload(file)
      
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
        `Foto processada! ${processedImage.dimensions.width}x${processedImage.dimensions.height}px, ${formatFileSize(processedImage.processedSize)}${compressionRatio > 0 ? ` (${compressionRatio}% menor)` : ''}`
      )
    } catch (error) {
      console.error('Erro ao processar foto:', error)
      showErrorToast(error instanceof Error ? error.message : 'Erro ao processar foto')
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

  // Carregar defaults ao abrir modal
  useEffect(() => {
    if (open) {
      loadDefaults()
    }
  }, [open])

  // Carregar defaults de responsáveis
  const loadDefaults = async () => {
    try {
      setResponsaveisLoading(true)
      const response = await fetch('/api/team/defaults')
      if (response.ok) {
        const data = await response.json()
        setResponsaveisData({
          principal: data.defaults.principal || null,
          apoio: data.defaults.apoio || [],
          especificos: data.defaults.especificos || []
        })
      }
    } catch (error) {
      console.error('Erro ao carregar defaults:', error)
    } finally {
      setResponsaveisLoading(false)
    }
  }

  // Selecionar profissional
  const handleSelectProfessional = (professional: any) => {
    if (searchModalType === 'principal') {
      setResponsaveisData(prev => ({ ...prev, principal: professional }))
    } else if (searchModalType === 'apoio') {
      setResponsaveisData(prev => {
        if (!prev.apoio.find(p => p.id === professional.id)) {
          return { 
            ...prev, 
            apoio: [...prev.apoio, professional] 
          }
        }
        return prev
      })
    } else if (searchModalType === 'especifico') {
      setResponsaveisData(prev => {
        if (!prev.especificos.find(p => p.id === professional.id)) {
          return { 
            ...prev, 
            especificos: [...prev.especificos, professional] 
          }
        }
        return prev
      })
    }
    setSearchModalOpen(false)
  }

  // Remover responsável
  const removeResponsavel = (type: 'principal' | 'apoio' | 'especifico', professionalId: string) => {
    if (type === 'principal') {
      setResponsaveisData(prev => ({ ...prev, principal: null }))
    } else if (type === 'apoio') {
      setResponsaveisData(prev => ({ 
        ...prev, 
        apoio: prev.apoio.filter(p => p.id !== professionalId) 
      }))
    } else if (type === 'especifico') {
      setResponsaveisData(prev => ({ 
        ...prev, 
        especificos: prev.especificos.filter(p => p.id !== professionalId) 
      }))
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

      setAddressData(prev => ({
        ...prev,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || ''
      }))

      showSuccessToast('Endereço preenchido automaticamente!')
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      showErrorToast('Erro ao buscar CEP')
    }
  }

  // Funções de validação Zod
  const validateBasicData = () => {
    try {
      studentIdentificationSchema.parse({
        name, 
        email, 
        phone, 
        status, 
        birth_date: birthDate, 
        gender, 
        marital_status: maritalStatus,
        nationality, 
        birth_place: birthPlace, 
        onboard_opt: onboardOpt
      })
      setValidationErrors({})
      return true
    } catch (error: any) {
      const errors = formatZodErrors(error)
      setValidationErrors(errors)
      return false
    }
  }

  const validateAddressData = () => {
    if (!addressData.zip_code && !addressData.street) return true // Endereço opcional
    try {
      studentAddressSchema.parse(addressData)
      setValidationErrors({})
      return true
    } catch (error: any) {
      const errors = formatZodErrors(error)
      setValidationErrors(errors)
      return false
    }
  }

  // Handlers com validação em tempo real
  const handleNameChange = (value: string) => {
    setName(value)
    const fieldError = validateField(studentIdentificationSchema, 'name', value)
    if (fieldError) {
      setValidationErrors(prev => ({ ...prev, name: fieldError }))
    } else {
      setValidationErrors(prev => { 
        const { name, ...rest } = prev
        return rest 
      })
    }
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    const fieldError = validateField(studentIdentificationSchema, 'email', value)
    if (fieldError) {
      setValidationErrors(prev => ({ ...prev, email: fieldError }))
    } else {
      setValidationErrors(prev => { 
        const { email, ...rest } = prev
        return rest 
      })
    }
  }

  const handlePhoneChange = (value: string) => {
    setPhone(value)
    const fieldError = validateField(studentIdentificationSchema, 'phone', value)
    if (fieldError) {
      setValidationErrors(prev => ({ ...prev, phone: fieldError }))
    } else {
      setValidationErrors(prev => { 
        const { phone, ...rest } = prev
        return rest 
      })
    }
  }

  // Handlers para validação de endereço
  const handleZipCodeChange = (value: string) => {
    setAddressData({ ...addressData, zip_code: value })
    const fieldError = validateField(studentAddressSchema, 'zip_code', value)
    if (fieldError) {
      setValidationErrors(prev => ({ ...prev, 'address.zip_code': fieldError }))
    } else {
      setValidationErrors(prev => { 
        const { 'address.zip_code': _, ...rest } = prev
        return rest 
      })
    }
  }

  const handleStreetChange = (value: string) => {
    setAddressData({ ...addressData, street: value })
    const fieldError = validateField(studentAddressSchema, 'street', value)
    if (fieldError) {
      setValidationErrors(prev => ({ ...prev, 'address.street': fieldError }))
    } else {
      setValidationErrors(prev => { 
        const { 'address.street': _, ...rest } = prev
        return rest 
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
    
    // Validar dados básicos com Zod
    if (!validateBasicData()) {
      showErrorToast('Por favor, corrija os erros antes de salvar')
      setActiveTab("dados-basicos") // Voltar para aba com erro
      return
    }

    // Validar dados de endereço se preenchidos
    if (!validateAddressData()) {
      showErrorToast('Por favor, corrija os erros de endereço antes de salvar')
      setActiveTab("endereco") // Voltar para aba de endereço
      return
    }

		setLoading(true)
		try {
      const payload: StudentCreatePayload = {
				name,
				email,
				phone: sanitizePhoneToDigits(phone) || null,
				status,
				onboard_opt: onboardOpt,
        birth_date: birthDate || undefined,
        gender: (gender as any) || undefined,
        marital_status: (maritalStatus as any) || undefined,
        nationality: nationality || undefined,
        birth_place: birthPlace || undefined,
      }

      console.log('[CREATE STUDENT] Dados enviados:', { 
        name, 
        email, 
        status, 
        onboard_opt: onboardOpt,
        synced: status === 'onboarding' ? onboardOpt === 'enviar' : true,
        timestamp: new Date().toISOString() 
      })

      // Adicionar responsáveis se algum foi selecionado
      const responsibles = [
        ...(responsaveisData.principal ? [{
          professional_id: responsaveisData.principal.id,
          roles: ['principal']
        }] : []),
        ...responsaveisData.apoio.map(p => ({
          professional_id: p.id,
          roles: ['apoio']
        })),
        ...responsaveisData.especificos.map(p => ({
          professional_id: p.id,
          roles: ['especifico']
        }))
      ]

      if (responsibles.length > 0) {
        payload.responsibles = responsibles
      }

      // Adicionar endereço se algum campo foi preenchido
      if (addressData.zip_code || addressData.street || addressData.city) {
        payload.address = addressData
      }

      // Se há foto, fazer upload primeiro
      if (photoData.file) {
        try {
          const formData = new FormData()
          formData.append('file', photoData.file)
          // Vamos usar um ID temporário e substituir depois que o aluno for criado
          formData.append('studentId', 'temp-' + Date.now())
          
          const response = await fetch('/api/upload/photo', {
            method: 'POST',
            body: formData
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.photo_url) {
              payload.photo_url = result.photo_url
            }
          }
        } catch (error) {
          console.error('Erro no upload da foto:', error)
          // Continuar mesmo se o upload falhar
        }
      }

      await onCreate(payload)

      // Resetar formulário
			setName("")
			setEmail("")
			setPhone("")
			setStatus("onboarding")
			setOnboardOpt("nao_enviar")
      setBirthDate("")
      setGender("")
      setMaritalStatus("")
      setNationality("")
      setBirthPlace("")
      setPhotoData({ file: null, preview: '', uploading: false, originalSize: 0, processedSize: 0, dimensions: { width: 0, height: 0 } })
      setAddressData({
        zip_code: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: ''
      })
      setResponsaveisData({
        principal: null,
        apoio: [],
        especificos: []
      })
      setActiveTab("dados-basicos")
      
			onClose()
    } catch (error) {
      console.error('Erro ao criar aluno:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

	return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Novo Aluno
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do novo aluno. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="flex-shrink-0 grid w-full grid-cols-4">
              <TabsTrigger value="dados-basicos" className="flex items-center gap-2">
                <User2 className="h-4 w-4" />
                <span className="hidden sm:inline">Dados Básicos</span>
                <span className="sm:hidden">Dados</span>
              </TabsTrigger>
              <TabsTrigger value="info-pessoais" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Info. Pessoais</span>
                <span className="sm:hidden">Info</span>
              </TabsTrigger>
              <TabsTrigger value="endereco" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Endereço</span>
                <span className="sm:hidden">End.</span>
              </TabsTrigger>
              <TabsTrigger value="responsaveis" className="flex items-center gap-2">
                <Users2 className="h-4 w-4" />
                <span className="hidden sm:inline">Responsáveis</span>
                <span className="sm:hidden">Resp.</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-1">
              {/* TAB 1: DADOS BÁSICOS */}
              <TabsContent value="dados-basicos" className="mt-6 h-full">
                <div className="space-y-6">
                  {/* Seção: Informações Essenciais */}
                  <div>
                <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                  📝 Informações Essenciais
                </h3>
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="mb-2 block">
                        Nome Completo *
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="Ex: João Silva"
                          className="pl-10"
                          required
                          disabled={loading}
                          aria-invalid={!!validationErrors.name}
                          aria-describedby={validationErrors.name ? "name-error" : undefined}
                        />
                      </div>
                      {validationErrors.name && (
                        <p id="name-error" className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email" className="mb-2 block">
                        E-mail *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          placeholder="Ex: joao@email.com"
                          className="pl-10"
                          required
                          disabled={loading}
                          aria-invalid={!!validationErrors.email}
                          aria-describedby={validationErrors.email ? "email-error" : undefined}
                        />
                      </div>
                      {validationErrors.email && (
                        <p id="email-error" className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="mb-2 block">
                      Telefone
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => handlePhoneChange(formatPhone(e.target.value))}
                        placeholder="(11) 91234-5678"
                        className="pl-10"
                        disabled={loading}
                        aria-invalid={!!validationErrors.phone}
                        aria-describedby={validationErrors.phone ? "phone-error" : undefined}
                      />
                    </div>
                    {validationErrors.phone && (
                      <p id="phone-error" className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Seção: Configurações Iniciais */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                  ⚙️ Configurações Iniciais
                </h3>
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status" className="mb-2 block">
                        Status Inicial
                      </Label>
                      <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="onboarding">Onboarding</SelectItem>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="paused">Pausado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="onboard" className="mb-2 block">
                        Fluxo de Onboarding
                      </Label>
                      <Select value={onboardOpt} onValueChange={(v: any) => setOnboardOpt(v)}>
                        <SelectTrigger id="onboard">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao_enviar">Não enviar</SelectItem>
                          <SelectItem value="enviar">Enviar</SelectItem>
                          <SelectItem value="enviado" disabled>Enviado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações Contextuais */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                  ℹ️ Informações
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Os campos marcados com (*) são obrigatórios.</p>
                  <p>Você pode preencher as demais informações nas próximas abas.</p>
                </div>
              </div>
                </div>
              </TabsContent>

              {/* TAB 2: INFORMAÇÕES PESSOAIS */}
              <TabsContent value="info-pessoais" className="mt-6 h-full">
                <div className="space-y-6">
                  {/* Seção: Dados Pessoais */}
                  <div>
                <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                  👤 Dados Pessoais
                </h3>
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="birth_date" className="mb-2 block">
                        Data de Nascimento
                      </Label>
                      <Input
                        id="birth_date"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="gender" className="mb-2 block">
                        Gênero
                      </Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="feminino">Feminino</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="marital_status" className="mb-2 block">
                        Estado Civil
                      </Label>
                      <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                        <SelectTrigger id="marital_status">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="casado">Casado(a)</SelectItem>
                          <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                          <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="nationality" className="mb-2 block">
                        Nacionalidade
                      </Label>
                      <Input
                        id="nationality"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        placeholder="Ex: Brasileira"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="birth_place" className="mb-2 block">
                      Local de Nascimento
                    </Label>
                    <Input
                      id="birth_place"
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      placeholder="Ex: São Paulo, SP"
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Foto */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                  📷 Foto do Aluno
                </h3>
                <div className="border rounded-lg p-4">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-32 h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/20 overflow-hidden">
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
                        ref={fileInputRef}
                        id="photo-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={photoData.uploading}
                      >
                        {photoData.uploading ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Upload className="h-3 w-3 mr-1" />
                        )}
                        {photoData.uploading ? 'Enviando...' : 'Escolher Foto'}
                      </Button>
                      {photoData.preview && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => setPhotoData({ file: null, preview: '', uploading: false, originalSize: 0, processedSize: 0, dimensions: { width: 0, height: 0 } })}
                        >
                          Remover
                        </Button>
                      )}
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
                </div>
              </div>
                </div>
              </TabsContent>

              {/* TAB 3: ENDEREÇO */}
              <TabsContent value="endereco" className="mt-6 h-full">
                <div className="space-y-6">
                  {/* Seção: Localização */}
                  <div>
                <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                  🏠 Endereço Completo
                </h3>
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="zip_code" className="mb-2 block">
                        CEP
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="zip_code"
                          value={addressData.zip_code}
                          onChange={(e) => handleZipCodeChange(formatZipCode(e.target.value))}
                          placeholder="00000-000"
                          maxLength={9}
                          aria-invalid={!!validationErrors['address.zip_code']}
                          aria-describedby={validationErrors['address.zip_code'] ? "zip_code-error" : undefined}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCepSearch}
                        >
                          Buscar
                        </Button>
                      </div>
                      {validationErrors['address.zip_code'] && (
                        <p id="zip_code-error" className="mt-1 text-sm text-red-600">{validationErrors['address.zip_code']}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="street" className="mb-2 block">
                        Rua/Avenida
                      </Label>
                      <Input
                        id="street"
                        value={addressData.street}
                        onChange={(e) => handleStreetChange(e.target.value)}
                        placeholder="Ex: Rua das Flores"
                        aria-invalid={!!validationErrors['address.street']}
                        aria-describedby={validationErrors['address.street'] ? "street-error" : undefined}
                      />
                      {validationErrors['address.street'] && (
                        <p id="street-error" className="mt-1 text-sm text-red-600">{validationErrors['address.street']}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
                      <Label htmlFor="number" className="mb-2 block">
                        Número
                      </Label>
                      <Input
                        id="number"
                        value={addressData.number}
                        onChange={(e) => setAddressData({ ...addressData, number: e.target.value })}
                        placeholder="123"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="complement" className="mb-2 block">
                        Complemento
                      </Label>
                      <Input
                        id="complement"
                        value={addressData.complement}
                        onChange={(e) => setAddressData({ ...addressData, complement: e.target.value })}
                        placeholder="Ex: Apto 45, Bloco B"
                      />
                    </div>
					</div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
                      <Label htmlFor="neighborhood" className="mb-2 block">
                        Bairro
                      </Label>
                      <Input
                        id="neighborhood"
                        value={addressData.neighborhood}
                        onChange={(e) => setAddressData({ ...addressData, neighborhood: e.target.value })}
                        placeholder="Ex: Centro"
                      />
					</div>

					<div>
                      <Label htmlFor="city" className="mb-2 block">
                        Cidade
                      </Label>
                      <Input
                        id="city"
                        value={addressData.city}
                        onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                        placeholder="Ex: São Paulo"
                      />
					</div>

					<div>
                      <Label htmlFor="state" className="mb-2 block">
                        Estado
                      </Label>
                      <Select 
                        value={addressData.state} 
                        onValueChange={(v) => setAddressData({ ...addressData, state: v })}
                      >
                        <SelectTrigger id="state">
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AC">AC</SelectItem>
                          <SelectItem value="AL">AL</SelectItem>
                          <SelectItem value="AP">AP</SelectItem>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="BA">BA</SelectItem>
                          <SelectItem value="CE">CE</SelectItem>
                          <SelectItem value="DF">DF</SelectItem>
                          <SelectItem value="ES">ES</SelectItem>
                          <SelectItem value="GO">GO</SelectItem>
                          <SelectItem value="MA">MA</SelectItem>
                          <SelectItem value="MT">MT</SelectItem>
                          <SelectItem value="MS">MS</SelectItem>
                          <SelectItem value="MG">MG</SelectItem>
                          <SelectItem value="PA">PA</SelectItem>
                          <SelectItem value="PB">PB</SelectItem>
                          <SelectItem value="PR">PR</SelectItem>
                          <SelectItem value="PE">PE</SelectItem>
                          <SelectItem value="PI">PI</SelectItem>
                          <SelectItem value="RJ">RJ</SelectItem>
                          <SelectItem value="RN">RN</SelectItem>
                          <SelectItem value="RS">RS</SelectItem>
                          <SelectItem value="RO">RO</SelectItem>
                          <SelectItem value="RR">RR</SelectItem>
                          <SelectItem value="SC">SC</SelectItem>
                          <SelectItem value="SP">SP</SelectItem>
                          <SelectItem value="SE">SE</SelectItem>
                          <SelectItem value="TO">TO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
					</div>

              {/* Informações Contextuais */}
					<div>
                <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                  ℹ️ Informações
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Preencha o CEP e clique em "Buscar" para preencher automaticamente.</p>
                  <p>Todos os campos de endereço são opcionais.</p>
                </div>
					</div>
                </div>
              </TabsContent>

              {/* TAB 4: RESPONSÁVEIS */}
              <TabsContent value="responsaveis" className="mt-6 h-full">
                <div className="space-y-6">
                  {responsaveisLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Carregando defaults...</span>
                    </div>
                  ) : (
                    <>
                      {/* Treinador Principal */}
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                          <Shield className="h-4 w-4 text-green-600" />
                          Treinador Principal
                        </h3>
                        <div className="border rounded-lg p-4">
                          {responsaveisData.principal ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{responsaveisData.principal.full_name}</p>
                                  <p className="text-sm text-muted-foreground">{responsaveisData.principal.email}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSearchModalType('principal')
                                    setSearchModalOpen(true)
                                  }}
                                >
                                  <Search className="h-3 w-3 mr-1" />
                                  Alterar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeResponsavel('principal', responsaveisData.principal.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input disabled placeholder="Nenhum treinador principal definido" />
                              <Button onClick={() => {
                                setSearchModalType('principal')
                                setSearchModalOpen(true)
                              }}>
                                Selecionar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Treinadores de Apoio */}
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                          <Users className="h-4 w-4 text-blue-600" />
                          Treinadores de Apoio
                        </h3>
                        <div className="border rounded-lg p-4">
                          {responsaveisData.apoio.length > 0 ? (
                            <div className="space-y-3">
                              {responsaveisData.apoio.map((trainer, index) => (
                                <div key={trainer.id} className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                      <Users className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{trainer.full_name}</p>
                                      <p className="text-sm text-muted-foreground">{trainer.email}</p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeResponsavel('apoio', trainer.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-muted-foreground">
                              Nenhum treinador de apoio adicionado
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-3"
                            onClick={() => {
                              setSearchModalType('apoio')
                              setSearchModalOpen(true)
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar Treinador de Apoio
                          </Button>
                        </div>
                      </div>

                      {/* Responsáveis Específicos */}
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                          <Users2 className="h-4 w-4 text-purple-600" />
                          Responsáveis Específicos
                        </h3>
                        <div className="border rounded-lg p-4">
                          {responsaveisData.especificos.length > 0 ? (
                            <div className="space-y-3">
                              {responsaveisData.especificos.map((trainer, index) => (
                                <div key={trainer.id} className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                      <Users2 className="h-4 w-4 text-purple-600" />
					</div>
					<div>
                                      <p className="font-medium">{trainer.full_name}</p>
                                      <p className="text-sm text-muted-foreground">{trainer.email}</p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeResponsavel('especifico', trainer.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-muted-foreground">
                              Nenhum responsável específico adicionado
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-3"
                            onClick={() => {
                              setSearchModalType('especifico')
                              setSearchModalOpen(true)
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar Responsável Específico
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

            </div>
          </Tabs>

          <DialogFooter className="flex-shrink-0 mt-0 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !name || !validEmail(email)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  Criar Aluno
                </>
              )}
            </Button>
          </DialogFooter>
        </form>

        {/* Modal de busca de profissionais */}
        <ProfessionalSearchModal
          open={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          onSelect={handleSelectProfessional}
        />
      </DialogContent>
    </Dialog>
  )
}
