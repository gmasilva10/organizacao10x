"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { 
  Upload, 
  CheckCircle, 
  Clock, 
  Star,
  AlertTriangle,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

interface GuidelinesVersioningModalProps {
  isOpen: boolean
  onClose: () => void
  version: {
    id: string
    version: number
    status: 'DRAFT' | 'PUBLISHED'
    is_default: boolean
  }
  onVersionUpdate: () => void
}

export function GuidelinesVersioningModal({ 
  isOpen, 
  onClose, 
  version, 
  onVersionUpdate 
}: GuidelinesVersioningModalProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSettingDefault, setIsSettingDefault] = useState(false)

  const handlePublish = async () => {
    setIsPublishing(true)

    try {
      const response = await fetch(`/api/guidelines/versions/${version.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao publicar versão')
      }

      toast.success('Versão publicada com sucesso!')
      onVersionUpdate()
      onClose()
    } catch (error) {
      console.error('Erro ao publicar versão:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao publicar versão')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleSetDefault = async () => {
    setIsSettingDefault(true)

    try {
      const response = await fetch(`/api/guidelines/versions/${version.id}/set-default`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao definir como padrão')
      }

      toast.success('Versão definida como padrão!')
      onVersionUpdate()
      onClose()
    } catch (error) {
      console.error('Erro ao definir como padrão:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao definir como padrão')
    } finally {
      setIsSettingDefault(false)
    }
  }

  const canPublish = version.status === 'DRAFT'
  const canSetDefault = version.status === 'PUBLISHED' && !version.is_default

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Gerenciar Versão {version.version}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Atual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estado:</span>
                <Badge variant={version.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                  {version.status === 'PUBLISHED' ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Publicado
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      Rascunho
                    </>
                  )}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Versão Padrão:</span>
                {version.is_default ? (
                  <Badge className="bg-green-100 text-green-800">
                    <Star className="h-3 w-3 mr-1" />
                    Sim
                  </Badge>
                ) : (
                  <Badge variant="outline">Não</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ações Disponíveis */}
          <div className="space-y-4">
            {/* Publicar */}
            {canPublish && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-600" />
                    Publicar Versão
                  </CardTitle>
                  <CardDescription>
                    Publicar esta versão tornará as regras disponíveis para uso em diretrizes de treino.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg mb-4">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Importante:</p>
                      <p className="text-blue-800">
                        Após a publicação, esta versão não poderá mais ser editada. 
                        Certifique-se de que todas as regras estão corretas.
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handlePublish} 
                    disabled={isPublishing}
                    className="w-full"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Publicando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Publicar Versão
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Definir como Padrão */}
            {canSetDefault && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    Definir como Padrão
                  </CardTitle>
                  <CardDescription>
                    Definir esta versão como padrão para novas diretrizes de treino.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg mb-4">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-900">Atenção:</p>
                      <p className="text-yellow-800">
                        Esta ação irá remover o status de padrão da versão atual 
                        e aplicará à esta versão.
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleSetDefault} 
                    disabled={isSettingDefault}
                    variant="outline"
                    className="w-full"
                  >
                    {isSettingDefault ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Definindo...
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-2" />
                        Definir como Padrão
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Informações quando não há ações */}
            {!canPublish && !canSetDefault && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Versão Configurada</h3>
                    <p className="text-muted-foreground">
                      {version.is_default 
                        ? 'Esta versão já está publicada e é a versão padrão.'
                        : 'Esta versão está publicada. Para torná-la padrão, use a ação "Definir como Padrão".'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
