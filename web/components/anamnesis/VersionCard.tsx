"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  CheckCircle, 
  Clock, 
  Eye, 
  Edit, 
  Upload, 
  Trash2,
  Save,
  X,
  Copy
} from "lucide-react"
import { toast } from "sonner"

export type VersionCardProps = {
  context: 'anamnesisTemplate' | 'trainingGuidelines'
  id: string
  title: string
  version: number
  status: 'DRAFT' | 'PUBLISHED'
  isDefault: boolean
  publishedAt?: string | null
  rulesCount?: number
  onView?: () => void
  onEdit?: () => void
  onPublish?: () => void
  onSetDefault?: () => void
  onDelete?: () => void
  onRename?: (newTitle: string) => Promise<void>
  onCorrect?: () => void
  onUnpublish?: () => void
  isPublishing?: boolean
  isSettingDefault?: boolean
  isDeleting?: boolean
  isCorrecting?: boolean
  isUnpublishing?: boolean
}

export function VersionCard({
  context,
  id,
  title,
  version,
  status,
  isDefault,
  publishedAt,
  rulesCount,
  onView,
  onEdit,
  onPublish,
  onSetDefault,
  onDelete,
  onRename,
  onCorrect,
  onUnpublish,
  isPublishing = false,
  isSettingDefault = false,
  isDeleting = false,
  isCorrecting = false,
  isUnpublishing = false
}: VersionCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [newTitle, setNewTitle] = useState(title)
  const [isSavingTitle, setIsSavingTitle] = useState(false)

  const handleSaveTitle = async () => {
    if (!onRename || newTitle.trim() === title) {
      setIsEditingTitle(false)
      return
    }

    if (newTitle.trim().length === 0) {
      toast.error("Título não pode estar vazio")
      return
    }

    try {
      setIsSavingTitle(true)
      await onRename(newTitle.trim())
      setIsEditingTitle(false)
      toast.success("Título atualizado com sucesso")
    } catch (error) {
      console.error("Erro ao renomear:", error)
      toast.error("Erro ao atualizar título")
      setNewTitle(title) // Reverter para o título original
    } finally {
      setIsSavingTitle(false)
    }
  }

  const handleCancelEdit = () => {
    setNewTitle(title)
    setIsEditingTitle(false)
  }

  const getStatusBadge = () => {
    if (status === 'PUBLISHED') {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Publicado
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Rascunho
      </Badge>
    )
  }

  const getDefaultBadge = () => {
    if (isDefault) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Padrão
        </Badge>
      )
    }
    return null
  }

  const canEdit = status === 'DRAFT'
  const canPublish = status === 'DRAFT'
  const canSetDefault = status === 'PUBLISHED' && !isDefault
  const canDelete = status === 'DRAFT' && !isDefault
  
  // Debug temporário para botão Excluir
  console.log('🔍 Debug Excluir:', {
    id,
    status,
    isDefault,
    canDelete,
    hasOnDelete: !!onDelete
  })

  return (
    <Card className={`hover:shadow-md transition-shadow ${
      isDefault ? 'bg-green-50 border-green-300 border-2' : ''
    }`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-lg font-semibold"
                  disabled={isSavingTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveTitle}
                  disabled={isSavingTitle}
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={isSavingTitle}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{title}</CardTitle>
                {canEdit && onRename && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingTitle(true)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
            <CardDescription>
              {status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'} • v{version}
            </CardDescription>
          </div>
          {getDefaultBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          {getStatusBadge()}
          <span className="text-sm text-muted-foreground">
            v{version}
          </span>
        </div>

        {publishedAt && (
          <div className="text-sm text-muted-foreground">
            <p>Publicado em: {new Date(publishedAt).toLocaleDateString('pt-BR')}</p>
          </div>
        )}

        {rulesCount !== undefined && (
          <div className="text-sm text-muted-foreground">
            <p>Regras: {rulesCount}</p>
          </div>
        )}

        <div className="space-y-2">
          {/* Primeira linha: Ver, Editar, Definir como Padrão, Excluir */}
          <div className="flex gap-2">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={onView}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </Button>
            )}
            
            {/* DRAFT: Editar habilitado */}
            {onEdit && status === 'DRAFT' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
            
            {/* PUBLICADO: Editar desabilitado */}
            {onEdit && status === 'PUBLISHED' && (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="flex-1 text-gray-400 cursor-not-allowed"
                title="Edite criando uma nova versão"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
            
            {/* Definir como Padrão */}
            {onSetDefault && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSetDefault}
                disabled={!canSetDefault || isSettingDefault}
                className={`flex-1 ${
                  isDefault 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-blue-600 hover:text-blue-700'
                }`}
                title={isDefault ? "Já é a versão padrão" : ""}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {isSettingDefault 
                  ? 'Definindo...' 
                  : isDefault 
                    ? 'Já é Padrão' 
                    : 'Definir como Padrão'
                }
              </Button>
            )}
            
            {/* Excluir: apenas DRAFT não-default - APENAS ÍCONE como na Anamnese */}
            {onDelete && status === 'DRAFT' && !isDefault && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting}
                className={`${
                  isDeleting 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-red-600 hover:text-red-700'
                }`}
                title="Excluir versão"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Segunda linha: Publicar / Corrigir versão */}
          <div className="flex gap-2">
            {/* DRAFT: Publicar habilitado */}
            {onPublish && canPublish && status === 'DRAFT' && (
              <Button
                variant="default"
                size="sm"
                onClick={onPublish}
                disabled={isPublishing}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-1" />
                {isPublishing ? 'Publicando...' : 'Publicar'}
              </Button>
            )}
            
            {/* PUBLICADO: Corrigir versão */}
            {onCorrect && status === 'PUBLISHED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCorrect}
                disabled={isCorrecting}
                className="flex-1 text-blue-600 hover:text-blue-700"
              >
                <Copy className="h-4 w-4 mr-1" />
                {isCorrecting ? 'Corrigindo...' : 'Corrigir versão'}
              </Button>
            )}
            
            {/* PUBLICADO: Despublicar */}
            {onUnpublish && status === 'PUBLISHED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onUnpublish}
                disabled={isUnpublishing}
                className="flex-1 text-orange-600 hover:text-orange-700"
              >
                <Clock className="h-4 w-4 mr-1" />
                {isUnpublishing ? 'Despublicando...' : 'Despublicar'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
