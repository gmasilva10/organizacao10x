"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  MapPin, 
  Users, 
  Calendar,
  Camera,
  Upload
} from "lucide-react"

// Importar componentes das abas
import IdentificacaoTab from "./tabs/IdentificacaoTab"
import EnderecoTab from "./tabs/EnderecoTab"
import ResponsaveisTab from "./tabs/ResponsaveisTab"

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

type StudentEditTabsV4Props = {
  student: Student
  studentId: string
  onSave: (data: Partial<Student>) => Promise<void>
  onSaveAddress: (address: Student['address']) => Promise<void>
  onSaveResponsaveis: (responsaveis: any[]) => Promise<void>
}

export default function StudentEditTabsV4({ 
  student, 
  studentId, 
  onSave, 
  onSaveAddress, 
  onSaveResponsaveis 
}: StudentEditTabsV4Props) {
  const [activeTab, setActiveTab] = useState("identificacao")

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      case 'onboarding': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
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

  return (
    <div className="max-w-[1200px]">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                {/* Inputs de identificação (compactos) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Nome Completo *</label>
                    <input 
                      type="text" 
                      defaultValue={student.name}
                      className="h-9 w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground"
                      placeholder="Digite o nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Email *</label>
                    <input 
                      type="email" 
                      defaultValue={student.email}
                      className="h-9 w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground"
                      placeholder="Digite o email"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Telefone</label>
                    <input 
                      type="tel" 
                      defaultValue={student.phone}
                      className="h-9 w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Status *</label>
                    <select 
                      defaultValue={student.status}
                      className="h-9 w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                    >
                      <option value="onboarding">Onboarding</option>
                      <option value="active">Ativo</option>
                      <option value="paused">Pausado</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Data de Nascimento</label>
                    <input 
                      type="date" 
                      defaultValue={student.birth_date}
                      className="h-9 w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Sexo</label>
                    <select 
                      defaultValue={student.gender}
                      className="h-9 w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                    >
                      <option value="">Selecione o sexo</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Estado Civil</label>
                    <select 
                      defaultValue={student.marital_status}
                      className="h-9 w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                    >
                      <option value="">Selecione o estado civil</option>
                      <option value="solteiro">Solteiro</option>
                      <option value="casado">Casado</option>
                      <option value="divorciado">Divorciado</option>
                      <option value="viuvo">Viúvo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Nacionalidade</label>
                    <input 
                      type="text" 
                      defaultValue={student.nationality}
                      className="h-9 w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground"
                      placeholder="Ex: Brasileira"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Naturalidade</label>
                    <input 
                      type="text" 
                      defaultValue={student.birth_place}
                      className="h-9 w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground"
                      placeholder="Ex: São Paulo, SP"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {/* Foto do Aluno */}
                <div className="space-y-2">
                  <label className="text-[13px] font-medium">Foto do Aluno</label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Sem foto</p>
                    <div className="flex gap-2 justify-center">
                      <button className="flex items-center gap-1 px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md">
                        <Upload className="h-3 w-3" />
                        Upload
                      </button>
                      <button className="flex items-center gap-1 px-3 py-1 text-xs border border-input rounded-md">
                        <Camera className="h-3 w-3" />
                        Câmera
                      </button>
                    </div>
                  </div>
                </div>

                {/* Informações do Sistema */}
                <div className="space-y-2">
                  <label className="text-[13px] font-medium">Informações do Sistema</label>
                  <div className="p-3 bg-muted/50 rounded-md space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Criado em {new Date(student.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>ID: {student.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge className={getStatusColor(student.status)}>
                        {getStatusLabel(student.status)}
                      </Badge>
                    </div>
                    {student.trainer && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>Treinador: {student.trainer.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Endereço */}
          <TabsContent value="endereco" className="pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">CEP *</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        defaultValue={student.address?.zip_code}
                        className="h-9 flex-1 px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground"
                        placeholder="00000-000"
                      />
                      <button className="h-9 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                        Buscar
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Rua *</label>
                    <input 
                      type="text" 
                      defaultValue={student.address?.street}
                      className="h-9 w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground"
                      placeholder="Digite o nome da rua"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Número *</label>
                    <input 
                      type="text" 
                      defaultValue={student.address?.number}
                      className="h-9 w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground"
                      placeholder="123"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Complemento</label>
                    <input 
                      type="text" 
                      defaultValue={student.address?.complement}
                      className="h-9 w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground"
                      placeholder="Apartamento, bloco, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Bairro *</label>
                    <input 
                      type="text" 
                      defaultValue={student.address?.neighborhood}
                      className="h-9 w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground"
                      placeholder="Digite o bairro"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Cidade *</label>
                    <input 
                      type="text" 
                      defaultValue={student.address?.city}
                      className="h-9 w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground"
                      placeholder="Digite a cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Estado *</label>
                    <select 
                      defaultValue={student.address?.state}
                      className="h-9 w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                    >
                      <option value="">Selecione o estado</option>
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Responsáveis */}
          <TabsContent value="responsaveis" className="pt-4 space-y-4">
            <div className="space-y-4">
              {/* Treinador Principal */}
              <div className="space-y-2">
                <label className="text-[13px] font-medium">Treinador Principal *</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    defaultValue={student.trainer?.name || ''}
                    className="h-9 flex-1 px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground"
                    placeholder="Digite o nome do treinador"
                  />
                  <button className="h-9 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                    Buscar
                  </button>
                </div>
                {student.trainer && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Responsável atual: {student.trainer.name}</span>
                  </div>
                )}
              </div>

              {/* Treinadores de Apoio */}
              <div className="space-y-2">
                <label className="text-[13px] font-medium">Treinadores de Apoio</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      className="h-9 flex-1 px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground"
                      placeholder="Digite o nome do treinador de apoio"
                    />
                    <button className="h-9 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                      Adicionar
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Nenhum treinador de apoio adicionado
                  </div>
                </div>
              </div>

              {/* Responsáveis Específicos */}
              <div className="space-y-2">
                <label className="text-[13px] font-medium">Responsáveis Específicos</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      className="h-9 flex-1 px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground"
                      placeholder="Digite o nome do responsável"
                    />
                    <select className="h-9 px-3 py-2 border border-input rounded-md bg-background text-sm">
                      <option value="">Selecione o papel</option>
                      <option value="comercial">Comercial</option>
                      <option value="anamnese">Anamnese</option>
                      <option value="suporte">Suporte Técnico</option>
                    </select>
                    <button className="h-9 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                      Adicionar
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Nenhum responsável específico adicionado
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
