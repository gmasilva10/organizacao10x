"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  FileText, 
  Target, 
  Link as LinkIcon,
  Download,
  Clock,
  User,
  Calendar,
  Copy,
  Check
} from "lucide-react"
import { toast } from "sonner"

type Student = {
  id: string
  name: string
  email: string
  phone: string
  status: 'onboarding' | 'active' | 'paused' | 'inactive'
  created_at: string
}

type Processo = {
  id: string
  type: 'ocorrencia' | 'anamnese' | 'diretriz'
  title: string
  description: string
  status: 'gerado' | 'em_andamento' | 'concluido' | 'expirado'
  created_at: string
  link?: string
  responsible: string
}

type ProcessosTabProps = {
  student: Student
  studentId: string
}

export default function ProcessosTab({ student, studentId }: ProcessosTabProps) {
  const [processos, setProcessos] = useState<Processo[]>([])
  const [generating, setGenerating] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  // Simular dados de processos
  const mockProcessos: Processo[] = [
    {
      id: '1',
      type: 'anamnese',
      title: 'Anamnese Básica',
      description: 'Link gerado para preenchimento da anamnese básica',
      status: 'gerado',
      created_at: '2025-01-22T14:30:00Z',
      link: 'https://app.organizacao10x.com/anamnese/abc123',
      responsible: 'Maria Santos'
    },
    {
      id: '2',
      type: 'ocorrencia',
      title: 'Consulta Técnica',
      description: 'Nova ocorrência criada para dúvidas sobre exercícios',
      status: 'em_andamento',
      created_at: '2025-01-20T10:15:00Z',
      responsible: 'João Silva'
    },
    {
      id: '3',
      type: 'diretriz',
      title: 'Diretriz de Treino v1.2',
      description: 'Diretriz gerada com base na anamnese completa',
      status: 'concluido',
      created_at: '2025-01-18T16:45:00Z',
      responsible: 'Sistema'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'gerado': return 'bg-blue-100 text-blue-800'
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800'
      case 'concluido': return 'bg-green-100 text-green-800'
      case 'expirado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'gerado': return 'Gerado'
      case 'em_andamento': return 'Em Andamento'
      case 'concluido': return 'Concluído'
      case 'expirado': return 'Expirado'
      default: return status
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ocorrencia': return <AlertTriangle className="h-4 w-4" />
      case 'anamnese': return <FileText className="h-4 w-4" />
      case 'diretriz': return <Target className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ocorrencia': return 'Ocorrência'
      case 'anamnese': return 'Anamnese'
      case 'diretriz': return 'Diretriz'
      default: return type
    }
  }

  const handleGerarOcorrencia = async () => {
    try {
      setGenerating('ocorrencia')
      
      // Simular geração de ocorrência
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newProcesso: Processo = {
        id: Date.now().toString(),
        type: 'ocorrencia',
        title: 'Nova Ocorrência',
        description: 'Ocorrência criada diretamente do perfil do aluno',
        status: 'gerado',
        created_at: new Date().toISOString(),
        responsible: 'Sistema'
      }
      
      setProcessos(prev => [newProcesso, ...prev])
      toast.success('Ocorrência gerada com sucesso!')
    } catch (error) {
      toast.error('Erro ao gerar ocorrência')
    } finally {
      setGenerating(null)
    }
  }

  const handleGerarAnamnese = async () => {
    try {
      setGenerating('anamnese')
      
      // Simular geração de link de anamnese
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const link = `https://app.organizacao10x.com/anamnese/${Math.random().toString(36).substr(2, 9)}`
      
      const newProcesso: Processo = {
        id: Date.now().toString(),
        type: 'anamnese',
        title: 'Anamnese Básica',
        description: 'Link gerado para preenchimento da anamnese',
        status: 'gerado',
        created_at: new Date().toISOString(),
        link: link,
        responsible: 'Sistema'
      }
      
      setProcessos(prev => [newProcesso, ...prev])
      toast.success('Link de anamnese gerado com sucesso!', {
        action: {
          label: 'Copiar Link',
          onClick: () => handleCopyLink(link)
        }
      })
    } catch (error) {
      toast.error('Erro ao gerar anamnese')
    } finally {
      setGenerating(null)
    }
  }

  const handleGerarDiretriz = async (type: 'rapida' | 'direta') => {
    try {
      setGenerating('diretriz')
      
      // Simular geração de diretriz
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const newProcesso: Processo = {
        id: Date.now().toString(),
        type: 'diretriz',
        title: `Diretriz de Treino v${Math.random().toFixed(1)}`,
        description: type === 'rapida' 
          ? 'Diretriz gerada via link rápido' 
          : 'Diretriz gerada via execução direta',
        status: 'concluido',
        created_at: new Date().toISOString(),
        responsible: 'Sistema'
      }
      
      setProcessos(prev => [newProcesso, ...prev])
      toast.success('Diretriz gerada com sucesso!')
    } catch (error) {
      toast.error('Erro ao gerar diretriz')
    } finally {
      setGenerating(null)
    }
  }

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(link)
      toast.success('Link copiado para a área de transferência!')
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (error) {
      toast.error('Erro ao copiar link')
    }
  }

  return (
    <div className="space-y-6">
      {/* Ações de Processo */}
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
            <Button 
              className="w-full" 
              onClick={handleGerarOcorrencia}
              disabled={generating === 'ocorrencia'}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {generating === 'ocorrencia' ? 'Gerando...' : 'Nova Ocorrência'}
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
            <Button 
              className="w-full" 
              onClick={handleGerarAnamnese}
              disabled={generating === 'anamnese'}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              {generating === 'anamnese' ? 'Gerando...' : 'Gerar Link'}
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
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => handleGerarDiretriz('rapida')}
                disabled={generating === 'diretriz'}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                {generating === 'diretriz' ? 'Gerando...' : 'Link Rápido'}
              </Button>
              <Button 
                className="w-full" 
                onClick={() => handleGerarDiretriz('direta')}
                disabled={generating === 'diretriz'}
              >
                <Target className="h-4 w-4 mr-2" />
                {generating === 'diretriz' ? 'Gerando...' : 'Executar Direto'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Processos */}
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
                <Clock className="h-4 w-4 mr-1" />
                Ver Histórico
              </Button>
            </div>
            
            <div className="space-y-2">
              {mockProcessos.map((processo) => (
                <div key={processo.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(processo.type)}
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{processo.title}</p>
                      <Badge className={getStatusColor(processo.status)}>
                        {getStatusLabel(processo.status)}
                      </Badge>
                      <Badge variant="outline">
                        {getTypeLabel(processo.type)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {processo.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(processo.created_at).toLocaleDateString('pt-BR')} {new Date(processo.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {processo.responsible}
                      </span>
                    </div>
                    {processo.link && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Link:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {processo.link}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(processo.link!)}
                        >
                          {copiedLink === processo.link ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
