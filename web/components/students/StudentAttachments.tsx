"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  X, 
  Download,
  Eye,
  Loader2
} from "lucide-react"
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils"

interface Attachment {
  id: string
  file_name: string
  file_ext: string
  file_size_bytes: number
  file_url: string
  uploaded_at: string
}

interface StudentAttachmentsProps {
  studentId: string
  attachments: Attachment[]
  onAttachmentsChange: (attachments: Attachment[]) => void
}

export default function StudentAttachments({ 
  studentId, 
  attachments, 
  onAttachmentsChange 
}: StudentAttachmentsProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newAttachments: Attachment[] = []

    for (const file of Array.from(files)) {
      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        showErrorToast(`Arquivo ${file.name} excede 10MB`)
        continue
      }

      // Validar extensão
      const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png']
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      if (!fileExt || !allowedExtensions.includes(fileExt)) {
        showErrorToast(`Arquivo ${file.name} não é suportado`)
        continue
      }

      // Criar attachment temporário
      const tempAttachment: Attachment = {
        id: `temp_${Date.now()}_${Math.random()}`,
        file_name: file.name,
        file_ext: fileExt,
        file_size_bytes: file.size,
        file_url: URL.createObjectURL(file),
        uploaded_at: new Date().toISOString()
      }

      newAttachments.push(tempAttachment)
    }

    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments])
      showSuccessToast(`${newAttachments.length} arquivo(s) adicionado(s)`)
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveAttachment = (attachmentId: string) => {
    const updatedAttachments = attachments.filter(att => att.id !== attachmentId)
    onAttachmentsChange(updatedAttachments)
    showSuccessToast('Anexo removido')
  }

  const handleDownloadAttachment = (attachment: Attachment) => {
    if (attachment.file_url.startsWith('blob:')) {
      // Para arquivos temporários, criar link de download
      const link = document.createElement('a')
      link.href = attachment.file_url
      link.download = attachment.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // Para arquivos do Supabase, abrir em nova aba
      window.open(attachment.file_url, '_blank')
    }
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

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Anexos do Aluno
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
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
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Adicionar Arquivos
          </Button>
          <div className="text-xs text-muted-foreground text-center">
            PDF, JPG, PNG até 10MB cada
          </div>
        </div>

        {/* Attachments List */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">
              {attachments.length} arquivo(s) anexado(s)
            </div>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(attachment.file_ext)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {attachment.file_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.file_size_bytes)} • {attachment.file_ext.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadAttachment(attachment)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {attachments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum anexo adicionado</p>
            <p className="text-xs">Clique em "Adicionar Arquivos" para começar</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
