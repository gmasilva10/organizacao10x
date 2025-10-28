/**
 * GATE 10.6.HF - Página de Serviços/Relacionamento
 * 
 * Funcionalidades:
 * - Gerenciamento de templates de relacionamento
 * - Configuração de âncoras e canais
 * - Parametrização de mensagens
 * - Integração com fluxo de trabalho
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageSquare, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Heart,
  Clock,
  Calendar,
  Users,
  Mail,
  Phone,
  User,
  Dumbbell,
  Anchor
} from 'lucide-react'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ANCHOR_VARIABLES, ContextUtils } from '@/lib/relationship/variable-context'
import { TemplateFormModal } from '@/components/relationship/TemplateFormModal'

interface Template {
  id: string
  code: string // Gerado automaticamente no backend
  title: string
  anchor: string
  touchpoint: string
  suggested_offset: string
  channel_default: string
  message_v1: string
  message_v2?: string
  active: boolean
  temporal_offset_days?: number | null
  temporal_anchor_field?: string | null
  audience_filter: any
  variables: string[]
  created_at: string
  updated_at: string
  org_id: string
}

const ANCHOR_OPTIONS = [
  { value: 'sale_close', label: 'Fechamento da Venda' },
  { value: 'first_workout', label: 'Primeiro Treino' },
  { value: 'training_followup', label: 'Acompanhamento de Treino' },
  { value: 'birthday', label: 'Aniversário' },
  { value: 'renewal_window', label: 'Janela de Renovação' },
  { value: 'occurrence_followup', label: 'Follow-up de Ocorrência' }
]

const CHANNEL_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'manual', label: 'Manual' }
]

const TOUCHPOINT_OPTIONS = [
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'E-mail', label: 'E-mail' },
  { value: 'Ligação', label: 'Ligação' },
  { value: 'Presencial', label: 'Presencial' }
]

export default function RelationshipServicesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Template | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [seedingTemplates, setSeedingTemplates] = useState(false)

  // Buscar templates
  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/relationship/templates')
      const data = await response.json()
      
      if (response.ok) {
        setTemplates(Array.isArray(data.items) ? data.items : [])
      } else {
        toast.error('Erro ao buscar templates')
        setTemplates([])
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
      toast.error('Erro ao buscar templates')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  // Editar template
  const handleEdit = (template: Template) => {
    setEditing(template)
    setModalOpen(true)
  }

  // Success callback do modal
  const handleModalSuccess = () => {
    toast.success(editing ? 'Template atualizado!' : 'Template criado!')
    setEditing(null)
    fetchTemplates()
  }

  // Close callback do modal
  const handleModalClose = (open: boolean) => {
    if (!open) {
      setEditing(null)
    }
    setModalOpen(open)
  }

  // Excluir template
  const handleDelete = async (id: string) => {
    // Modal premium já confirma a ação
    
    try {
      const response = await fetch(`/api/relationship/templates/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Template excluído!')
        fetchTemplates()
      } else {
        toast.error('Erro ao excluir template')
      }
    } catch (error) {
      console.error('Erro ao excluir template:', error)
      toast.error('Erro ao excluir template')
    }
  }

  // Novo template
  const handleNew = () => {
    setEditing(null)
    setModalOpen(true)
  }

  // Popular templates padrão
  const handleSeedTemplates = async () => {
    try {
      setSeedingTemplates(true)
      const response = await fetch('/api/relationship/seed-templates', {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success(`${data.inserted} templates padrão criados!`)
        fetchTemplates()
      } else {
        toast.error('Erro ao popular templates')
      }
    } catch (error) {
      console.error('Erro ao popular templates:', error)
      toast.error('Erro ao popular templates')
    } finally {
      setSeedingTemplates(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relacionamento</h1>
          <p className="text-muted-foreground mt-2">
            Configure templates de mensagens e parametrização para o fluxo de relacionamento.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSeedTemplates} 
            variant="outline"
            disabled={seedingTemplates}
            className="flex items-center gap-2"
          >
            <Heart className="h-4 w-4" />
            {seedingTemplates ? 'Populando...' : 'Templates Padrão'}
          </Button>
          <Button onClick={handleNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Template
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="anchors">Âncoras</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-6">
          {/* Lista de Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Templates de Relacionamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Carregando templates...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhum template encontrado</p>
                  <Button onClick={handleNew} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Template
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{template.title}</h3>
                              <Badge variant={template.active ? "default" : "secondary"}>
                                {template.active ? "Ativo" : "Inativo"}
                              </Badge>
                              <Badge variant="outline">{template.code}</Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Âncora:</span>
                                <br />
                                {ANCHOR_OPTIONS.find(a => a.value === template.anchor)?.label || template.anchor}
                              </div>
                              <div>
                                <span className="font-medium">Canal:</span>
                                <br />
                                {CHANNEL_OPTIONS.find(c => c.value === template.channel_default)?.label || template.channel_default}
                              </div>
                              <div>
                                <span className="font-medium">Offset:</span>
                                <br />
                                {template.temporal_offset_days ? `${template.temporal_offset_days} dias` : 'Imediato'}
                              </div>
                              <div>
                                <span className="font-medium">Criado:</span>
                                <br />
                                {new Date(template.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                              <span className="font-medium">Mensagem:</span>
                              <br />
                              <span className="text-gray-700">{template.message_v1}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o template "{template.title}"?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(template.id)}>
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Âncoras */}
        <TabsContent value="anchors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Anchor className="h-5 w-5" />
                Configuração de Âncoras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ANCHOR_OPTIONS.map((anchor) => {
                  const anchorVariables = ANCHOR_VARIABLES[anchor.value as keyof typeof ANCHOR_VARIABLES] || []
                  
                  // Agrupar variáveis por categoria
                  const variablesByCategory = anchorVariables.reduce((acc, variable) => {
                    if (!acc[variable.category]) {
                      acc[variable.category] = []
                    }
                    acc[variable.category].push(variable)
                    return acc
                  }, {} as Record<string, typeof anchorVariables>)
                  
                  return (
                    <Card key={anchor.value} className="border-2 border-blue-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {anchor.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Variáveis específicas desta âncora */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Variáveis Disponíveis</label>
                          <div className="space-y-2">
                            {Object.entries(variablesByCategory).map(([category, variables]) => (
                              <div key={category} className="flex items-center justify-between">
                                <span className="text-sm capitalize">{category}</span>
                                <Badge variant="outline" className="text-xs">
                                  {variables.length} variáveis
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Lista de variáveis com exemplos */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Exemplos de Variáveis:</label>
                          <div className="space-y-1">
                            {anchorVariables.slice(0, 3).map((variable) => (
                              <div key={variable.name} className="flex items-center justify-between text-xs">
                                <code className="bg-gray-100 px-1 rounded">[{variable.name}]</code>
                                <span className="text-gray-500">{variable.example}</span>
                              </div>
                            ))}
                            {anchorVariables.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{anchorVariables.length - 3} outras variáveis...
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <h3 className="font-medium">Templates Padrão</h3>
                    <p className="text-sm text-gray-500">Popular sistema com templates pré-configurados</p>
                  </div>
                  <Button 
                    onClick={handleSeedTemplates}
                    disabled={seedingTemplates}
                    variant="outline"
                  >
                    {seedingTemplates ? 'Populando...' : 'Popular Templates'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <h3 className="font-medium">Integração WhatsApp</h3>
                    <p className="text-sm text-gray-500">Configure a integração com WhatsApp Business API</p>
                  </div>
                  <Button variant="outline" disabled>
                    Configurar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <h3 className="font-medium">Integração E-mail</h3>
                    <p className="text-sm text-gray-500">Configure o serviço de envio de e-mails</p>
                  </div>
                  <Button variant="outline" disabled>
                    Configurar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Premium de Template */}
      <TemplateFormModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        onSuccess={handleModalSuccess}
        template={editing}
      />
    </div>
  )
}