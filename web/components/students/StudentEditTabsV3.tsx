"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { 
  User, 
  MapPin, 
  Users, 
  FileText, 
  Target,
  ChevronDown,
  AlertTriangle,
  Dumbbell
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

type StudentEditTabsV3Props = {
  student: Student
  studentId: string
  onSave: (data: Partial<Student>) => Promise<void>
  onSaveAddress: (address: Student['address']) => Promise<void>
  onSaveResponsaveis: (responsaveis: any[]) => Promise<void>
}

export default function StudentEditTabsV3({ 
  student, 
  studentId, 
  onSave, 
  onSaveAddress, 
  onSaveResponsaveis 
}: StudentEditTabsV3Props) {
  const [activeTab, setActiveTab] = useState("identificacao")

  return (
    <div className="space-y-6">
      {/* Header com Tabs e Botões Suspensos */}
      <div className="flex items-center justify-between">
        {/* Tabs do Cadastro */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="identificacao" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Identificação
            </TabsTrigger>
            <TabsTrigger value="endereco" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço
            </TabsTrigger>
            <TabsTrigger value="responsaveis" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Responsáveis
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Botões Suspensos */}
        <div className="flex gap-2">
          {/* Botão Anexos */}
          <AnexosDropdown studentId={studentId} />

          {/* Botão Processos */}
          <ProcessosDropdown studentId={studentId} />
        </div>
      </div>

      {/* Conteúdo das Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Tab: Identificação */}
        <TabsContent value="identificacao" className="mt-6">
          <IdentificacaoTab 
            student={student} 
            onSave={onSave}
          />
        </TabsContent>

        {/* Tab: Endereço */}
        <TabsContent value="endereco" className="mt-6">
          <EnderecoTab 
            student={student} 
            onSave={onSaveAddress}
          />
        </TabsContent>

        {/* Tab: Responsáveis */}
        <TabsContent value="responsaveis" className="mt-6">
          <ResponsaveisTab 
            student={student} 
            onSave={onSaveResponsaveis}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
