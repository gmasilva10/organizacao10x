"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Bug, Trash2 } from 'lucide-react'

interface OrgDebugInfo {
  timestamp: string
  user: {
    id: string
    email: string
    name: string
  } | null
  context: {
    userId: string | null
    org_id: string | null
    role: string | null
  }
  memberships: Array<{
    org_id: string
    role: string
    name: string
    plan: string
    student_count: number
  }>
  cookies: {
    active_org: string | null
    all_cookies: Record<string, string>
  }
  environment: {
    node_env: string
    vercel_env?: string
  }
}

export function OrgDebugInfo() {
  const [debugInfo, setDebugInfo] = useState<OrgDebugInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDebugInfo = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/debug/tenant')
      const data = await response.json()
      
      if (data.success) {
        setDebugInfo(data.debug)
      } else {
        setError(data.error || 'Erro ao buscar informações de debug')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const clearCache = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/clear-cache', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        // Recarregar a página para aplicar as mudanças
        window.location.reload()
      } else {
        setError(data.error || 'Erro ao limpar cache')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao limpar cache')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugInfo()
  }, [])

  if (process.env.NODE_ENV === 'production') {
    return null // Não mostrar em produção
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
          <Bug className="h-5 w-5" />
          Debug - Informações de Organização
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
            <strong>Erro:</strong> {error}
          </div>
        )}

        {debugInfo && (
          <div className="space-y-4 text-sm">
            {/* Usuário */}
            <div>
              <strong>Usuário:</strong>
              <div className="ml-4 mt-1 space-y-1">
                <div><strong>ID:</strong> {debugInfo.user?.id}</div>
                <div><strong>Email:</strong> {debugInfo.user?.email}</div>
                <div><strong>Nome:</strong> {debugInfo.user?.name}</div>
              </div>
            </div>

            {/* Contexto */}
            <div>
              <strong>Contexto Atual:</strong>
              <div className="ml-4 mt-1 space-y-1">
                <div><strong>Org ID:</strong> <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{debugInfo.context.org_id}</code></div>
                <div><strong>Role:</strong> <Badge variant="secondary">{debugInfo.context.role}</Badge></div>
              </div>
            </div>

            {/* Organizações */}
            <div>
              <strong>Organizações ({debugInfo.memberships.length}):</strong>
              <div className="ml-4 mt-1 space-y-2">
                {debugInfo.memberships.map((org, index) => (
                  <div key={index} className="p-2 border rounded-md">
                    <div><strong>Nome:</strong> {org.name}</div>
                    <div><strong>ID:</strong> <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">{org.org_id}</code></div>
                    <div><strong>Role:</strong> <Badge variant="outline">{org.role}</Badge></div>
                    <div><strong>Plan:</strong> <Badge variant="secondary">{org.plan}</Badge></div>
                    <div><strong>Alunos:</strong> {org.student_count}</div>
                    {debugInfo.context.org_id === org.org_id && (
                      <Badge className="bg-green-100 text-green-800">ATIVA</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Cookies */}
            <div>
              <strong>Cookies:</strong>
              <div className="ml-4 mt-1">
                <div><strong>pg.active_org:</strong> <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{debugInfo.cookies.active_org || 'não definido'}</code></div>
              </div>
            </div>

            {/* Ambiente */}
            <div>
              <strong>Ambiente:</strong>
              <div className="ml-4 mt-1">
                <div><strong>NODE_ENV:</strong> <Badge variant="outline">{debugInfo.environment.node_env}</Badge></div>
                {debugInfo.environment.vercel_env && (
                  <div><strong>VERCEL_ENV:</strong> <Badge variant="outline">{debugInfo.environment.vercel_env}</Badge></div>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Última atualização: {new Date(debugInfo.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={fetchDebugInfo} 
            disabled={loading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button 
            onClick={clearCache} 
            disabled={loading}
            size="sm"
            variant="destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Cache
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
