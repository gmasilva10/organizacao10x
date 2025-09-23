"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Send, 
  Download, 
  X, 
  Plus,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface AnamneseVersion {
  id: string
  code: string
  status: string
  service_id: string | null
  token: string
  token_expires_at: string
  created_at: string
  updated_at: string
  service_name?: string
}

export default function AnamnesePage() {
  const params = useParams()
  const studentId = params.id as string
  
  const [versions, setVersions] = useState<AnamneseVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)

  useEffect(() => {
    loadVersions()
  }, [studentId])

  const loadVersions = async () => {
    try {
      const response = await fetch(`/api/anamnese/versions/${studentId}`)
      const data = await response.json()
      
      if (response.ok) {
        setVersions(data.versions || [])
      } else {
        toast.error('Erro ao carregar anamneses')
      }
    } catch (error) {
      toast.error('Erro ao carregar anamneses')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (versionId: string) => {
    try {
      setSending(versionId)
      const response = await fetch(`/api/anamnese/version/${versionId}/send`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast.success('Anamnese enviada com sucesso!')
        loadVersions()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao enviar anamnese')
      }
    } catch (error) {
      toast.error('Erro ao enviar anamnese')
    } finally {
      setSending(null)
    }
  }

  const handleGeneratePDF = async (versionId: string) => {
    try {
      const response = await fetch(`/api/anamnese/version/${versionId}/pdf`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast.success('PDF gerado com sucesso!')
        loadVersions()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao gerar PDF')
      }
    } catch (error) {
      toast.error('Erro ao gerar PDF')
    }
  }

  const handleCancel = async (versionId: string) => {
    try {
      const response = await fetch(`/api/anamnese/version/${versionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELADO' })
      })
      
      if (response.ok) {
        toast.success('Anamnese cancelada')
        loadVersions()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao cancelar anamnese')
      }
    } catch (error) {
      toast.error('Erro ao cancelar anamnese')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'RASCUHO': { label: 'Rascunho', variant: 'secondary' as const, icon: FileText },
      'ENVIADO': { label: 'Enviado', variant: 'default' as const, icon: Send },
      'EM_PREENCHIMENTO': { label: 'Em Preenchimento', variant: 'outline' as const, icon: Clock },
      'CONCLUIDO': { label: 'Concluído', variant: 'default' as const, icon: CheckCircle },
      'CANCELADO': { label: 'Cancelado', variant: 'destructive' as const, icon: X },
      'EXPIRADO': { label: 'Expirado', variant: 'destructive' as const, icon: AlertCircle }
    }
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const, icon: FileText }
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anamneses</h1>
          <p className="text-gray-600">Gerencie as anamneses do aluno</p>
        </div>
        <Button asChild>
          <Link href={`/students/${studentId}/anamnese/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Anamnese
          </Link>
        </Button>
      </div>

      {/* Lista de versões */}
      {versions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma anamnese encontrada</h3>
            <p className="text-gray-600 text-center mb-4">
              Crie uma nova anamnese para começar a coletar informações do aluno.
            </p>
            <Button asChild>
              <Link href={`/students/${studentId}/anamnese/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Anamnese
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {versions.map((version) => (
            <Card key={version.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{version.code}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {version.service_name || 'Serviço não especificado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(version.status)}
                    {isExpired(version.token_expires_at) && version.status !== 'CONCLUIDO' && (
                      <Badge variant="destructive">Expirado</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Criado em {new Date(version.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Expira em {new Date(version.token_expires_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>Status: {version.status}</span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/students/${studentId}/anamnese/${version.id}`}>
                      <FileText className="h-4 w-4 mr-2" />
                      Abrir
                    </Link>
                  </Button>

                  {version.status === 'RASCUHO' && (
                    <Button
                      size="sm"
                      onClick={() => handleSend(version.id)}
                      disabled={sending === version.id}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {sending === version.id ? 'Enviando...' : 'Enviar'}
                    </Button>
                  )}

                  {version.status === 'CONCLUIDO' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGeneratePDF(version.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Gerar PDF
                    </Button>
                  )}

                  {(version.status === 'RASCUHO' || version.status === 'ENVIADO') && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCancel(version.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}