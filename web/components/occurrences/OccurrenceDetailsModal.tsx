"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { X, Upload, Download, Trash2, Save, AlertCircle, MessageSquare } from "lucide-react"
import { useOccurrencesPermissions } from "@/lib/use-occurrences-permissions"
import MessageComposer from "../relationship/MessageComposer"

type OccurrenceDetails = {
  id: number
  student_id: string
  student_name?: string | null
  group_id: number
  group_name?: string | null
  type_id: number
  type_name?: string | null
  occurred_at: string
  notes?: string | null
  priority?: 'low'|'medium'|'high'
  is_sensitive?: boolean
  reminder_at?: string | null
  reminder_status?: 'PENDING'|'DONE'|'CANCELLED' | null
  owner_user_id?: string | null
  owner_name?: string | null
  status: 'OPEN'|'DONE'
  created_at?: string | null
  updated_at?: string | null
}

type Attachment = {
  id: number
  filename: string
  file_size: number
  mime_type: string
  created_at: string
}

type OccurrenceDetailsModalProps = {
  open: boolean
  onClose: () => void
  occurrenceId?: number
  onSave?: () => void
}

export function OccurrenceDetailsModal({ open, onClose, occurrenceId, onSave }: OccurrenceDetailsModalProps) {
  const { permissions } = useOccurrencesPermissions()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<OccurrenceDetails | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [unsavedConfirmOpen, setUnsavedConfirmOpen] = useState(false)
  const [messageComposerOpen, setMessageComposerOpen] = useState(false)

  // Fontes para selects
  const [groups, setGroups] = useState<Array<{id:number; name:string}>>([])
  const [types, setTypes] = useState<Array<{id:number; name:string; group_id:number}>>([])
  const [trainers, setTrainers] = useState<Array<{user_id:string; name:string}>>([])

  // Form state
  const [formData, setFormData] = useState({
    group_id: 0,
    type_id: 0,
    notes: '',
    priority: 'medium' as 'low'|'medium'|'high',
    is_sensitive: false,
    owner_user_id: '',
    reminder_at: '',
    reminder_status: 'PENDING' as 'PENDING'|'DONE'|'CANCELLED'
  })

  async function fetchSources() {
    try {
      const [g, t, p] = await Promise.all([
        fetch('/api/occurrence-groups', { cache: 'no-store' }).then(r=>r.json()).catch(()=>[]),
        fetch('/api/occurrence-types', { cache: 'no-store' }).then(r=>r.json()).catch(()=>[]),
        fetch('/api/professionals/trainers', { cache: 'no-store' }).then(r=>r.json()).catch(()=>({ trainers:[] }))
      ])
      // Endpoints retornam objetos { groups: [...] } e { types: [...] }
      const groupsData = Array.isArray(g?.groups) ? g.groups : (Array.isArray(g) ? g : [])
      const typesData = Array.isArray(t?.types) ? t.types : (Array.isArray(t) ? t : [])
      setGroups(groupsData)
      setTypes(typesData)
      setTrainers(Array.isArray(p?.trainers)?p.trainers:[])
    } catch {}
  }

  async function fetchOccurrence() {
    if (!occurrenceId) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/occurrences/${occurrenceId}`, { cache: 'no-store' })
      const data = await res.json()
      
      if (res.ok && data && !data.error) {
        setData(data)
        setFormData({
          group_id: data.group_id || 0,
          type_id: data.type_id || 0,
          notes: data.notes || '',
          priority: data.priority || 'medium',
          is_sensitive: data.is_sensitive || false,
          owner_user_id: data.owner_user_id || '',
          reminder_at: data.reminder_at ? new Date(data.reminder_at).toISOString().slice(0, 16) : '',
          reminder_status: data.reminder_status || 'PENDING'
        })
        setCanEdit(data.can_edit && permissions.write)
        fetchAttachments()
      } else {
        toast.error(data.error || 'Erro ao carregar ocorrência')
      }
    } catch (error) {
      toast.error('Erro ao carregar ocorrência')
    } finally {
      setLoading(false)
    }
  }

  async function fetchAttachments() {
    if (!occurrenceId) return
    
    try {
      const res = await fetch(`/api/occurrences/${occurrenceId}/attachments`, { cache: 'no-store' })
      const data = await res.json()
      setAttachments(Array.isArray(data?.attachments)?data.attachments:[])
    } catch {}
  }

  async function handleSave() {
    if (!occurrenceId || !canEdit) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/occurrences/${occurrenceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        const payload = await res.json().catch(()=>({}))
        if (payload?._auditId) {
          toast.success('Ocorrência atualizada e auditoria registrada.')
        } else {
          toast.warning('Ocorrência atualizada. Auditoria em modo degradado.')
        }
        setHasChanges(false)
        onSave?.()
        // Fechar após salvar para evitar alerta de alterações não salvas
        onClose()
      } else {
        const error = await res.json()
        toast.error(error?.error || 'Erro ao atualizar ocorrência', {
          description: error?.details || 'Verifique os dados e tente novamente'
        })
      }
    } catch {
      toast.error('Erro ao atualizar ocorrência')
    } finally {
      setSaving(false)
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !occurrenceId) return
    
    // Validação de tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      const sizeInMB = Math.round(file.size / 1024 / 1024)
      toast.error(`Arquivo muito grande`, {
        description: `O arquivo deve ter no máximo 10MB. Tamanho atual: ${sizeInMB}MB`
      })
      return
    }
    
    // Validação de tipo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Tipo de arquivo inválido`, {
        description: `Use apenas arquivos PDF, JPG ou PNG. Tipo atual: ${file.type}`
      })
      return
    }
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch(`/api/occurrences/${occurrenceId}/attachments`, {
        method: 'POST',
        body: formData
      })
      
      if (res.ok) {
        toast.success('Anexo adicionado com sucesso')
        fetchAttachments()
      } else {
        const error = await res.json()
        toast.error(error?.error || 'Erro ao adicionar anexo', {
          description: error?.details || 'Verifique o arquivo e tente novamente'
        })
      }
    } catch {
      toast.error('Erro ao adicionar anexo')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  async function handleDeleteAttachment(attachmentId: number) {
    if (!occurrenceId) return
    
    try {
      const res = await fetch(`/api/occurrences/${occurrenceId}/attachments/${attachmentId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        toast.success('Anexo removido com sucesso')
        fetchAttachments()
      } else {
        toast.error('Erro ao remover anexo')
      }
    } catch {
      toast.error('Erro ao remover anexo')
    }
  }

  function handleFormChange(field: string, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  function handleClose() {
    if (hasChanges) {
      setUnsavedConfirmOpen(true)
      return
    }
    onClose()
  }

  const handleFollowUp = () => {
    setMessageComposerOpen(true)
  }

  useEffect(() => {
    if (open) {
      fetchSources()
      fetchOccurrence()
    }
  }, [open, occurrenceId])

  const filteredTypes = types.filter(t => !formData.group_id || t.group_id === formData.group_id)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-visible">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Ocorrência #{occurrenceId}
            {data?.status === 'DONE' && <Badge variant="secondary">Encerrada</Badge>}
            {data?.is_sensitive && <Badge variant="destructive">Sensível</Badge>}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : !data ? (
          <div className="p-8 text-center text-muted-foreground">Ocorrência não encontrada</div>
        ) : (
          <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-140px)] pr-2">
            {/* Informações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Aluno</Label>
                <Input value={data.student_name || '—'} disabled />
              </div>
              <div>
                <Label>Data da Ocorrência</Label>
                <Input value={new Date(data.occurred_at).toLocaleString()} disabled />
              </div>
            </div>

            {/* Campos editáveis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Grupo</Label>
                <Select 
                  value={formData.group_id.toString()} 
                  onValueChange={v => {
                    handleFormChange('group_id', parseInt(v))
                    handleFormChange('type_id', 0) // Reset type when group changes
                  }}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map(g => (
                      <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo</Label>
                <Select 
                  value={formData.type_id.toString()} 
                  onValueChange={v => handleFormChange('type_id', parseInt(v))}
                  disabled={!canEdit || !formData.group_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTypes.map(t => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prioridade</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={v => handleFormChange('priority', v)}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Responsável</Label>
                <Select 
                  value={formData.owner_user_id} 
                  onValueChange={v => handleFormChange('owner_user_id', v)}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainers.map(t => (
                      <SelectItem key={t.user_id} value={t.user_id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sensível e Lembrete */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_sensitive}
                  onCheckedChange={v => handleFormChange('is_sensitive', v)}
                  disabled={!canEdit}
                />
                <Label>Ocorrência sensível</Label>
              </div>

              <div className="space-y-2">
                <Label>Lembrete</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="datetime-local"
                    value={formData.reminder_at}
                    onChange={e => handleFormChange('reminder_at', e.target.value)}
                    disabled={!canEdit}
                    className="flex-1"
                  />
                  <Select 
                    value={formData.reminder_status} 
                    onValueChange={v => handleFormChange('reminder_status', v)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="DONE">Concluído</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notas */}
            <div>
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={e => handleFormChange('notes', e.target.value)}
                placeholder="Descrição da ocorrência..."
                maxLength={500}
                disabled={!canEdit}
                className="min-h-[100px]"
              />
              <div className="text-right text-sm text-muted-foreground mt-1">
                {formData.notes.length}/500
              </div>
            </div>

            {/* Anexos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Anexos</Label>
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      disabled={uploading}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      {uploading ? 'Enviando...' : 'Adicionar'}
                    </Button>
                  </div>
                )}
              </div>
              
              {attachments.length === 0 ? (
                <div className="text-center text-muted-foreground py-4 border-2 border-dashed rounded-md">
                  Nenhum anexo
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        <span className="text-sm">{att.filename}</span>
                        <Badge variant="outline" className="text-xs">
                          {(att.file_size / 1024).toFixed(1)} KB
                        </Badge>
                      </div>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAttachment(att.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Aviso de permissão */}
            {!canEdit && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Você não tem permissão para editar esta ocorrência
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleFollowUp}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Enviar follow-up
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              {hasChanges ? 'Cancelar' : 'Fechar'}
            </Button>
            {canEdit && hasChanges && (
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
      {/* Confirmação customizada para alterações não salvas */}
      <AlertDialog open={unsavedConfirmOpen} onOpenChange={setUnsavedConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Há alterações não salvas</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setHasChanges(false)
                setUnsavedConfirmOpen(false)
                onClose()
              }}
            >
              Fechar sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MessageComposer Modal */}
      {data && (
        <MessageComposer
          open={messageComposerOpen}
          onOpenChange={setMessageComposerOpen}
          studentId={data.student_id}
          studentName={data.student_name || 'Aluno'}
          initialMessage={`Follow-up da ocorrência #${data.id}: ${data.notes || 'Sem descrição'}`}
          onSuccess={() => {
            toast.success('Follow-up enviado com sucesso!')
            onSave?.()
          }}
        />
      )}
    </Dialog>
  )
}
