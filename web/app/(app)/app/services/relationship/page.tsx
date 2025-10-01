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
  Dumbbell
} from 'lucide-react'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { RELATIONSHIP_VARIABLES, VARIABLE_CATEGORIES, getVariablesByCategory } from '@/lib/relationship-variables'

interface Template {
  id: string
  code: string
  title: string
  anchor: string
  touchpoint: string
  suggested_offset: string
  channel_default: string
  message_v1: string
  message_v2?: string
  active: boolean
  priority: number
  audience_filter: any
  variables: string[]
  created_at: string
  updated_at: string
}

const ANCHOR_OPTIONS = [
  { value: 'sale_close', label: 'Fechamento da Venda' },
  { value: 'first_workout', label: 'Primeiro Treino' },
  { value: 'weekly_followup', label: 'Acompanhamento Semanal' },
  { value: 'monthly_review', label: 'Revisão Mensal' },
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
  const [showForm, setShowForm] = useState(false)
  const [showVariables, setShowVariables] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('pessoal')
  const [formData, setFormData] = useState<Partial<Template>>({
    code: '',
    title: '',
    anchor: '',
    touchpoint: '',
    suggested_offset: '',
    channel_default: 'whatsapp',
    message_v1: '',
    message_v2: '',
    active: true,
    priority: 0,
    audience_filter: {},
    variables: []
  })

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

  // Salvar template
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editing ? `/api/relationship/templates/${editing.id}` : '/api/relationship/templates'
      const method = editing ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        toast.success(editing ? 'Template atualizado!' : 'Template criado!')
        setShowForm(false)
        setEditing(null)
        setFormData({
          code: '',
          title: '',
          anchor: '',
          touchpoint: '',
          suggested_offset: '',
          channel_default: 'whatsapp',
          message_v1: '',
          message_v2: '',
          active: true,
          priority: 0,
          audience_filter: {},
          variables: []
        })
        fetchTemplates()
      } else {
        toast.error('Erro ao salvar template')
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error)
      toast.error('Erro ao salvar template')
    }
  }

  // Editar template
  const handleEdit = (template: Template) => {
    setEditing(template)
    setFormData(template)
    setShowForm(true)
  }

  // Inserir variável no texto
  const insertVariable = (variable: string) => {
    const currentValue = formData.message_v1 || ''
    const newValue = currentValue + variable
    setFormData(prev => ({ ...prev, message_v1: newValue }))
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
    setFormData({
      code: '',
      title: '',
      anchor: '',
      touchpoint: '',
      suggested_offset: '',
      channel_default: 'whatsapp',
      message_v1: '',
      message_v2: '',
      active: true,
      priority: 0,
      audience_filter: {},
      variables: []
    })
    setShowForm(true)
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
        <Button onClick={handleNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Template
        </Button>
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
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {editing ? 'Editar Template' : 'Novo Template'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Código</label>
                      <Input
                        value={formData.code || ''}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="Ex: MSG1"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Título</label>
                      <Input
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: Logo Após a Venda"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Âncora</label>
                      <Select
                        value={formData.anchor || ''}
                        onValueChange={(value: string) => setFormData({ ...formData, anchor: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a âncora" />
                        </SelectTrigger>
                        <SelectContent>
                          {ANCHOR_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Canal Padrão</label>
                      <Select
                        value={formData.channel_default || ''}
                        onValueChange={(value: string) => setFormData({ ...formData, channel_default: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o canal" />
                        </SelectTrigger>
                        <SelectContent>
                          {CHANNEL_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Prioridade</label>
                      <Input
                        type="number"
                        value={formData.priority || 0}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Mensagem</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVariables(!showVariables)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Inserir Variáveis
                      </Button>
                    </div>
                    <Textarea
                      value={formData.message_v1 || ''}
                      onChange={(e) => setFormData({ ...formData, message_v1: e.target.value })}
                      placeholder="Digite sua mensagem personalizada..."
                      rows={4}
                      required
                    />
                  </div>

                  {/* Seletor de Variáveis */}
                  {showVariables && (
                    <Card className="border-2 border-blue-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Variáveis Disponíveis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Categorias */}
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(VARIABLE_CATEGORIES).map(([key, category]) => {
                            const isSelected = selectedCategory === key
                            const IconComponent =
                              key === 'pessoal' ? User :
                              key === 'temporal' ? Calendar :
                              key === 'treino' ? Dumbbell :
                              Users
                            return (
                              <Button
                                key={key}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategory(key)}
                                className="transition-all"
                              >
                                <IconComponent className="h-4 w-4 mr-2" />
                                {category.name}
                              </Button>
                            )
                          })}
                        </div>

                        {/* Variáveis da categoria selecionada */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {getVariablesByCategory(selectedCategory).map((variable) => (
                            <div key={variable.key} className="flex items-center justify-between p-2 border rounded-lg">
                              <div className="flex-1">
                                <div className="font-mono text-sm text-blue-600">{variable.key}</div>
                                <div className="text-xs text-gray-600">{variable.description}</div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertVariable(variable.key)}
                              >
                                Inserir
                              </Button>
                            </div>
                          ))}
                        </div>

                        {/* Exemplo de uso */}
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm font-medium text-blue-800 mb-1">💡 Como usar:</div>
                          <div className="text-xs text-blue-700">
                            Clique em "Inserir" para adicionar a variável na sua mensagem.
                            Exemplo: "Olá [Nome do Aluno], [Saudação Temporal]!"
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.active || false}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      />
                      <span className="text-sm">Ativo</span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {editing ? 'Atualizar' : 'Criar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false)
                        setEditing(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

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
                    Criar Primeiro Template
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={template.active ? 'default' : 'secondary'}>
                              {template.code}
                            </Badge>
                            <h3 className="font-semibold">{template.title}</h3>
                            {template.active && (
                              <Badge variant="outline" className="text-green-600">
                                Ativo
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Âncora:</strong> {ANCHOR_OPTIONS.find(a => a.value === template.anchor)?.label || template.anchor}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Canal:</strong> {CHANNEL_OPTIONS.find(c => c.value === template.channel_default)?.label || template.channel_default}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Prioridade:</strong> {template.priority}
                          </p>
                          <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            <strong>Mensagem:</strong> {template.message_v1}
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
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o template "{template.title}"? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(template.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
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
                <Clock className="h-5 w-5" />
                Âncoras de Relacionamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ANCHOR_OPTIONS.map((anchor) => (
                  <div key={anchor.value} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-5 w-5 text-pink-600" />
                      <h3 className="font-semibold">{anchor.label}</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      <strong>ID:</strong> {anchor.value}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Descrição:</strong> Momento específico no ciclo do aluno para disparar mensagens
                    </p>
                  </div>
                ))}
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
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Motor de Relacionamento</h3>
                    <p className="text-sm text-gray-600">Job diário que gera tarefas de relacionamento</p>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    Ativo
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Gatilho de Ocorrências</h3>
                    <p className="text-sm text-gray-600">Cria tarefas automaticamente ao salvar ocorrências com lembrete</p>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    Ativo
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Rate Limiting</h3>
                    <p className="text-sm text-gray-600">Máximo de tarefas por aluno por dia</p>
                  </div>
                  <Badge variant="outline">
                    3 tarefas/dia
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
