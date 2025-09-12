"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  AlertTriangle, 
  FileText, 
  Target, 
  Dumbbell,
  Plus,
  Link as LinkIcon,
  Download,
  Eye,
  Edit,
  History,
  UserCheck,
  UserPlus,
  Calendar,
  Clock
} from "lucide-react"
import Link from "next/link"

type Student = {
  id: string
  name: string
  email: string
  phone: string
  status: 'onboarding' | 'active' | 'paused' | 'inactive'
  created_at: string
  trainer?: {
    id: string
    name: string
  } | null
  trainer_id?: string | null
  trainer_name?: string | null
}

type StudentEditTabsProps = {
  student: Student
  studentId: string
}

export default function StudentEditTabs({ student, studentId }: StudentEditTabsProps) {
  const [activeTab, setActiveTab] = useState("anexos")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="anexos" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Anexos
        </TabsTrigger>
        <TabsTrigger value="processos" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Processos
        </TabsTrigger>
      </TabsList>

      {/* Tab: Anexos */}
      <TabsContent value="anexos" className="space-y-6">
        {/* Responsáveis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Responsáveis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Treinador Principal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Treinador Principal</h4>
                <Badge variant="default">Obrigatório</Badge>
              </div>
              {student.trainer ? (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">{student.trainer.name}</p>
                      <p className="text-sm text-muted-foreground">Treinador Principal</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Alterar
                    </Button>
                    <Button variant="outline" size="sm">
                      <History className="h-4 w-4 mr-1" />
                      Histórico
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                  <UserPlus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Nenhum treinador principal atribuído
                  </p>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Atribuir Treinador
                  </Button>
                </div>
              )}
            </div>

            {/* Treinadores de Apoio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Treinadores de Apoio</h4>
                <Badge variant="secondary">Opcional</Badge>
              </div>
              <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                <UserPlus className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  Nenhum treinador de apoio atribuído
                </p>
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Apoio
                </Button>
              </div>
            </div>

            {/* Responsáveis Específicos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Responsáveis Específicos</h4>
                <Badge variant="secondary">Opcional</Badge>
              </div>
              <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                <UserPlus className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  Nenhum responsável específico atribuído
                </p>
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Responsável
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ocorrências */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Ocorrências (Aluno)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Ocorrências específicas deste aluno
                </p>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Todas
                </Button>
              </div>
              
              {/* Placeholder para lista de ocorrências */}
              <div className="space-y-2">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">#001 - Consulta Técnica</p>
                      <p className="text-xs text-muted-foreground">15/01/2025 • João Silva</p>
                    </div>
                    <Badge variant="outline">Em Andamento</Badge>
                  </div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">#002 - Aplicação de Anamnese</p>
                      <p className="text-xs text-muted-foreground">10/01/2025 • Maria Santos</p>
                    </div>
                    <Badge variant="default">Concluída</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Anamnese */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Anamnese
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Anamnese Básica */}
              <div className="space-y-3">
                <h4 className="font-medium">Básica</h4>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Formulário Padrão</span>
                    <Badge variant="outline">Pendente</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Enviado em 20/01/2025
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Anamnese Completa */}
              <div className="space-y-3">
                <h4 className="font-medium">Completa</h4>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Formulário Detalhado</span>
                    <Badge variant="default">Concluída</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Concluída em 22/01/2025
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diretriz de Treino */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Diretriz de Treino
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Diretrizes geradas com base na anamnese
                </p>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Exportar PDF
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Diretriz v1.2</span>
                  <Badge variant="default">Ativa</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Gerada em 22/01/2025 • Baseada na Anamnese Completa
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Visualizar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Treino (Futuro) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Treino
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
              <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Módulo de treino em desenvolvimento
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Será integrado futuramente
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab: Processos */}
      <TabsContent value="processos" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Gerar Nova Ocorrência */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Gerar Nova Ocorrência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Crie uma nova ocorrência diretamente vinculada a este aluno.
              </p>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  • Vincula automaticamente ao aluno
                </p>
                <p className="text-xs text-muted-foreground">
                  • Não permite encerrar/cancelar aqui
                </p>
                <p className="text-xs text-muted-foreground">
                  • Apenas criar nova ocorrência
                </p>
              </div>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Nova Ocorrência
              </Button>
            </CardContent>
          </Card>

          {/* Gerar Anamnese */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gerar Anamnese
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Gere um link único para o aluno preencher a anamnese.
              </p>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  • Link tokenizado para WhatsApp
                </p>
                <p className="text-xs text-muted-foreground">
                  • Respostas direto em "Anexos"
                </p>
                <p className="text-xs text-muted-foreground">
                  • Acesso via link único
                </p>
              </div>
              <Button className="w-full">
                <LinkIcon className="h-4 w-4 mr-2" />
                Gerar Link
              </Button>
            </CardContent>
          </Card>

          {/* Gerar Diretriz */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Gerar Diretriz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Execute o motor de diretrizes com base nas informações.
              </p>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  • Opção 1: Link para dados adicionais
                </p>
                <p className="text-xs text-muted-foreground">
                  • Opção 2: Execução direta
                </p>
                <p className="text-xs text-muted-foreground">
                  • Resultado em "Anexos"
                </p>
              </div>
              <div className="space-y-2">
                <Button className="w-full" variant="outline">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Link Rápido
                </Button>
                <Button className="w-full">
                  <Target className="h-4 w-4 mr-2" />
                  Executar Direto
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Histórico de Processos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Últimas ações executadas para este aluno
                </p>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-1" />
                  Ver Histórico
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Anamnese gerada</p>
                    <p className="text-xs text-muted-foreground">22/01/2025 14:30 • Maria Santos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Ocorrência criada</p>
                    <p className="text-xs text-muted-foreground">20/01/2025 10:15 • João Silva</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Diretriz atualizada</p>
                    <p className="text-xs text-muted-foreground">18/01/2025 16:45 • Sistema</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
