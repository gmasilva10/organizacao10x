"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Upload, 
  Brain, 
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Database
} from "lucide-react"
import { toast } from "sonner"
import { GuidelinesRulesEditor } from "./GuidelinesRulesEditor"
import { GuidelinesCatalogs } from "./GuidelinesCatalogs"
import { VersionCard } from "./VersionCard"
import { useVersionActions } from "@/hooks/useVersionActions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GuidelinesViewModal } from "./GuidelinesViewModal"

// Tipos para as novas APIs
interface GuidelineVersion {
  id: string
  tenant_id: string
  version: number
  status: 'DRAFT' | 'PUBLISHED'
  is_default: boolean
  title: string
  created_by: string
  created_at: string
  published_by?: string
  published_at?: string
  guideline_rules?: GuidelineRule[]
}

interface GuidelineRule {
  id: string
  tenant_id: string
  guidelines_version_id: string
  priority_clinical: 'critica' | 'alta' | 'media' | 'baixa'
  condition: {
    all: Array<{
      tag: string
      op: 'eq' | 'in' | 'gt' | 'lt' | 'gte' | 'lte'
      val: string | number | string[]
    }>
  }
  outputs: {
    aerobio: {
      duracao_min: [number, number]
      intensidade: {
        metodo: 'FCR' | 'PSE' | 'vVO2max' | 'MFEL'
        faixa: [number, number]
        texto?: string
      }
      frequencia_sem: [number, number]
      obs?: string[]
    }
    pesos: {
      exercicios: [number, number]
      series: [number, number]
      reps: [number, number]
      frequencia_sem: [number, number]
      intensidade_pct_1rm: [number, number]
      obs?: string[]
    }
    flex_mob: {
      foco?: string
      obs?: string[]
    }
    contraindicacoes: string[]
    observacoes: string[]
  }
  created_at: string
}

interface TrainingGuidelinesManagerProps {
  onEditGuideline?: (guideline: any) => void
  onViewGuideline?: (guideline: any) => void
}

export function TrainingGuidelinesManager({ 
  onEditGuideline, 
  onViewGuideline 
}: TrainingGuidelinesManagerProps) {
  const [versions, setVersions] = useState<GuidelineVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'rules' | 'catalogs' | 'preview' | 'versions'>('rules')
  const [editingVersion, setEditingVersion] = useState<GuidelineVersion | null>(null)
  const [viewingVersion, setViewingVersion] = useState<GuidelineVersion | null>(null)
  const versionActions = useVersionActions()

  useEffect(() => {
    loadGuidelineVersions()
  }, [])

  const loadGuidelineVersions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/guidelines/versions')
      const data = await response.json()
      
      if (response.ok) {
        setVersions(data.data || [])
      } else {
        toast.error(data.error || 'Erro ao carregar diretrizes')
      }
    } catch (error) {
      console.error('Erro ao carregar diretrizes:', error)
      toast.error('Erro ao carregar diretrizes')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublish = async (versionId: string) => {
    await versionActions.handlePublish(versionId, async () => {
      const response = await fetch(`/api/guidelines/versions/${versionId}/publish`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao publicar diretrizes')
      }
      
      loadGuidelineVersions() // Recarregar lista
    })
  }

  const handleSetAsDefault = async (versionId: string) => {
    await versionActions.handleSetDefault(versionId, async () => {
      const response = await fetch(`/api/guidelines/versions/${versionId}/set-default`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao definir diretrizes como padrão')
      }
      
      loadGuidelineVersions() // Recarregar lista
    })
  }

  const handleRename = async (versionId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/guidelines/versions/${versionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTitle })
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao renomear versão')
      }
      
      loadGuidelineVersions() // Recarregar lista
    } catch (error) {
      console.error('Erro ao renomear versão:', error)
    }
  }

  const handleCorrectVersion = async (versionId: string) => {
    try {
      const response = await fetch(`/api/guidelines/versions/${versionId}/correct`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao corrigir versão')
      }
      
      toast.success(data.message || 'Versão corrigida com sucesso!')
      loadGuidelineVersions() // Recarregar lista
    } catch (error) {
      console.error('Erro ao corrigir versão:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao corrigir versão')
    }
  }

  const handleUnpublish = async (versionId: string) => {
    try {
      const response = await fetch(`/api/guidelines/versions/${versionId}/unpublish`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao despublicar diretrizes')
      }
      
      toast.success('Diretrizes despublicadas com sucesso!')
      loadGuidelineVersions() // Recarregar lista
    } catch (error) {
      console.error('Erro ao despublicar diretrizes:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao despublicar diretrizes')
    }
  }

  const handleCreateGuideline = async () => {
    try {
      const response = await fetch('/api/guidelines/versions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Nova Diretriz',
          description: 'Diretriz de treino personalizada'
        })
      })
      
      if (response.ok) {
        toast.success('Nova versão criada com sucesso!')
        loadGuidelineVersions()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao criar versão')
      }
    } catch (error) {
      console.error('Erro ao criar versão:', error)
      toast.error('Erro ao criar versão')
    }
  }

  const handleEditVersion = (version: GuidelineVersion) => {
    setEditingVersion(version)
  }

  const handleBackFromEditor = () => {
    setEditingVersion(null)
  }


  // Se está editando uma versão, mostrar o editor de regras
  if (editingVersion) {
    return (
      <GuidelinesRulesEditor
        version={editingVersion}
        onBack={handleBackFromEditor}
        onVersionUpdate={() => {
          loadGuidelineVersions()
          setEditingVersion(null)
        }}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
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
          <h2 className="text-2xl font-bold">Diretrizes de Treino</h2>
          <p className="text-muted-foreground">
            Configure regras automáticas para recomendações de treino
          </p>
        </div>
        <Button onClick={handleCreateGuideline}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Versão
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Regras
          </TabsTrigger>
          <TabsTrigger value="catalogs" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Catálogos
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="versions" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Versões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-6">
          {versions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma versão encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  Crie sua primeira versão de diretrizes de treino
                </p>
                <Button onClick={handleCreateGuideline}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Versão
                </Button>
              </CardContent>
            </Card>
          ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {versions.map((version) => (
            <VersionCard
              key={version.id}
              context="trainingGuidelines"
              id={version.id}
              title={version.title}
              version={version.version}
              status={version.status}
              isDefault={version.is_default}
              publishedAt={version.published_at}
              rulesCount={version.guideline_rules?.length || 0}
              onView={() => {
                setViewingVersion(version)
                onViewGuideline?.(version)
              }}
              onEdit={() => handleEditVersion(version)}
              onPublish={() => handlePublish(version.id)}
              onSetDefault={() => handleSetAsDefault(version.id)}
              onRename={(newTitle) => handleRename(version.id, newTitle)}
              onCorrect={() => handleCorrectVersion(version.id)}
              onUnpublish={() => handleUnpublish(version.id)}
              onDelete={() => versionActions.handleDelete(version.id, async () => {
                const response = await fetch(`/api/guidelines/versions/${version.id}`, {
                  method: 'DELETE'
                })
                const data = await response.json()
                
                if (!response.ok) {
                  throw new Error(data.error || 'Erro ao excluir versão')
                }
                
                loadGuidelineVersions() // Recarregar lista
              })}
              isPublishing={versionActions.state.isPublishing === version.id}
              isSettingDefault={versionActions.state.isSettingDefault === version.id}
              isDeleting={versionActions.state.isDeleting === version.id}
            />
          ))}
        </div>
          )}
        </TabsContent>

        <TabsContent value="catalogs" className="mt-6">
          <GuidelinesCatalogs />
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardContent className="text-center py-12">
              <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Preview de Diretrizes</h3>
              <p className="text-muted-foreground mb-4">
                Funcionalidade de preview será implementada no GATE D3
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="mt-6">
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Gerenciamento de Versões</h3>
              <p className="text-muted-foreground mb-4">
                Funcionalidade de versionamento será implementada em breve
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Visualização */}
      <GuidelinesViewModal
        open={!!viewingVersion}
        onClose={() => setViewingVersion(null)}
        guideline={viewingVersion as any}
      />
    </div>
  )
}
