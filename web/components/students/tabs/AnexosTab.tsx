"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  FileText, 
  Target, 
  Dumbbell,
  Eye,
  Edit,
  Download,
  Calendar,
  User,
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
}

type Ocorrencia = {
  id: string
  title: string
  description: string
  status: 'aberta' | 'em_andamento' | 'concluida' | 'cancelada'
  priority: 'baixa' | 'media' | 'alta' | 'critica'
  created_at: string
  responsible: string
}

type Anamnese = {
  id: string
  type: 'basica' | 'completa'
  status: 'pendente' | 'concluida' | 'expirada'
  created_at: string
  completed_at?: string
  responses?: any
}

type Diretriz = {
  id: string
  version: string
  status: 'gerada' | 'ativa' | 'expirada'
  created_at: string
  based_on_anamnese: string
}

type AnexosTabProps = {
  student: Student
  studentId: string
}

export default function AnexosTab({ student, studentId }: AnexosTabProps) {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([])
  const [anamneses, setAnamneses] = useState<Anamnese[]>([])
  const [diretrizes, setDiretrizes] = useState<Diretriz[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnexos()
  }, [studentId])

  const loadAnexos = async () => {
    try {
      setLoading(true)
      
      // Simular carregamento dos anexos
      const mockOcorrencias: Ocorrencia[] = [
        {
          id: '1',
          title: 'Consulta Técnica',
          description: 'Dúvidas sobre exercícios',
          status: 'em_andamento',
          priority: 'media',
          created_at: '2025-01-15T10:00:00Z',
          responsible: 'João Silva'
        },
        {
          id: '2',
          title: 'Aplicação de Anamnese',
          description: 'Anamnese básica aplicada',
          status: 'concluida',
          priority: 'baixa',
          created_at: '2025-01-10T14:30:00Z',
          responsible: 'Maria Santos'
        }
      ]

      const mockAnamneses: Anamnese[] = [
        {
          id: '1',
          type: 'basica',
          status: 'pendente',
          created_at: '2025-01-20T09:00:00Z'
        },
        {
          id: '2',
          type: 'completa',
          status: 'concluida',
          created_at: '2025-01-18T10:00:00Z',
          completed_at: '2025-01-22T15:30:00Z'
        }
      ]

      const mockDiretrizes: Diretriz[] = [
        {
          id: '1',
          version: 'v1.2',
          status: 'ativa',
          created_at: '2025-01-22T16:00:00Z',
          based_on_anamnese: '2'
        }
      ]

      setOcorrencias(mockOcorrencias)
      setAnamneses(mockAnamneses)
      setDiretrizes(mockDiretrizes)
    } catch (error) {
      console.error('Erro ao carregar anexos:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberta': return 'bg-red-100 text-red-800'
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800'
      case 'concluida': return 'bg-green-100 text-green-800'
      case 'cancelada': return 'bg-gray-100 text-gray-800'
      case 'pendente': return 'bg-blue-100 text-blue-800'
      case 'expirada': return 'bg-orange-100 text-orange-800'
      case 'gerada': return 'bg-purple-100 text-purple-800'
      case 'ativa': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aberta': return 'Aberta'
      case 'em_andamento': return 'Em Andamento'
      case 'concluida': return 'Concluída'
      case 'cancelada': return 'Cancelada'
      case 'pendente': return 'Pendente'
      case 'expirada': return 'Expirada'
      case 'gerada': return 'Gerada'
      case 'ativa': return 'Ativa'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'baixa': return 'bg-green-100 text-green-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'alta': return 'bg-orange-100 text-orange-800'
      case 'critica': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Ocorrências do Aluno */}
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
              <Button variant="outline" size="sm" asChild>
                <Link href="/app/ocorrencias">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Todas
                </Link>
              </Button>
            </div>
            
            {ocorrencias.length > 0 ? (
              <div className="space-y-2">
                {ocorrencias.map((ocorrencia) => (
                  <div key={ocorrencia.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">#{ocorrencia.id} - {ocorrencia.title}</p>
                          <Badge className={getPriorityColor(ocorrencia.priority)}>
                            {ocorrencia.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {ocorrencia.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(ocorrencia.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {ocorrencia.responsible}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(ocorrencia.status)}>
                          {getStatusLabel(ocorrencia.status)}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma ocorrência registrada para este aluno
                </p>
              </div>
            )}
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
              {anamneses.find(a => a.type === 'basica') ? (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Formulário Padrão</span>
                    <Badge className={getStatusColor(anamneses.find(a => a.type === 'basica')?.status || '')}>
                      {getStatusLabel(anamneses.find(a => a.type === 'basica')?.status || '')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {anamneses.find(a => a.type === 'basica')?.status === 'concluida' 
                      ? `Concluída em ${new Date(anamneses.find(a => a.type === 'basica')?.completed_at || '').toLocaleDateString('pt-BR')}`
                      : `Enviada em ${new Date(anamneses.find(a => a.type === 'basica')?.created_at || '').toLocaleDateString('pt-BR')}`
                    }
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
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                  <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma anamnese básica registrada
                  </p>
                </div>
              )}
            </div>

            {/* Anamnese Completa */}
            <div className="space-y-3">
              <h4 className="font-medium">Completa</h4>
              {anamneses.find(a => a.type === 'completa') ? (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Formulário Detalhado</span>
                    <Badge className={getStatusColor(anamneses.find(a => a.type === 'completa')?.status || '')}>
                      {getStatusLabel(anamneses.find(a => a.type === 'completa')?.status || '')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {anamneses.find(a => a.type === 'completa')?.status === 'concluida' 
                      ? `Concluída em ${new Date(anamneses.find(a => a.type === 'completa')?.completed_at || '').toLocaleDateString('pt-BR')}`
                      : `Enviada em ${new Date(anamneses.find(a => a.type === 'completa')?.created_at || '').toLocaleDateString('pt-BR')}`
                    }
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
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                  <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma anamnese completa registrada
                  </p>
                </div>
              )}
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
            
            {diretrizes.length > 0 ? (
              <div className="space-y-2">
                {diretrizes.map((diretriz) => (
                  <div key={diretriz.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Diretriz {diretriz.version}</span>
                      <Badge className={getStatusColor(diretriz.status)}>
                        {getStatusLabel(diretriz.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Gerada em {new Date(diretriz.created_at).toLocaleDateString('pt-BR')} • 
                      Baseada na Anamnese Completa
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
                ))}
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma diretriz de treino gerada para este aluno
                </p>
              </div>
            )}
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
    </div>
  )
}
