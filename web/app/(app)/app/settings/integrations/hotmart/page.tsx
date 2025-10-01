"use client"

/**
 * GATE 10.9 - Hotmart Integration Page
 * Configuração da integração com Hotmart
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

export default function HotmartIntegrationPage() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [showClientSecret, setShowClientSecret] = useState(false)
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [basicToken, setBasicToken] = useState('')
  const [showBasicToken, setShowBasicToken] = useState(false)
  
  // Carregar status ao montar
  useEffect(() => {
    loadStatus()
  }, [])
  
  const loadStatus = async () => {
    try {
      const response = await fetch('/api/integrations/hotmart/status')
      const data = await response.json()
      
      if (data.connected) {
        setConnected(true)
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    if (!clientId || !clientSecret || !basicToken) {
      toast.error('Preencha todos os campos')
      return
    }

    try {
      const response = await fetch('/api/integrations/hotmart/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          basic_token: basicToken
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        toast.error('Erro ao conectar', {
          description: data.details || data.error
        })
        return
      }
      
      setConnected(true)
      toast.success('Hotmart conectado com sucesso!', {
        description: 'Credenciais validadas via OAuth2'
      })
      
    } catch (error: any) {
      toast.error('Erro ao conectar', {
        description: error.message
      })
    }
  }

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/integrations/hotmart/disconnect', {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        toast.error('Erro ao desconectar')
        return
      }
      
      setConnected(false)
      setClientId('')
      setClientSecret('')
      setBasicToken('')
      toast.success('Hotmart desconectado')
      
    } catch (error: any) {
      toast.error('Erro ao desconectar', {
        description: error.message
      })
    }
  }

  const copyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/api/webhooks/hotmart`
    navigator.clipboard.writeText(webhookUrl)
    toast.success('URL do Webhook copiada!')
  }

  return (
    <div className="space-y-6 container py-6">
      {/* Header com Voltar */}
      <div className="flex items-center gap-4">
        <Link href="/app/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="bg-white w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
              <Image 
                src="/integrations/hotmart-logo.jpg" 
                alt="Hotmart logo"
                width={56}
                height={56}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Hotmart</h1>
              <p className="text-muted-foreground">
                Plataforma de produtos digitais e afiliados
              </p>
            </div>
          </div>
        </div>
        <Badge 
          variant={connected ? 'default' : 'outline'}
          className="h-8"
        >
          {connected ? (
            <><CheckCircle2 className="h-3 w-3 mr-1" /> Conectado</>
          ) : (
            <><XCircle className="h-3 w-3 mr-1" /> Desconectado</>
          )}
        </Badge>
      </div>

      {/* Card de Configuração */}
      <Card>
        <CardHeader>
          <CardTitle>Credenciais da API</CardTitle>
          <CardDescription>
            Configure suas credenciais Hotmart para sincronização automática de vendas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Client ID */}
          <div className="space-y-2">
            <Label htmlFor="client-id">Client ID</Label>
            <Input 
              id="client-id" 
              placeholder="seu-client-id-hotmart"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={connected}
            />
          </div>

          {/* Client Secret */}
          <div className="space-y-2">
            <Label htmlFor="client-secret">Client Secret</Label>
            <div className="flex gap-2">
              <Input 
                id="client-secret" 
                type={showClientSecret ? 'text' : 'password'}
                placeholder="seu-client-secret"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                disabled={connected}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowClientSecret(!showClientSecret)}
              >
                {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Basic Token */}
          <div className="space-y-2">
            <Label htmlFor="basic-token">Basic Token (Webhook)</Label>
            <div className="flex gap-2">
              <Input 
                id="basic-token" 
                type={showBasicToken ? 'text' : 'password'}
                placeholder="seu-basic-token"
                value={basicToken}
                onChange={(e) => setBasicToken(e.target.value)}
                disabled={connected}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowBasicToken(!showBasicToken)}
              >
                {showBasicToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            {!connected ? (
              <Button 
                onClick={async () => {
                  setConnecting(true)
                  await handleConnect()
                  setConnecting(false)
                }} 
                className="flex-1"
                disabled={connecting}
              >
                {connecting ? 'Conectando...' : 'Conectar Hotmart'}
              </Button>
            ) : (
              <Button 
                onClick={handleDisconnect} 
                variant="destructive" 
                className="flex-1"
              >
                Desconectar
              </Button>
            )}
            <Button 
              variant="outline"
              asChild
            >
              <a 
                href="https://app-vlc.hotmart.com/tools/api" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Obter Credenciais
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhook */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook (Postback)</CardTitle>
          <CardDescription>
            Configure este postback no painel da Hotmart para receber notificações de vendas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL do Postback</Label>
            <div className="flex gap-2">
              <Input 
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/hotmart`}
                disabled
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={copyWebhookUrl}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                  Como Configurar
                </p>
                <ol className="list-decimal list-inside space-y-1 text-orange-800 dark:text-orange-200">
                  <li>Acesse Hotmart → Ferramentas → Postback de Vendas</li>
                  <li>Adicione a URL do postback acima</li>
                  <li>Informe o Basic Token configurado anteriormente</li>
                  <li>Salve e aguarde a primeira venda para testar</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próximos Passos (quando conectado) */}
      {connected && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Sincronização Automática</CardTitle>
              <CardDescription>
                O que será sincronizado automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Vendas aprovadas</span>
                </div>
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Novos compradores</span>
                </div>
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Produtos</span>
                </div>
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Comissões de afiliados</span>
                </div>
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Reembolsos</span>
                </div>
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Assinaturas recorrentes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA - Configurar Mapeamentos */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Configure os Mapeamentos</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Para que a sincronização funcione, você precisa mapear seus produtos Hotmart aos planos internos.
                  </p>
                  <div className="flex gap-2">
                    <Link href="/app/settings/integrations/hotmart/mappings">
                      <Button variant="default">
                        Configurar Mapeamentos
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/app/settings/integrations/hotmart/test">
                      <Button variant="outline">
                        🧪 Testar Integração
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
