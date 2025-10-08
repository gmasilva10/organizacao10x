/**
 * GATE 10.9 - Organization Settings Component
 * Configurações gerais da organização
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Palette, Globe, Upload, X, Image as ImageIcon } from 'lucide-react'
import { useOrganization } from '@/hooks/useOrganization'
import type { Organization } from '@/types/organization'
import { useState, useRef } from 'react'
import { useToast } from '@/components/ui/toast'
import Image from 'next/image'

export default function OrganizationSettings() {
  const { organization, isLoading, uploadLogo, removeLogo, isUploading } = useOrganization()
  const { success, error } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validações client-side
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        error('Apenas arquivos JPG, PNG e WEBP são permitidos')
        return
      }

      const maxSize = 2 * 1024 * 1024 // 2MB
      if (file.size > maxSize) {
        error('Arquivo deve ter no máximo 2MB')
        return
      }

      // Criar preview
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    await uploadLogo({
      file,
      onSuccess: (response) => {
        success('Logomarca atualizada com sucesso!')
        setPreviewUrl(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      },
      onError: (errorMsg) => {
        error(errorMsg)
      }
    })
  }

  const handleRemove = async () => {
    try {
      await removeLogo()
      success('Logomarca removida com sucesso!')
    } catch (err) {
      error(err instanceof Error ? err.message : 'Erro ao remover logomarca')
    }
  }

  const handleCancel = () => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Organização</h2>
        <p className="text-muted-foreground">
          Configure dados da sua empresa e preferências gerais.
        </p>
      </div>

      {/* Dados da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Nome da Organização</Label>
              <Input 
                id="org-name" 
                placeholder="Minha Academia" 
                defaultValue="Organizacao10x"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-cnpj">CNPJ</Label>
              <Input 
                id="org-cnpj" 
                placeholder="00.000.000/0000-00" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-address">Endereço</Label>
            <Input 
              id="org-address" 
              placeholder="Rua, número, bairro, cidade - UF" 
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-phone">Telefone</Label>
              <Input 
                id="org-phone" 
                placeholder="(00) 00000-0000" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-email">E-mail</Label>
              <Input 
                id="org-email" 
                type="email" 
                placeholder="contato@academia.com" 
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button>Salvar Dados</Button>
          </div>
        </CardContent>
      </Card>

      {/* Logomarca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logomarca da Organização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {/* Preview da logomarca atual */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                {organization && (organization as unknown as Organization).logo_url ? (
                  <Image
                    src={(organization as unknown as Organization).logo_url!}
                    alt="Logomarca atual"
                    width={64}
                    height={64}
                    className="object-contain rounded"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {organization && (organization as unknown as Organization).logo_url ? 'Logomarca atual' : 'Nenhuma logomarca definida'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Recomendado: 200x200px, máximo 2MB
                </p>
              </div>
            </div>

            {/* Preview da nova logomarca (se selecionada) */}
            {previewUrl && (
              <div className="space-y-2">
                <Label>Preview da nova logomarca:</Label>
                <div className="w-20 h-20 border-2 border-primary rounded-lg flex items-center justify-center bg-gray-50">
                  <Image
                    src={previewUrl}
                    alt="Preview da nova logomarca"
                    width={64}
                    height={64}
                    className="object-contain rounded"
                  />
                </div>
              </div>
            )}

            {/* Upload de nova logomarca */}
            <div className="space-y-2">
              <Label htmlFor="logo-upload">Selecionar nova logomarca</Label>
              <input
                ref={fileInputRef}
                id="logo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Arquivo
                </Button>
                
                {previewUrl && (
                  <>
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                    >
                      {isUploading ? 'Enviando...' : 'Confirmar Upload'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Remover logomarca */}
            {organization && (organization as unknown as Organization).logo_url && !previewUrl && (
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isUploading}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remover Logomarca
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tema e Preferências */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Tema e Preferências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tema da Interface</Label>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">Claro</Button>
              <Button variant="default" className="flex-1">Escuro</Button>
              <Button variant="outline" className="flex-1">Automático</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Fuso Horário</Label>
            <Input 
              id="timezone" 
              value="America/Sao_Paulo (GMT-3)" 
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Fuso horário usado para agendamentos e lembretes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Localização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Localização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Input 
                id="language" 
                value="Português (Brasil)" 
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <Input 
                id="currency" 
                value="Real (R$)" 
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
