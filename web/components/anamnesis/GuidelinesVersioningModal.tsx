"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
        throw new Error(error.error || 'Erro ao publicar versÃ£o')
      }

      toast.success('VersÃ£o publicada com sucesso!')
      onVersionUpdate()
      onClose()
    } catch (error) {
      console.error('Erro ao publicar versÃ£o:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao publicar versÃ£o')
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
        throw new Error(error.error || 'Erro ao definir como padrÃ£o')
      }

      toast.success('VersÃ£o definida como padrÃ£o!')
      onVersionUpdate()
      onClose()
    } catch (error) {
      console.error('Erro ao definir como padrÃ£o:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao definir como padrÃ£o')
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
          <DialogDescription>
            Gerencie o status e configurações desta versão da diretriz.
          </DialogDescription>
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
                <span className="text-sm font-medium">VersÃ£o PadrÃ£o:</span>
                {version.is_default ? (
                  <Badge className="bg-green-100 text-green-800">
                    <Star className="h-3 w-3 mr-1" />
                    Sim
                  </Badge>
                ) : (
                  <Badge variant="outline">NÃ£o</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AÃ§Ãµes DisponÃ­veis */}
          <div className="space-y-4">
            {/* Publicar */}
            {canPublish && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-600" />
                    Publicar VersÃ£o
                  </CardTitle>
                  <CardDescription>
                    Publicar esta versÃ£o tornarÃ¡ as regras disponÃ­veis para uso em diretrizes de treino.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg mb-4">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Importante:</p>
                      <p className="text-blue-800">
                        ApÃ³s a publicaÃ§Ã£o, esta versÃ£o nÃ£o poderÃ¡ mais ser editada. 
                        Certifique-se de que todas as regras estÃ£o corretas.
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
                        Publicar VersÃ£o
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Definir como PadrÃ£o */}
            {canSetDefault && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    Definir como PadrÃ£o
                  </CardTitle>
                  <CardDescription>
                    Definir esta versÃ£o como padrÃ£o para novas diretrizes de treino.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg mb-4">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-900">AtenÃ§Ã£o:</p>
                      <p className="text-yellow-800">
                        Esta aÃ§Ã£o irÃ¡ remover o status de padrÃ£o da versÃ£o atual 
                        e aplicarÃ¡ Ã  esta versÃ£o.
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
                        Definir como PadrÃ£o
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* InformaÃ§Ãµes quando nÃ£o hÃ¡ aÃ§Ãµes */}
            {!canPublish && !canSetDefault && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">VersÃ£o Configurada</h3>
                    <p className="text-muted-foreground">
                      {version.is_default 
                        ? 'Esta versÃ£o jÃ¡ estÃ¡ publicada e Ã© a versÃ£o padrÃ£o.'
                        : 'Esta versÃ£o estÃ¡ publicada. Para tornÃ¡-la padrÃ£o, use a aÃ§Ã£o "Definir como PadrÃ£o".'
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
