"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { 
  Copy, 
  Download, 
  Eye, 
  Calendar, 
  Hash, 
  Tag,
  Activity,
  Dumbbell,
  StretchHorizontal,
  AlertTriangle,
  FileText,
  X
} from "lucide-react"
import GuidelinesPreviewPanelD3 from './GuidelinesPreviewPanelD3'

interface GuidelineVersion {
  id: string
  title: string
  version: number
  status: 'DRAFT' | 'PUBLISHED'
  is_default: boolean
  published_at: string | null
  published_by: string | null
  created_at: string
  created_by: string
  guideline_rules?: Array<{
    id: string
    priority_clinical: string
    condition: any
    outputs: any
    created_at: string
  }>
}

interface GuidelinesViewModalProps {
  open: boolean
  onClose: () => void
  guideline: GuidelineVersion | null
}

export function GuidelinesViewModal({ open, onClose, guideline }: GuidelinesViewModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'preview'>('summary')
  const [isLoading, setIsLoading] = useState(false)

  // Extrair tags únicas das condições
  const getUniqueTags = () => {
    if (!guideline?.guideline_rules) return []
    
    const tags = new Set<string>()
    guideline.guideline_rules.forEach(rule => {
      if (rule.condition?.all) {
        rule.condition.all.forEach((cond: any) => {
          if (cond.tag) tags.add(cond.tag)
        })
      }
    })
    return Array.from(tags)
  }

  // Extrair seções afetadas pelos outputs
  const getAffectedSections = () => {
    if (!guideline?.guideline_rules) return []
    
    const sections = new Set<string>()
    guideline.guideline_rules.forEach(rule => {
      if (rule.outputs) {
        if (rule.outputs.aerobio) sections.add('Aeróbio')
        if (rule.outputs.pesos) sections.add('Pesos')
        if (rule.outputs.flex_mob) sections.add('Flex/Mob')
        if (rule.outputs.contraindicacoes?.length > 0) sections.add('Contraindicações')
        if (rule.outputs.observacoes?.length > 0) sections.add('Observações')
      }
    })
    return Array.from(sections)
  }

  const handleCopyJSON = async () => {
    if (!guideline) return
    
    try {
      const jsonData = {
        version: guideline.version,
        title: guideline.title,
        status: guideline.status,
        is_default: guideline.is_default,
        published_at: guideline.published_at,
        rules: guideline.guideline_rules || []
      }
      
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
      toast.success("JSON copiado para a área de transferência!")
    } catch (error) {
      console.error("Erro ao copiar JSON:", error)
      toast.error("Erro ao copiar JSON")
    }
  }

  const handleDownloadJSON = () => {
    if (!guideline) return
    
    const jsonData = {
      version: guideline.version,
      title: guideline.title,
      status: guideline.status,
      is_default: guideline.is_default,
      published_at: guideline.published_at,
      rules: guideline.guideline_rules || []
    }
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `diretrizes-${guideline.title.toLowerCase().replace(/\s+/g, '-')}-v${guideline.version}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success("Arquivo JSON baixado!")
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Não publicado'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = () => {
    if (guideline?.status === 'PUBLISHED') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Publicado</Badge>
    }
    return <Badge variant="secondary">Rascunho</Badge>
  }

  const getDefaultBadge = () => {
    if (guideline?.is_default) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Padrão</Badge>
    }
    return null
  }

  // Fechar modal com ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!guideline) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {guideline.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'summary' | 'preview')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Resumo da Versão</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6 mt-6">
            {/* Metadados da versão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informações da Versão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Título</label>
                    <p className="text-sm">{guideline.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Versão</label>
                    <p className="text-sm">v{guideline.version}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusBadge()}
                      {getDefaultBadge()}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Publicado em</label>
                    <p className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(guideline.published_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas das regras */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Estatísticas das Regras
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total de Regras</label>
                    <p className="text-2xl font-bold">{guideline.guideline_rules?.length || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tags Utilizadas</label>
                    <p className="text-2xl font-bold">{getUniqueTags().length}</p>
                  </div>
                </div>

                {/* Tags utilizadas */}
                {getUniqueTags().length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Tags nas Condições</label>
                    <div className="flex flex-wrap gap-2">
                      {getUniqueTags().map(tag => (
                        <Badge key={tag} variant="outline" className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seções afetadas */}
                {getAffectedSections().length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Seções Afetadas</label>
                    <div className="flex flex-wrap gap-2">
                      {getAffectedSections().map(section => {
                        const icons = {
                          'Aeróbio': Activity,
                          'Pesos': Dumbbell,
                          'Flex/Mob': StretchHorizontal,
                          'Contraindicações': AlertTriangle,
                          'Observações': FileText
                        }
                        const Icon = icons[section as keyof typeof icons] || FileText
                        return (
                          <Badge key={section} variant="secondary" className="flex items-center gap-1">
                            <Icon className="h-3 w-3" />
                            {section}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ações */}
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button onClick={handleCopyJSON} variant="outline" className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Copiar JSON
                  </Button>
                  <Button onClick={handleDownloadJSON} variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Baixar .json
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        <TabsContent value="preview" className="space-y-6 mt-6">
          <GuidelinesPreviewPanelD3 version={{ id: guideline.id, version: guideline.version, status: guideline.status }} />
        </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
