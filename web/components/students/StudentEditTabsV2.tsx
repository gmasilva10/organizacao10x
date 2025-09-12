"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  MapPin, 
  Users, 
  FileText, 
  Target,
  Plus,
  Link as LinkIcon,
  Download,
  Eye,
  Edit,
  History,
  UserCheck,
  UserPlus,
  Calendar,
  Clock,
  Camera,
  Upload,
  Trash2,
  RotateCcw
} from "lucide-react"
import Link from "next/link"

// Importar componentes das abas
import IdentificacaoTab from "./tabs/IdentificacaoTab"
import EnderecoTab from "./tabs/EnderecoTab"
import ResponsaveisTab from "./tabs/ResponsaveisTab"
import AnexosTab from "./tabs/AnexosTab"
import ProcessosTab from "./tabs/ProcessosTab"

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

type StudentEditTabsV2Props = {
  student: Student
  studentId: string
  onSave: (data: Partial<Student>) => Promise<void>
  onSaveAddress: (address: Student['address']) => Promise<void>
  onSaveResponsaveis: (responsaveis: any[]) => Promise<void>
}

export default function StudentEditTabsV2({ 
  student, 
  studentId, 
  onSave, 
  onSaveAddress, 
  onSaveResponsaveis 
}: StudentEditTabsV2Props) {
  const [activeTab, setActiveTab] = useState("identificacao")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
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
        <TabsTrigger value="anexos" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Anexos
        </TabsTrigger>
        <TabsTrigger value="processos" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Processos
        </TabsTrigger>
      </TabsList>

      {/* Tab: Identificação */}
      <TabsContent value="identificacao">
        <IdentificacaoTab 
          student={student} 
          onSave={onSave}
        />
      </TabsContent>

      {/* Tab: Endereço */}
      <TabsContent value="endereco">
        <EnderecoTab 
          student={student} 
          onSave={onSaveAddress}
        />
      </TabsContent>

      {/* Tab: Responsáveis */}
      <TabsContent value="responsaveis">
        <ResponsaveisTab 
          student={student} 
          onSave={onSaveResponsaveis}
        />
      </TabsContent>

      {/* Tab: Anexos */}
      <TabsContent value="anexos">
        <AnexosTab 
          student={student} 
          studentId={studentId}
        />
      </TabsContent>

      {/* Tab: Processos */}
      <TabsContent value="processos">
        <ProcessosTab 
          student={student} 
          studentId={studentId}
        />
      </TabsContent>
    </Tabs>
  )
}
