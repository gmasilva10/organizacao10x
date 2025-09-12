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
  FileText, 
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { AnamnesisTemplateWithVersions } from "@/types/anamnesis"
import { CreateTemplateModal } from "./CreateTemplateModal"
import { ConfirmDeleteModal } from "./ConfirmDeleteModal"
import { ViewTemplateModal } from "./ViewTemplateModal"
import { EditTemplateModal } from "./EditTemplateModal"

interface AnamnesisTemplatesManagerProps {
  onEditTemplate?: (template: AnamnesisTemplateWithVersions) => void
  onViewTemplate?: (template: AnamnesisTemplateWithVersions) => void
}

export function AnamnesisTemplatesManager({ 
  onEditTemplate, 
  onViewTemplate 
}: AnamnesisTemplatesManagerProps) {
  const [templates, setTemplates] = useState<AnamnesisTemplateWithVersions[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPublishing, setIsPublishing] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<AnamnesisTemplateWithVersions | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<AnamnesisTemplateWithVersions | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/anamnesis/templates?include_versions=true')
      const data = await response.json()
      
      if (response.ok) {
        setTemplates(data.data || [])
      } else {
        toast.error(data.error || 'Erro ao carregar templates')
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      toast.error('Erro ao carregar templates')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublish = async (templateId: string) => {
    try {
      setIsPublishing(templateId)
      const response = await fetch(`/api/anamnesis/templates/${templateId}/publish`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Template publicado com sucesso!')
        loadTemplates() // Recarregar lista
      } else {
        toast.error(data.error || 'Erro ao publicar template')
      }
    } catch (error) {
      console.error('Erro ao publicar template:', error)
      toast.error('Erro ao publicar template')
    } finally {
      setIsPublishing(null)
    }
  }


  const handleCreateTemplate = () => {
    setShowCreateModal(true)
  }

  const handleViewTemplate = (template: AnamnesisTemplateWithVersions) => {
    console.log('Clicou em Ver template:', template.name)
    setSelectedTemplate(template)
    setShowViewModal(true)
  }

  const handleEditTemplate = (template: AnamnesisTemplateWithVersions) => {
    console.log('Clicou em Editar template:', template.name)
    setSelectedTemplate(template)
    setShowEditModal(true)
  }

  const handleDeleteTemplate = (template: AnamnesisTemplateWithVersions) => {
    console.log('Clicou em Excluir template:', template.name)
    
    // Verificar se é o template padrão
    if (template.is_default) {
      toast.error('Não é possível excluir o template padrão da organização')
      return
    }
    
    setTemplateToDelete(template)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!templateToDelete) return

    try {
      const response = await fetch(`/api/anamnesis/templates/${templateToDelete.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Template excluído com sucesso!')
        loadTemplates()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao excluir template')
      }
    } catch (error) {
      console.error('Erro ao excluir template:', error)
      toast.error('Erro ao excluir template')
    }
  }

  const handleSetAsDefault = async (templateId: string, versionId: string) => {
    console.log('Definindo como padrão:', templateId, versionId)
    setIsPublishing(templateId)
    
    try {
      const response = await fetch('/api/anamnesis/active/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_version_id: versionId
        })
      })
      
      if (response.ok) {
        toast.success('Template definido como padrão!')
        // Atualizar estado local imediatamente
        setTemplates(prev => prev.map(t => ({
          ...t,
          is_default: t.id === templateId
        })))
        loadTemplates() // Recarregar para garantir consistência
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao definir como padrão')
      }
    } catch (error) {
      console.error('Erro ao definir como padrão:', error)
      toast.error('Erro ao definir como padrão')
    } finally {
      setIsPublishing(null)
    }
  }


  const getStatusBadge = (template: AnamnesisTemplateWithVersions) => {
    if (template.published_version) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Publicado
        </Badge>
      )
    }
    
    if (template.latest_version && !template.latest_version.is_published) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Rascunho
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800">
        <AlertCircle className="h-3 w-3 mr-1" />
        Sem versão
      </Badge>
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
          <h2 className="text-2xl font-bold">Templates de Anamnese</h2>
          <p className="text-muted-foreground">
            Gerencie os templates de perguntas para seus alunos
          </p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro template de anamnese para começar
            </p>
            <Button onClick={() => {/* TODO: Implementar criação */}}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className={`hover:shadow-md transition-shadow ${
              template.is_default 
                ? 'bg-green-50 border-green-300 border-2' 
                : ''
            }`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {template.description || 'Sem descrição'}
                    </CardDescription>
                  </div>
                  {template.is_default && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      Padrão
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  {getStatusBadge(template)}
                  <span className="text-sm text-muted-foreground">
                    v{template.latest_version?.version_number || 0}
                  </span>
                </div>

                {template.published_version && (
                  <div className="text-sm text-muted-foreground">
                    <p>Publicado em: {new Date(template.published_version.published_at!).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewTemplate(template)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  
                  {template.latest_version && !template.latest_version.is_published && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handlePublish(template.id)}
                      disabled={isPublishing === template.id}
                      className="flex-1"
                    >
                        <Upload className="h-4 w-4 mr-1" />
                      {isPublishing === template.id ? 'Publicando...' : 'Publicar'}
                    </Button>
                  )}
                  
                  {template.published_version && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetAsDefault(template.id, template.published_version!.id)}
                      disabled={isPublishing === template.id || template.is_default}
                      className={`flex-1 ${
                        template.is_default 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-blue-600 hover:text-blue-700'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {isPublishing === template.id 
                        ? 'Definindo...' 
                        : template.is_default 
                          ? 'Já é Padrão' 
                          : 'Definir como Padrão'
                      }
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template)}
                    disabled={template.is_default}
                    className={`${
                      template.is_default 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-red-600 hover:text-red-700'
                    }`}
                    title={template.is_default ? 'Template padrão não pode ser excluído' : 'Excluir template'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadTemplates()
          setShowCreateModal(false)
        }}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Excluir Template"
        description="Esta ação não pode ser desfeita."
        itemName={templateToDelete?.name || ''}
      />

      {/* Modal de Visualização */}
      <ViewTemplateModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        template={selectedTemplate}
      />

      {/* Modal de Edição */}
      <EditTemplateModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        template={selectedTemplate}
        onSuccess={() => {
          loadTemplates()
          setShowEditModal(false)
        }}
      />
    </div>
  )
}
