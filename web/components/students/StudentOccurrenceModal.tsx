"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Upload, X, FileText, Image, File } from "lucide-react"
import { toast } from "sonner"

interface OccurrenceGroup {
  id: number
  name: string
  description?: string
}

interface OccurrenceType {
  id: number
  group_id: number
  name: string
  description?: string
}

interface StudentOccurrence {
  id?: number
  student_id: string
  group_id: number
  type_id: number
  occurred_at: string
  notes: string
  owner_user_id: string
  status: 'OPEN' | 'DONE'
  reminder_at?: string
  reminder_status?: 'PENDING' | 'DONE' | 'CANCELLED'
  reminder_created_by?: string
  created_at?: string
  created_by?: string
  updated_at?: string
  updated_by?: string
}

interface Attachment {
  id?: number
  file_key: string
  file_name: string
  file_ext: string
  file_size_bytes: number
}

interface StudentOccurrenceModalProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
  mode: 'create' | 'edit'
  occurrence?: StudentOccurrence
  onSaved: () => void
}

export function StudentOccurrenceModal({
  open,
  onClose,
  studentId,
  studentName,
  mode,
  occurrence,
  onSaved
}: StudentOccurrenceModalProps) {
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<OccurrenceGroup[]>([])
  const [types, setTypes] = useState<OccurrenceType[]>([])
  const [trainers, setTrainers] = useState<Array<{ id: string; name: string }>>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [resolveConfirm, setResolveConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    group_id: '',
    type_id: '',
    occurred_at: new Date().toISOString().split('T')[0],
    notes: '',
    owner_user_id: '',
    reminder_enabled: false,
    reminder_at: '',
    reminder_notes: ''
  })

  const [hasChanges, setHasChanges] = useState(false)

  // Carregar dados iniciais
  useEffect(() => {
    if (open) {
      loadInitialData()
      if (mode === 'edit' && occurrence) {
        setFormData({
          group_id: occurrence.group_id.toString(),
          type_id: occurrence.type_id.toString(),
          occurred_at: occurrence.occurred_at,
          notes: occurrence.notes,
          owner_user_id: occurrence.owner_user_id,
          reminder_enabled: !!occurrence.reminder_at,
          reminder_at: occurrence.reminder_at ? new Date(occurrence.reminder_at).toISOString().slice(0, 16) : '',
          reminder_notes: ''
        })
        setAttachments(occurrence.attachments || [])
      } else {
        // Reset form for create mode
        setFormData({
          group_id: '',
          type_id: '',
          occurred_at: new Date().toISOString().split('T')[0],
          notes: '',
          owner_user_id: '',
          reminder_enabled: false,
          reminder_at: '',
          reminder_notes: ''
        })
        setAttachments([])
      }
      setHasChanges(false)
    }
  }, [open, mode, occurrence])

  const loadInitialData = async () => {
    try {
      // Carregar grupos
      const groupsResponse = await fetch('/api/occurrence-groups')
      const groupsData = await groupsResponse.json()
      setGroups(groupsData.groups || [])

      // Carregar tipos
      const typesResponse = await fetch('/api/occurrence-types')
      const typesData = await typesResponse.json()
      setTypes(typesData.types || [])

      // Carregar trainers
      const trainersResponse = await fetch('/api/professionals/trainers')
      const trainersData = await trainersResponse.json()
      setTrainers(trainersData.trainers || [])

      // Se não há owner_user_id definido, usar o primeiro trainer como padrão
      const trainersList = trainersData.trainers || []
      if (!formData.owner_user_id && trainersList.length > 0) {
        setFormData(prev => ({ ...prev, owner_user_id: trainersList[0].user_id }))
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error)
      toast.error('Erro ao carregar dados')
    }
  }

  // Filtrar tipos baseado no grupo selecionado
  const filteredTypes = (types || []).filter(type => 
    formData.group_id ? type.group_id === parseInt(formData.group_id) : true
  )

  // Limpar tipo quando grupo muda
  useEffect(() => {
    if (formData.group_id) {
      setFormData(prev => ({ ...prev, type_id: '' }))
    }
  }, [formData.group_id])

  const handleInputChange = (field: string, value: any) => {
    if (field === 'reminder_enabled' && !value) {
      // Limpar data do lembrete quando desativar
      setFormData(prev => ({ ...prev, [field]: value, reminder_at: '', reminder_notes: '' }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    setHasChanges(true)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Arquivo ${file.name} excede 10MB`)
        return
      }

      // Validar extensão
      const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png']
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      if (!fileExt || !allowedExtensions.includes(fileExt)) {
        toast.error(`Arquivo ${file.name} não é suportado`)
        return
      }

      // Adicionar à lista de anexos
      const newAttachment: Attachment = {
        file_key: `temp_${Date.now()}_${file.name}`,
        file_name: file.name,
        file_ext: fileExt,
        file_size_bytes: file.size
      }

      setAttachments(prev => [...prev, newAttachment])
      setHasChanges(true)
    })

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (ext: string) => {
    switch (ext.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image className="h-4 w-4 text-blue-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const validateForm = () => {
    if (!formData.group_id) {
      toast.error('Selecione um grupo')
      return false
    }
    if (!formData.type_id) {
      toast.error('Selecione um tipo')
      return false
    }
    if (!formData.notes.trim()) {
      toast.error('Descrição é obrigatória')
      return false
    }
    if (formData.notes.length < 5) {
      toast.error('Descrição deve ter pelo menos 5 caracteres')
      return false
    }
    if (formData.notes.length > 500) {
      toast.error('Descrição deve ter no máximo 500 caracteres')
      return false
    }
    if (new Date(formData.occurred_at) > new Date()) {
      toast.error('Data da ocorrência não pode ser futura')
      return false
    }
    if (formData.reminder_enabled && !formData.reminder_at) {
      toast.error('Data do lembrete é obrigatória quando o lembrete está ativado')
      return false
    }
    if (formData.reminder_enabled && formData.reminder_at && new Date(formData.reminder_at) <= new Date()) {
      toast.error('Data do lembrete deve ser futura')
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const url = mode === 'create' 
        ? `/api/students/${studentId}/occurrences`
        : `/api/students/${studentId}/occurrences/${occurrence?.id}`

      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          group_id: parseInt(formData.group_id),
          type_id: parseInt(formData.type_id),
          owner_user_id: formData.owner_user_id, // Manter como string UUID
          reminder_at: formData.reminder_enabled && formData.reminder_at 
            ? new Date(formData.reminder_at).toISOString() 
            : null
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(mode === 'create' ? 'Ocorrência criada com sucesso!' : 'Ocorrência atualizada com sucesso!')
        onSaved()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao salvar ocorrência')
      }
    } catch (error) {
      console.error('Erro ao salvar ocorrência:', error)
      toast.error('Erro ao salvar ocorrência')
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async () => {
    if (!occurrence?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/students/${studentId}/occurrences/${occurrence.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DONE' })
      })

      if (response.ok) {
        toast.success('Ocorrência resolvida com sucesso!')
        onSaved()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao resolver ocorrência')
      }
    } catch (error) {
      console.error('Erro ao resolver ocorrência:', error)
      toast.error('Erro ao resolver ocorrência')
    } finally {
      setLoading(false)
      setResolveConfirm(false)
    }
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Nova Ocorrência' : `Ocorrência #${occurrence?.id}`}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create' 
                ? `Registrar nova ocorrência para ${studentName}`
                : `Editar ocorrência de ${studentName}`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Identificação do Aluno */}
            <div className="bg-card border rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Identificação do Aluno</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Confirme o aluno para esta ocorrência
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Aluno</Label>
                  <Input value={studentName} disabled className="mt-2" />
                </div>
              </div>
            </div>

            {/* Classificação da Ocorrência */}
            <div className="bg-card border rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Classificação da Ocorrência</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Defina o grupo e tipo da ocorrência
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="group_id" className="text-sm font-medium">Grupo *</Label>
                    <Select value={formData.group_id} onValueChange={(value) => handleInputChange('group_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        {(groups || []).map((group) => (
                          <SelectItem key={group.id} value={group.id.toString()}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type_id" className="text-sm font-medium">Tipo *</Label>
                    <Select 
                      value={formData.type_id} 
                      onValueChange={(value) => handleInputChange('type_id', value)}
                      disabled={!formData.group_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {(filteredTypes || []).map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalhes da Ocorrência */}
            <div className="bg-card border rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Detalhes da Ocorrência</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Informe os detalhes e descrição da ocorrência
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="occurred_at" className="text-sm font-medium">Data da Ocorrência *</Label>
                      <Input
                        id="occurred_at"
                        type="date"
                        value={formData.occurred_at}
                        onChange={(e) => handleInputChange('occurred_at', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner_user_id" className="text-sm font-medium">Responsável</Label>
                      <Select value={formData.owner_user_id} onValueChange={(value) => handleInputChange('owner_user_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          {trainers.map((trainer) => (
                            <SelectItem key={trainer.id} value={trainer.user_id}>
                              {trainer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">Descrição *</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Descreva a ocorrência..."
                      rows={4}
                      maxLength={500}
                      className="resize-none"
                    />
                    <div className="text-xs text-muted-foreground">
                      {formData.notes.length}/500 caracteres
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lembrete */}
            <div className="bg-card border rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Lembrete</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure um lembrete para acompanhar esta ocorrência
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="reminder_enabled"
                        checked={formData.reminder_enabled}
                        onCheckedChange={(checked) => handleInputChange('reminder_enabled', checked)}
                      />
                      <Label htmlFor="reminder_enabled" className="text-sm font-medium">Ativar Lembrete</Label>
                    </div>
                    {formData.reminder_enabled && (
                      <div className="w-64">
                        <Input
                          id="reminder_at"
                          type="datetime-local"
                          value={formData.reminder_at}
                          onChange={(e) => handleInputChange('reminder_at', e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                          className="h-9 text-sm w-full"
                          placeholder="Data e hora"
                        />
                      </div>
                    )}
                  </div>
                  {formData.reminder_enabled && (
                    <div className="space-y-3">
                      <div className="text-xs text-muted-foreground">
                        Defina quando deseja ser lembrado sobre esta ocorrência
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reminder_notes" className="text-sm font-medium">
                          Descrição do Lembrete
                        </Label>
                        <Textarea
                          id="reminder_notes"
                          value={formData.reminder_notes}
                          onChange={(e) => handleInputChange('reminder_notes', e.target.value)}
                          placeholder="Ex: Enviar uma msg perguntando se deu certo..."
                          rows={2}
                          className="text-sm"
                        />
                        <div className="text-xs text-muted-foreground">
                          Descreva o que você precisa fazer quando o lembrete for acionado
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Anexos */}
            <div className="bg-card border rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Anexos</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Adicione arquivos relacionados à ocorrência
                  </p>
                </div>
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Adicionar Arquivos
                  </Button>
                  <div className="text-xs text-muted-foreground text-center">
                    PDF, JPG, PNG até 10MB cada
                  </div>
                  
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">Arquivos anexados:</div>
                      {attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(attachment.file_ext)}
                            <div>
                              <div className="text-sm font-medium">{attachment.file_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatFileSize(attachment.file_size_bytes)}
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t bg-background p-4 flex justify-between">
            <div>
              {mode === 'edit' && occurrence?.status === 'OPEN' && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setResolveConfirm(true)}
                  disabled={loading}
                >
                  Resolver
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {mode === 'create' ? 'Criar' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Resolução */}
      <AlertDialog open={resolveConfirm} onOpenChange={setResolveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolver Ocorrência</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar esta ocorrência como resolvida? Esta ação será registrada na timeline do aluno.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResolve}>
              Resolver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
