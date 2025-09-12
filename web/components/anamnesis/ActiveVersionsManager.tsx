"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Settings,
  FileText,
  Brain
} from "lucide-react"
import { toast } from "sonner"

interface ActiveVersion {
  id: string
  version_number: number
  is_published: boolean
  published_at?: string
  template?: {
    id: string
    name: string
    description?: string
  }
  guideline?: {
    id: string
    name: string
    description?: string
  }
}

interface ActiveVersionsData {
  template_version: ActiveVersion | null
  guidelines_version: ActiveVersion | null
  organization_id: string
  updated_at: string
}

export function ActiveVersionsManager() {
  const [activeVersions, setActiveVersions] = useState<ActiveVersionsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSettingDefault, setIsSettingDefault] = useState<string | null>(null)

  useEffect(() => {
    loadActiveVersions()
  }, [])

  const loadActiveVersions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/anamnesis/active')
      const data = await response.json()
      
      if (response.ok) {
        setActiveVersions(data.data)
      } else {
        toast.error(data.error || 'Erro ao carregar versões ativas')
      }
    } catch (error) {
      console.error('Erro ao carregar versões ativas:', error)
      toast.error('Erro ao carregar versões ativas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetAsDefault = async (type: 'template' | 'guidelines', versionId: string) => {
    try {
      setIsSettingDefault(versionId)
      const endpoint = type === 'template' 
        ? '/api/anamnesis/active/template'
        : '/api/anamnesis/active/guidelines'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          [`${type}_version_id`]: versionId
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success(`${type === 'template' ? 'Template' : 'Diretrizes'} definido como padrão!`)
        loadActiveVersions() // Recarregar versões ativas
      } else {
        toast.error(data.error || `Erro ao definir ${type === 'template' ? 'template' : 'diretrizes'} como padrão`)
      }
    } catch (error) {
      console.error(`Erro ao definir ${type} como padrão:`, error)
      toast.error(`Erro ao definir ${type === 'template' ? 'template' : 'diretrizes'} como padrão`)
    } finally {
      setIsSettingDefault(null)
    }
  }

  const getStatusBadge = (version: ActiveVersion) => {
    if (version.is_published) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Publicado
        </Badge>
      )
    }
    
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <Clock className="h-3 w-3 mr-1" />
        Rascunho
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Versões Ativas</h2>
          <p className="text-muted-foreground">
            Gerencie as versões padrão da organização para novos alunos
          </p>
        </div>
        <Button onClick={loadActiveVersions} variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Template Ativo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Template Padrão
            </CardTitle>
            <CardDescription>
              Template de perguntas usado para novos alunos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeVersions?.template_version ? (
              <>
                <div className="space-y-2">
                  <h4 className="font-semibold">{activeVersions.template_version.template?.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {activeVersions.template_version.template?.description || 'Sem descrição'}
                  </p>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(activeVersions.template_version)}
                    <span className="text-sm text-muted-foreground">
                      v{activeVersions.template_version.version_number}
                    </span>
                  </div>
                  {activeVersions.template_version.published_at && (
                    <p className="text-xs text-muted-foreground">
                      Publicado em: {new Date(activeVersions.template_version.published_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <div className="p-2 bg-green-50 rounded text-green-800 text-sm">
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  Ativo como padrão da organização
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="font-semibold mb-2">Nenhum template padrão</h4>
                <p className="text-sm text-muted-foreground">
                  Defina um template como padrão da organização
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diretrizes Ativas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Diretrizes Padrão
            </CardTitle>
            <CardDescription>
              Regras de treino usadas para novos alunos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeVersions?.guidelines_version ? (
              <>
                <div className="space-y-2">
                  <h4 className="font-semibold">{activeVersions.guidelines_version.guideline?.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {activeVersions.guidelines_version.guideline?.description || 'Sem descrição'}
                  </p>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(activeVersions.guidelines_version)}
                    <span className="text-sm text-muted-foreground">
                      v{activeVersions.guidelines_version.version_number}
                    </span>
                  </div>
                  {activeVersions.guidelines_version.published_at && (
                    <p className="text-xs text-muted-foreground">
                      Publicado em: {new Date(activeVersions.guidelines_version.published_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <div className="p-2 bg-green-50 rounded text-green-800 text-sm">
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  Ativo como padrão da organização
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="font-semibold mb-2">Nenhumas diretrizes padrão</h4>
                <p className="text-sm text-muted-foreground">
                  Defina diretrizes como padrão da organização
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {activeVersions?.updated_at && (
        <div className="text-xs text-muted-foreground text-center">
          Última atualização: {new Date(activeVersions.updated_at).toLocaleString('pt-BR')}
        </div>
      )}
    </div>
  )
}
