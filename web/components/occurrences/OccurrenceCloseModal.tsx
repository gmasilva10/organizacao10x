"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Upload, Download, Trash2, Save, X } from "lucide-react"
import { useOccurrencesPermissions } from "@/lib/use-occurrences-permissions"

type OccurrenceCloseModalProps = {
  open: boolean
  onClose: () => void
  occurrenceId?: number
  onSuccess?: () => void
}

type Attachment = {
  id: number
  filename: string
  file_size: number
  mime_type: string
  created_at: string
}

export function OccurrenceCloseModal({ open, onClose, occurrenceId, onSuccess }: OccurrenceCloseModalProps) {
  const { permissions } = useOccurrencesPermissions()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  
  const [formData, setFormData] = useState({
    resolution_outcome: 'resolved' as 'resolved'|'message_sent'|'no_reply'|'rescheduled'|'cancelled'|'other',
    resolution_notes: '',
    resolved_at: new Date().toISOString().slice(0,16), // para input datetime-local
    resolution_attachments: [] as File[]
  })
  const [unsavedOpen, setUnsavedOpen] = useState(false)

  async function handleSave() {
    if (!occurrenceId) return
    
    setSaving(true)
    try {
      const outcomeMap: Record<string,string> = { message_sent: 'notified', no_reply: 'no_response' }
      const mappedOutcome = (outcomeMap as any)[formData.resolution_outcome] || formData.resolution_outcome
      const isoResolvedAt = formData.resolved_at ? new Date(formData.resolved_at).toISOString() : new Date().toISOString()

      const res = await fetch(`/api/occurrences/${occurrenceId}/close`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution_outcome: mappedOutcome,
          resolution_notes: formData.resolution_notes,
          resolved_at: isoResolvedAt
        })
      })
      
      if (res.ok) {
        toast.success('Ocorrência encerrada com sucesso')
        
        // Upload anexos se houver
        if (formData.resolution_attachments.length > 0) {
          await uploadResolutionAttachments()
        }
        
        onSuccess?.()
        onClose()
        resetForm()
      } else {
        const error = await res.json()
        toast.error(error?.error || 'Erro ao encerrar ocorrência', {
          description: error?.details || 'Verifique os dados e tente novamente'
        })
      }
    } catch {
      toast.error('Erro ao encerrar ocorrência')
    } finally {
      setSaving(false)
    }
  }

  async function uploadResolutionAttachments() {
    if (!occurrenceId || formData.resolution_attachments.length === 0) return
    
    for (const file of formData.resolution_attachments) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'resolution')
        
        await fetch(`/api/occurrences/${occurrenceId}/attachments`, {
          method: 'POST',
          body: formData
        })
      } catch (error) {
        console.error('Erro ao fazer upload do anexo:', error)
      }
    }
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return
    
    // Validação de tamanho (10MB por arquivo)
    const oversizedFiles = files.filter(f => f.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error('Alguns arquivos são muito grandes. Máximo 10MB por arquivo.')
      return
    }
    
    // Validação de tipo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    const invalidTypes = files.filter(f => !allowedTypes.includes(f.type))
    if (invalidTypes.length > 0) {
      toast.error('Alguns arquivos têm tipo não permitido. Use PDF, JPG ou PNG.')
      return
    }
    
    setFormData(prev => ({
      ...prev,
      resolution_attachments: [...prev.resolution_attachments, ...files]
    }))
    
    event.target.value = ''
  }

  function removeAttachment(index: number) {
    setFormData(prev => ({
      ...prev,
      resolution_attachments: prev.resolution_attachments.filter((_, i) => i !== index)
    }))
  }

  function resetForm() {
    setFormData({
      resolution_outcome: 'resolved',
      resolution_notes: '',
      resolved_at: new Date().toISOString().slice(0,16),
      resolution_attachments: []
    })
  }

  function handleClose() {
    if (formData.resolution_notes || formData.resolution_attachments.length > 0) {
      setUnsavedOpen(true)
      return
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Encerrar Ocorrência #{occurrenceId}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Motivo + Data de Encerramento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Motivo</Label>
              <Select 
                value={formData.resolution_outcome} 
                onValueChange={v => setFormData(prev => ({ ...prev, resolution_outcome: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved">Resolvida</SelectItem>
                  <SelectItem value="message_sent">Mensagem enviada</SelectItem>
                  <SelectItem value="no_reply">Sem resposta</SelectItem>
                  <SelectItem value="rescheduled">Reagendada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data de Encerramento</Label>
              <Input
                type="datetime-local"
                value={formData.resolved_at}
                onChange={e => setFormData(prev => ({ ...prev, resolved_at: e.target.value }))}
              />
            </div>
          </div>

          {/* Notas de resolução */}
          <div>
            <Label>Notas de Resolução</Label>
            <Textarea
              value={formData.resolution_notes}
              onChange={e => setFormData(prev => ({ ...prev, resolution_notes: e.target.value }))}
              placeholder="Descreva como a ocorrência foi resolvida..."
              maxLength={500}
              className="min-h-[100px]"
            />
            <div className="text-right text-sm text-muted-foreground mt-1">
              {formData.resolution_notes.length}/500
            </div>
          </div>

          {/* Anexos de resolução */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Anexos de Resolução (opcional)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resolution-file-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('resolution-file-upload')?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Adicionar Anexos
                </Button>
              </div>
            </div>
            
            {formData.resolution_attachments.length === 0 ? (
              <div className="text-center text-muted-foreground py-4 border-2 border-dashed rounded-md">
                Nenhum anexo de resolução
              </div>
            ) : (
              <div className="space-y-2">
                {formData.resolution_attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aviso */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Atenção:</strong> Ao encerrar esta ocorrência, ela será marcada como concluída e não poderá ser reaberta. 
              Certifique-se de que todas as informações estão corretas.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !formData.resolution_outcome}
            className="bg-red-600 hover:bg-red-700"
          >
            <Save className="w-4 h-4 mr-1" />
            {saving ? 'Encerrando...' : 'Encerrar Ocorrência'}
          </Button>
        </div>
      </DialogContent>
      {/* Confirmação customizada para dados não salvos */}
      <AlertDialog open={unsavedOpen} onOpenChange={setUnsavedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Há dados preenchidos</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { resetForm(); setUnsavedOpen(false); onClose(); }}>Fechar sem salvar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
