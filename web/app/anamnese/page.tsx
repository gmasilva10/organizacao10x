"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  FileText, 
  Search,
  Plus,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Send
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
  student_name?: string
  student_id: string
}

export default function AnamnesePage() {
  const [versions, setVersions] = useState<AnamneseVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadVersions()
  }, [])

  const loadVersions = async () => {
    try {
      const response = await fetch('/api/anamnese/all')
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

  const filteredVersions = versions.filter(version =>
    version.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    version.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    version.service_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'RASCUHO': { label: 'Rascunho', variant: 'secondary' as const, icon: FileText },
      'ENVIADO': { label: 'Enviado', variant: 'default' as const, icon: Send },
      'EM_PREENCHIMENTO': { label: 'Em Preenchimento', variant: 'outline' as const, icon: Clock },
      'CONCLUIDO': { label: 'Concluído', variant: 'default' as const, icon: CheckCircle },
      'CANCELADO': { label: 'Cancelado', variant: 'destructive' as const, icon: AlertCircle },
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
          <p className="text-gray-600">Gerencie todas as anamneses do sistema</p>
        </div>
        <Button asChild>
          <Link href="/app/anamnese/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Anamnese
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por código, aluno ou serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de versões */}
      {filteredVersions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhuma anamnese encontrada' : 'Nenhuma anamnese encontrada'}
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {searchTerm 
                ? 'Tente ajustar os filtros de busca.'
                : 'Crie uma nova anamnese para começar.'
              }
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link href="/app/anamnese/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Anamnese
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredVersions.map((version) => (
            <Card key={version.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{version.code}</CardTitle>
                      <p className="text-sm text-gray-600">
                        <Link 
                          href={`/app/students/${version.student_id}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {version.student_name || 'Aluno não encontrado'}
                        </Link>
                        {' • '}
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
                    <Link href={`/app/students/${version.student_id}/anamnese/${version.id}`}>
                      <FileText className="h-4 w-4 mr-2" />
                      Abrir
                    </Link>
                  </Button>

                  <Button asChild variant="outline" size="sm">
                    <Link href={`/app/students/${version.student_id}`}>
                      <User className="h-4 w-4 mr-2" />
                      Ver Aluno
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
