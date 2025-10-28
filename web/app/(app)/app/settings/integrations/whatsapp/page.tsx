'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Smartphone, 
  Globe, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Info,
  TestTube
} from 'lucide-react'
import { toast } from 'sonner'
import { whatsappService } from '@/lib/integrations/whatsapp/service'
import { WhatsAppMethod } from '@/lib/integrations/whatsapp/types'

export default function WhatsAppSettingsPage() {
  const [availableMethods, setAvailableMethods] = useState<WhatsAppMethod[]>([])
  const [preferredMethod, setPreferredMethod] = useState<WhatsAppMethod>('desktop')
  const [isDesktopAvailable, setIsDesktopAvailable] = useState(false)
  const [isWebAvailable, setIsWebAvailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // Verificar métodos disponíveis
      const methods = await whatsappService.getAvailableMethods()
      setAvailableMethods(methods)
      
      // Verificar disponibilidade individual
      const desktopAvailable = await whatsappService.isDesktopAvailable()
      const webAvailable = await whatsappService.isWebAvailable()
      
      setIsDesktopAvailable(desktopAvailable)
      setIsWebAvailable(webAvailable)
      
      // Obter método preferido atual
      const config = whatsappService.getConfig()
      setPreferredMethod(config.preferredMethod)
      
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações do WhatsApp')
    } finally {
      setLoading(false)
    }
  }

  const handleMethodChange = (method: WhatsAppMethod) => {
    if (!availableMethods.includes(method)) {
      toast.error(`Método ${method} não está disponível`)
      return
    }
    
    setPreferredMethod(method)
    whatsappService.updateConfig({ preferredMethod: method })
    
    const methodName = getMethodName(method)
    toast.success(`Método preferido alterado para ${methodName}`)
  }

  const handleTestConnection = async (method: WhatsAppMethod) => {
    setTesting(true)
    try {
      const testContact = {
        phone: '5511999999999', // Número de teste
        name: 'Teste'
      }
      
      const testMessage = {
        text: 'Teste de conexão - Personal Global',
        contact: testContact
      }
      
      let result
      if (method === 'desktop') {
        result = await whatsappService.sendMessage(testMessage)
      } else {
        result = await whatsappService.sendMessage(testMessage)
      }
      
      if (result.success) {
        const methodName = getMethodName(method)
        toast.success(`Teste bem-sucedido!`, {
          description: `${methodName} está funcionando corretamente`
        })
      } else {
        throw new Error(result.error || 'Erro no teste')
      }
      
    } catch (error) {
      const methodName = getMethodName(method)
      toast.error(`Erro no teste do ${methodName}`, {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setTesting(false)
    }
  }

  const getMethodName = (method: WhatsAppMethod): string => {
    switch (method) {
      case 'desktop':
        return 'WhatsApp Desktop'
      case 'web':
        return 'WhatsApp Web'
      case 'api':
        return 'WhatsApp API'
      default:
        return 'WhatsApp'
    }
  }

  const getMethodIcon = (method: WhatsAppMethod) => {
    switch (method) {
      case 'desktop':
        return <Smartphone className="h-5 w-5" />
      case 'web':
        return <Globe className="h-5 w-5" />
      case 'api':
        return <Settings className="h-5 w-5" />
      default:
        return <Settings className="h-5 w-5" />
    }
  }

  const getMethodDescription = (method: WhatsAppMethod): string => {
    switch (method) {
      case 'desktop':
        return 'Abre o aplicativo WhatsApp Desktop instalado no seu computador. Mais rápido e eficiente.'
      case 'web':
        return 'Abre o WhatsApp Web no navegador. Funciona em qualquer dispositivo.'
      case 'api':
        return 'Usa a API oficial do WhatsApp Business. Requer configuração avançada.'
      default:
        return 'Método de integração com WhatsApp'
    }
  }

  const getStatusIcon = (available: boolean) => {
    return available ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusBadge = (available: boolean) => {
    return available ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        Disponível
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        Indisponível
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações do WhatsApp</h1>
            <p className="text-muted-foreground mt-2">
              Configure como o sistema deve abrir o WhatsApp para envio de mensagens.
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando configurações...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações do WhatsApp</h1>
          <p className="text-muted-foreground mt-2">
            Configure como o sistema deve abrir o WhatsApp para envio de mensagens.
          </p>
        </div>

        {/* Status Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Status da Integração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(isDesktopAvailable)}
                  <div>
                    <p className="font-medium">WhatsApp Desktop</p>
                    <p className="text-sm text-muted-foreground">Aplicativo nativo</p>
                  </div>
                </div>
                {getStatusBadge(isDesktopAvailable)}
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(isWebAvailable)}
                  <div>
                    <p className="font-medium">WhatsApp Web</p>
                    <p className="text-sm text-muted-foreground">Navegador web</p>
                  </div>
                </div>
                {getStatusBadge(isWebAvailable)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Método Preferido */}
        <Card>
          <CardHeader>
            <CardTitle>Método Preferido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {(['desktop', 'web'] as WhatsAppMethod[]).map((method) => {
                const isAvailable = availableMethods.includes(method)
                const isSelected = preferredMethod === method
                
                return (
                  <div
                    key={method}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => isAvailable && handleMethodChange(method)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getMethodIcon(method)}
                        <div>
                          <p className="font-medium">{getMethodName(method)}</p>
                          <p className="text-sm text-muted-foreground">
                            {getMethodDescription(method)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <Badge variant="default">Selecionado</Badge>
                        )}
                        {getStatusBadge(isAvailable)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Testes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Testes de Conexão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableMethods.map((method) => (
                <div key={method} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getMethodIcon(method)}
                    <div>
                      <p className="font-medium">{getMethodName(method)}</p>
                      <p className="text-sm text-muted-foreground">
                        Teste a conexão com este método
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(method)}
                    disabled={testing}
                  >
                    {testing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        Testando...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        Testar
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Informações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Informações Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    WhatsApp Desktop
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    Para usar o WhatsApp Desktop, você precisa ter o aplicativo instalado e configurado no seu computador.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Fallback Automático
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-200">
                    Se o método preferido não estiver disponível, o sistema automaticamente usará o WhatsApp Web.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}