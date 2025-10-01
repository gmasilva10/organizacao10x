"use client"

/**
 * GATE 10.9 - Eduzz Integration Page
 * Configuração da integração com Eduzz
 */

import { useState } from 'react'
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

export default function EduzzIntegrationPage() {
  const [connected, setConnected] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [publicKey, setPublicKey] = useState('')

  const handleConnect = () => {
    if (!apiKey || !publicKey) {
      toast.error('Preencha todos os campos')
      return
    }

    // TODO: Implementar API de conexão
    setConnected(true)
    toast.success('Eduzz conectado com sucesso!')
  }

  const handleDisconnect = () => {
    setConnected(false)
    setApiKey('')
    setPublicKey('')
    toast.success('Eduzz desconectado')
  }

  const copyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/api/webhooks/eduzz`
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
                src="/integrations/eduzz-logo.jpg" 
                alt="Eduzz logo"
                width={56}
                height={56}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Eduzz</h1>
              <p className="text-muted-foreground">
                Plataforma de vendas e gestão de produtos digitais
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
            Configure suas credenciais Eduzz para sincronização automática de vendas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Public Key */}
          <div className="space-y-2">
            <Label htmlFor="public-key">Public Key</Label>
            <Input 
              id="public-key" 
              placeholder="sua-public-key-eduzz"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              disabled={connected}
            />
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="flex gap-2">
              <Input 
                id="api-key" 
                type={showApiKey ? 'text' : 'password'}
                placeholder="sua-api-key-secreta"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={connected}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            {!connected ? (
              <Button onClick={handleConnect} className="flex-1">
                Conectar Eduzz
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
                href="https://eduzz.com/configuracoes/api" 
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
          <CardTitle>Webhook</CardTitle>
          <CardDescription>
            Configure este webhook no painel da Eduzz para receber eventos automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL do Webhook</Label>
            <div className="flex gap-2">
              <Input 
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/eduzz`}
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

          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Como Configurar
                </p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200">
                  <li>Acesse o painel da Eduzz → Configurações → Webhooks</li>
                  <li>Adicione a URL do webhook acima</li>
                  <li>Selecione os eventos: <strong>Venda Aprovada</strong>, <strong>Reembolso</strong></li>
                  <li>Salve e teste a conexão</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades (quando conectado) */}
      {connected && (
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
                <span className="text-sm">Novos alunos</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Produtos e planos</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Comissões</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
