/**
 * Template Form Modal - Formulário Premium de Templates de Relacionamento
 * Segue o padrão estabelecido em Padrao_tela_cadastro.md
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  Clock,
  Settings,
  Info,
  Save,
  X,
  Loader2
} from 'lucide-react'
import { MessagePreviewBubble, usePreviewData } from './MessagePreviewBubble'
import { getAllVariables } from '@/lib/relationship-variables'

interface Template {
  id?: string
  code?: string
  title: string
  anchor: string
  channel_default: string
  message_v1: string
  message_v2?: string
  active: boolean
  temporal_offset_days?: number | null
  temporal_anchor_field?: string | null
}

interface TemplateFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  template?: Template | null
}

const ANCHOR_OPTIONS = [
  { value: 'sale_close', label: 'Fechamento da Venda', description: 'Quando o aluno fecha contrato' },
  { value: 'first_workout', label: 'Primeiro Treino', description: 'Data do primeiro treino agendado' },
  { value: 'weekly_followup', label: 'Acompanhamento Semanal', description: 'Baseado no último treino' },
  { value: 'monthly_review', label: 'Revisão Mensal', description: 'Aniversário de cadastro' },
  { value: 'birthday', label: 'Aniversário', description: 'Data de nascimento do aluno' },
  { value: 'renewal_window', label: 'Janela de Renovação', description: 'Próximo vencimento do plano' },
  { value: 'occurrence_followup', label: 'Follow-up de Ocorrência', description: 'Após ocorrência com lembrete' }
]

const CHANNEL_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'manual', label: 'Manual' }
]

export function TemplateFormModal({ open, onOpenChange, onSuccess, template }: TemplateFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [showVariables, setShowVariables] = useState(false)
  const [hasTemporalOffset, setHasTemporalOffset] = useState(false)
  const [formData, setFormData] = useState<Partial<Template>>({
    title: '',
    anchor: '',
    channel_default: 'whatsapp',
    message_v1: '',
    message_v2: '',
    active: true,
    temporal_offset_days: null,
    temporal_anchor_field: null
  })

  // Preencher formulário ao editar
  useEffect(() => {
    if (template) {
      setFormData(template)
      setHasTemporalOffset(template.temporal_offset_days !== null && template.temporal_offset_days !== undefined)
    } else {
      setFormData({
        title: '',
        anchor: '',
        channel_default: 'whatsapp',
        message_v1: '',
        message_v2: '',
        active: true,
        temporal_offset_days: null,
        temporal_anchor_field: null
      })
      setHasTemporalOffset(false)
    }
  }, [template])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = template ? `/api/relationship/templates/${template.id}` : '/api/relationship/templates'
      const method = template ? 'PATCH' : 'POST'
      
      const payload = {
        ...formData,
        temporal_offset_days: hasTemporalOffset ? formData.temporal_offset_days : null,
        temporal_anchor_field: hasTemporalOffset ? formData.temporal_anchor_field : null
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        onSuccess?.()
        onOpenChange(false)
      } else {
        const error = await response.json()
        throw new Error(error.details || 'Erro ao salvar template')
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error)
      alert(error instanceof Error ? error.message : 'Erro ao salvar template')
    } finally {
      setLoading(false)
    }
  }

  const insertVariable = (variable: string) => {
    // Garantir que a variável esteja no padrão de colchetes
    const formattedVariable = variable.startsWith('[') ? variable : `[${variable}]`
    const currentValue = formData.message_v1 || ''
    setFormData(prev => ({ ...prev, message_v1: currentValue + formattedVariable }))
  }

  const selectedAnchor = ANCHOR_OPTIONS.find(a => a.value === formData.anchor)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {template ? 'Editar Template' : 'Novo Template'}
            {template?.code && (
              <span className="text-sm font-mono text-muted-foreground">#{template.code}</span>
            )}
          </DialogTitle>
          <DialogDescription>
            {template 
              ? 'Edite as informações do template de relacionamento' 
              : 'Configure um novo template de mensagem automática. O código será gerado automaticamente.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção 1: Informações Básicas */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
              📝 Informações Básicas
            </h3>
            <div className="border rounded-lg p-4 space-y-4">
              <div>
                <Label htmlFor="title" className="mb-2 block">
                  Título do Template *
                </Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Boas-vindas após Fechamento"
                  required
                  minLength={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="anchor" className="mb-2 block">
                    Âncora (Gatilho) *
                  </Label>
                  <Select
                    value={formData.anchor || ''}
                    onValueChange={(value: string) => setFormData({ ...formData, anchor: value })}
                  >
                    <SelectTrigger id="anchor">
                      <SelectValue placeholder="Selecione o momento de envio" />
                    </SelectTrigger>
                    <SelectContent>
                      {ANCHOR_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedAnchor && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedAnchor.description}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="channel" className="mb-2 block">
                    Canal Padrão *
                  </Label>
                  <Select
                    value={formData.channel_default || 'whatsapp'}
                    onValueChange={(value: string) => setFormData({ ...formData, channel_default: value })}
                  >
                    <SelectTrigger id="channel">
                      <SelectValue />
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
              </div>
            </div>
          </div>

          {/* Seção 2: Agendamento Temporal */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
              <Clock className="h-4 w-4" />
              Agendamento Temporal
            </h3>
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="temporal"
                  checked={hasTemporalOffset}
                  onCheckedChange={setHasTemporalOffset}
                />
                <Label htmlFor="temporal">
                  Agendar envio com delay temporal
                </Label>
              </div>

              {hasTemporalOffset && (
                <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                  <div>
                    <Label htmlFor="offset" className="mb-2 block">
                      Tempo (dias) *
                    </Label>
                    <Input
                      id="offset"
                      type="number"
                      value={formData.temporal_offset_days ?? ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        temporal_offset_days: e.target.value ? parseInt(e.target.value) : null 
                      })}
                      placeholder="Ex: 8 (para 8 dias depois)"
                      min="-365"
                      max="365"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Positivo = dias após o evento | Negativo = dias antes do evento
                    </p>
                  </div>

                  {formData.temporal_offset_days !== null && formData.anchor && (
                    <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-700">
                      <strong>📅 Esta mensagem será enviada{' '}
                        {(formData.temporal_offset_days ?? 0) > 0
                          ? `${formData.temporal_offset_days} dia${(formData.temporal_offset_days ?? 0) > 1 ? 's' : ''} após`
                          : (formData.temporal_offset_days ?? 0) < 0
                          ? `${Math.abs(formData.temporal_offset_days ?? 0)} dia${Math.abs(formData.temporal_offset_days ?? 0) > 1 ? 's' : ''} antes de`
                          : 'no momento do'
                        } {selectedAnchor?.label || formData.anchor}
                      </strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Seção 3: Mensagem */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
              <MessageSquare className="h-4 w-4" />
              Mensagem
            </h3>
            <div className="border rounded-lg p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="message" className="mb-2 block">
                    Texto da Mensagem *
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVariables(!showVariables)}
                  >
                    {showVariables ? 'Ocultar' : 'Inserir'} Variáveis
                  </Button>
                </div>
                <Textarea
                  id="message"
                  value={formData.message_v1 || ''}
                  onChange={(e) => setFormData({ ...formData, message_v1: e.target.value })}
                  placeholder="Digite sua mensagem personalizada... Use variáveis como [Nome], [SaudacaoTemporal], etc."
                  rows={6}
                  required
                  minLength={10}
                />
              </div>

              {/* Seletor de Variáveis */}
              {showVariables && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm font-medium mb-2">Variáveis Disponíveis:</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {getAllVariables().map((variable) => (
                      <Button
                        key={variable.key}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="justify-start text-xs h-auto py-2"
                        onClick={() => insertVariable(variable.key)}
                        title={variable.description}
                      >
                        <span className="font-mono text-blue-600">{variable.key}</span>
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Clique em uma variável para inserir na mensagem
                  </p>
                </div>
              )}

              {/* Preview da Mensagem - Estilo Chat */}
              {formData.message_v1 && formData.message_v1.trim() !== '' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    Preview da Mensagem
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 border">
                    <MessagePreviewBubble
                      message={formData.message_v1
                        .replace(/\[PrimeiroNome\]/g, 'João')
                        .replace(/\[SaudacaoTemporal\]/g, 'Bom dia')
                        .replace(/\[NomePersonal\]/g, 'Carlos Personal')
                        .replace(/\[DataTreino\]/g, '15/10/2025')
                        .replace(/\[DataVencimento\]/g, '30/11/2025')
                        .replace(/\[ValorPlano\]/g, 'R$ 150,00')
                      }
                      senderName="Personal Trainer"
                      showAvatar={true}
                    />
                    <div className="mt-3 text-xs text-muted-foreground">
                      📅 Será enviada {hasTemporalOffset && formData.temporal_offset_days 
                        ? (formData.temporal_offset_days > 0 
                            ? `em ${formData.temporal_offset_days} dias` 
                            : `há ${Math.abs(formData.temporal_offset_days)} dias`)
                        : 'imediatamente'} no momento do {selectedAnchor?.label?.toLowerCase() || 'evento'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seção 4: Configurações Avançadas */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
              <Settings className="h-4 w-4" />
              Configurações
            </h3>
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active || false}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">
                  Template ativo (mensagens serão geradas automaticamente)
                </Label>
              </div>
            </div>
          </div>

          {/* Seção 5: Informações Contextuais */}
          {template?.code && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                <Info className="h-4 w-4" />
                Informações
              </h3>
              <div className="text-sm text-muted-foreground space-y-1 bg-gray-50 p-3 rounded-lg">
                <p><strong>Código:</strong> {template.code} (gerado automaticamente)</p>
                <p><strong>ID:</strong> {template.id}</p>
                <p className="text-xs mt-2">
                  O código é único para sua organização e não pode ser alterado.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.title || !formData.anchor || !formData.message_v1}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {!loading && <Save className="h-4 w-4 mr-2" />}
              {template ? 'Atualizar Template' : 'Criar Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
