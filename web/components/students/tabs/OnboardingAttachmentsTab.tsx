"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Upload, 
  File, 
  FileImage, 
  FileText, 
  Download, 
  Trash2, 
  Loader2,
  Paperclip,
  AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/components/ui/toast"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Attachment {
  id: string
  file_name: string
  mime_type: string
  file_size: number
  description: string | null
  created_at: string
  url?: string | null
  error?: string
}

interface OnboardingAttachmentsTabProps {
  studentId: string
}

export default function OnboardingAttachmentsTab({ studentId }: OnboardingAttachmentsTabProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const { success: toastSuccess, error: toastError } = useToast()

  const fetchAttachments = useCallback(async () => {
    if (!studentId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/students/${studentId}/onboarding/attachments`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao carregar anexos')
      }

      setAttachments(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('Erro ao buscar anexos:', err)
      setError(err instanceof Error ? err.message : 'Falha na comunicação com o servidor.')
      setAttachments([])
    } finally {
      setLoading(false)
    }
  }, [studentId])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar tamanho (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        toastError("Arquivo muito grande: O arquivo deve ter no máximo 5MB.")
        return
      }

      // Validar tipo MIME
      const allowedTypes = ['image/*', 'application/pdf', 'text/plain']
      const isValidType = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1))
        }
        return file.type === type
      })

      if (!isValidType) {
        toastError("Tipo de arquivo não permitido: Apenas imagens, PDFs e arquivos de texto são permitidos.")
        return
      }

      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !studentId) return

    setUploading(true)

    try {
      // Primeiro, obter URL de upload assinada
      const uploadResponse = await fetch(`/api/students/${studentId}/onboarding/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type
        })
      })

      const uploadResult = await uploadResponse.json()

      if (!uploadResponse.ok) {
        throw new Error(uploadResult.error || 'Erro ao obter URL de upload')
      }

      // Fazer upload do arquivo para a URL assinada
      const fileUploadResponse = await fetch(uploadResult.uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type
        }
      })

      if (!fileUploadResponse.ok) {
        throw new Error('Erro ao fazer upload do arquivo')
      }

      toastSuccess(`Upload realizado com sucesso: Arquivo "${selectedFile.name}" foi anexado.`)

      // Limpar formulário e recarregar lista
      setSelectedFile(null)
      setDescription("")
      await fetchAttachments()

    } catch (err) {
      console.error('Erro no upload:', err)
      toastError(err instanceof Error ? err.message : "Não foi possível fazer upload do arquivo.")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (attachmentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/students/${studentId}/onboarding/attachments/${attachmentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao excluir arquivo')
      }

      toastSuccess(`Arquivo excluído: "${fileName}" foi removido com sucesso.`)

      await fetchAttachments()

    } catch (err) {
      console.error('Erro ao excluir:', err)
      toastError(err instanceof Error ? err.message : "Não foi possível excluir o arquivo.")
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <FileImage className="h-5 w-5 text-blue-600" />
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-600" />
    } else {
      return <File className="h-5 w-5 text-gray-600" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Carregar anexos quando o componente monta
  useState(() => {
    fetchAttachments()
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando anexos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Anexar Arquivos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="file-upload" className="text-sm font-medium">
              Selecione um arquivo
            </label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
              accept="image/*,application/pdf,text/plain"
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Tipos permitidos: Imagens, PDF, Texto. Máximo: 5MB
            </p>
          </div>

          {selectedFile && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                {getFileIcon(selectedFile.type)}
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Descrição (opcional)
                </label>
                <Textarea
                  id="description"
                  placeholder="Adicione uma descrição para este arquivo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <Button 
                onClick={handleUpload} 
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Anexar Arquivo
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attachments List */}
      <Card>
        <CardHeader>
          <CardTitle>Anexos ({attachments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                <p className="text-red-600 mb-2">{error}</p>
                <Button variant="outline" onClick={fetchAttachments}>
                  Tentar novamente
                </Button>
              </div>
            </div>
          ) : attachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Paperclip className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Nenhum anexo encontrado</h3>
              <p>Faça upload de arquivos para começar a anexar documentos ao onboarding.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getFileIcon(attachment.mime_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {attachment.file_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(attachment.file_size)}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(attachment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {attachment.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {attachment.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {attachment.url ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => attachment.url && window.open(attachment.url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    ) : attachment.error ? (
                      <Badge variant="destructive" className="text-xs">
                        Erro
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Carregando...
                      </Badge>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Anexo</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir "{attachment.file_name}"?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(attachment.id, attachment.file_name)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
