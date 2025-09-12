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
  Save
} from "lucide-react"
import { toast } from "sonner"

// Importar componentes dos dropdowns
import AnexosDropdown from "./dropdowns/AnexosDropdown"
import ProcessosDropdown from "./dropdowns/ProcessosDropdown"

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

type StudentEditTabsV5Props = {
  student: Student
  studentId: string
  onSave: (data: Partial<Student>) => Promise<void>
  onSaveAddress: (address: Student['address']) => Promise<void>
  onSaveResponsaveis: (responsaveis: any[]) => Promise<void>
}

export default function StudentEditTabsV5({ 
  student, 
  studentId, 
  onSave, 
  onSaveAddress, 
  onSaveResponsaveis 
}: StudentEditTabsV5Props) {
  const [activeTab, setActiveTab] = useState("identificacao")
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: student.name,
    email: student.email,
    phone: student.phone,
    status: student.status,
    birth_date: student.birth_date || '',
    gender: student.gender || '',
    marital_status: student.marital_status || '',
    nationality: student.nationality || '',
    birth_place: student.birth_place || ''
  })

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

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(formData)
      toast.success("Aluno salvo com sucesso!")
    } catch (error) {
      toast.error("Erro ao salvar aluno")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-[1200px]">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-background border-b border-border z-10 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">{student.name}</h2>
            <Badge className={getStatusColor(student.status)}>
              {getStatusLabel(student.status)}
            </Badge>
          </div>
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Linha superior: botões (esquerda) + tabs (abaixo, à esquerda) */}
      <div className="flex flex-col">
        {/* Ações (esquerda) */}
        <div className="flex items-center gap-3 mb-4">
          <AnexosDropdown studentId={studentId} />
          <ProcessosDropdown studentId={studentId} />
        </div>

        {/* Tabs TOTVS-like (parte do formulário) */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
          <TabsList className="h-9">
            <TabsTrigger value="identificacao">Identificação</TabsTrigger>
            <TabsTrigger value="endereco">Endereço</TabsTrigger>
            <TabsTrigger value="responsaveis">Responsáveis</TabsTrigger>
          </TabsList>

          {/* Identificação */}
          <TabsContent value="identificacao" className="pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dados Pessoais */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Dados Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">Nome Completo *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="h-9"
                          placeholder="Digite o nome completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="h-9"
                          placeholder="Digite o email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">Telefone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="h-9"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-sm font-medium">Status *</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as any})}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="onboarding">Onboarding</SelectItem>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="paused">Pausado</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birth_date" className="text-sm font-medium">Data de Nascimento</Label>
                        <Input
                          id="birth_date"
                          type="date"
                          value={formData.birth_date}
                          onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-sm font-medium">Sexo</Label>
                        <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                          <SelectTrigger className="h-9">
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
                          <SelectTrigger className="h-9">
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
                          className="h-9"
                          placeholder="Ex: Brasileira"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birth_place" className="text-sm font-medium">Naturalidade</Label>
                        <Input
                          id="birth_place"
                          value={formData.birth_place}
                          onChange={(e) => setFormData({...formData, birth_place: e.target.value})}
                          className="h-9"
                          placeholder="Ex: São Paulo, SP"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Foto e Infos do Sistema */}
              <div className="space-y-4">
                {/* Foto do Aluno */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Foto do Aluno</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-24 h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8">
                          <Upload className="h-3 w-3 mr-1" />
                          Upload
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
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Sistema</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Criado em {new Date(student.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>ID: {student.id.slice(0, 8)}...</span>
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
          <TabsContent value="endereco" className="pt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Endereço Completo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zip_code" className="text-sm font-medium">CEP *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="zip_code"
                        value={student.address?.zip_code || ''}
                        className="h-9"
                        placeholder="00000-000"
                      />
                      <Button size="sm" className="h-9 px-3">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="street" className="text-sm font-medium">Rua *</Label>
                    <Input
                      id="street"
                      value={student.address?.street || ''}
                      className="h-9"
                      placeholder="Digite o nome da rua"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number" className="text-sm font-medium">Número *</Label>
                    <Input
                      id="number"
                      value={student.address?.number || ''}
                      className="h-9"
                      placeholder="123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complement" className="text-sm font-medium">Complemento</Label>
                    <Input
                      id="complement"
                      value={student.address?.complement || ''}
                      className="h-9"
                      placeholder="Apto, bloco, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood" className="text-sm font-medium">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      value={student.address?.neighborhood || ''}
                      className="h-9"
                      placeholder="Digite o bairro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium">Cidade *</Label>
                    <Input
                      id="city"
                      value={student.address?.city || ''}
                      className="h-9"
                      placeholder="Digite a cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium">Estado *</Label>
                    <Select value={student.address?.state || ''}>
                      <SelectTrigger className="h-9">
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Responsáveis */}
          <TabsContent value="responsaveis" className="pt-4 space-y-4">
            {/* Treinador Principal */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Treinador Principal *</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    value={student.trainer?.name || ''}
                    className="h-9 flex-1"
                    placeholder="Digite o nome do treinador"
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Treinadores de Apoio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-9 flex-1"
                      placeholder="Digite o nome do treinador de apoio"
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Responsáveis Específicos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-9 flex-1"
                      placeholder="Digite o nome do responsável"
                    />
                    <Select>
                      <SelectTrigger className="h-9 w-40">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
