"use client"

/**
 * GATE 10.9 - WhatsApp Integration Page
 * Configuração da integração com WhatsApp (Z-API)
 * MULTI-TENANT: Cada organização configura sua própria instância Z-API
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
  AlertCircle,
  RefreshCw,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

export default function WhatsAppIntegrationPage() {
  const [connected, setConnected] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [showClientToken, setShowClientToken] = useState(false)
  
  const [instanceId, setInstanceId] = useState('')
  const [token, setToken] = useState('')
  const [clientToken, setClientToken] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const handleTestConnection = async () => {
    if (!instanceId || !token || !clientToken) {
      toast.error('Preencha todos os campos')
      return
    }

    setTesting(true)
    
    try {
      // TODO: Implementar API de teste de conexão
      // const response = await fetch('/api/integrations/whatsapp/test', { ... })
      
      // Simulação
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setConnected(true)
      setPhoneNumber('+55 11 98765-4321') // Simulação
      toast.success('WhatsApp conectado!', {
        description: 'Instância ativa e pronta para uso'
      })
    } catch (error: any) {
      toast.error('Erro ao testar conexão', {
        description: error.message
      })
    } finally {
      setTesting(false)
    }
  }

  const handleConnect = async () => {
    if (!instanceId || !token || !clientToken) {
      toast.error('Preencha todos os campos')
      return
    }

    // TODO: Implementar API de salvamento
    // const response = await fetch('/api/integrations/whatsapp/connect', { ... })
    
    toast.success('Credenciais salvas!', {
      description: 'Teste a conexão para validar'
    })
  }

  const handleDisconnect = () => {
    setConnected(false)
    setInstanceId('')
    setToken('')
    setClientToken('')
    setPhoneNumber('')
    toast.success('WhatsApp desconectado')
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
            <div className="bg-white w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
              <Image 
                src="/integrations/whatsapp-logo.jpg" 
                alt="WhatsApp logo"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">WhatsApp Business</h1>
              <p className="text-muted-foreground">
                Conecte seu número WhatsApp via Z-API
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

      {/* Informação Importante - Multi-Tenant */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              📱 Seu Próprio Número WhatsApp
            </p>
            <p className="text-blue-800 dark:text-blue-200">
              Esta é a instância Z-API da <strong>sua organização</strong>. 
              Você usará seu próprio número WhatsApp Business para enviar mensagens aos seus alunos.
              Cada academia/empresa tem sua própria configuração isolada.
            </p>
          </div>
        </div>
      </div>

      {/* Card de Configuração */}
      <Card>
        <CardHeader>
          <CardTitle>Credenciais Z-API</CardTitle>
          <CardDescription>
            Configure sua instância Z-API para envio automático de mensagens WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instance ID */}
          <div className="space-y-2">
            <Label htmlFor="instance-id">Instance ID</Label>
            <Input 
              id="instance-id" 
              placeholder="SUA_INSTANCIA_ZAPI"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              disabled={connected}
            />
            <p className="text-xs text-muted-foreground">
              Exemplo: <code>3C07F6C2D748</code>
            </p>
          </div>

          {/* Token */}
          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <div className="flex gap-2">
              <Input 
                id="token" 
                type={showToken ? 'text' : 'password'}
                placeholder="seu-token-zapi"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={connected}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Client Token */}
          <div className="space-y-2">
            <Label htmlFor="client-token">Client Token</Label>
            <div className="flex gap-2">
              <Input 
                id="client-token" 
                type={showClientToken ? 'text' : 'password'}
                placeholder="seu-client-token"
                value={clientToken}
                onChange={(e) => setClientToken(e.target.value)}
                disabled={connected}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowClientToken(!showClientToken)}
              >
                {showClientToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Número conectado (quando ativo) */}
          {connected && phoneNumber && (
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900 dark:text-green-100">
                  Número conectado: <strong>{phoneNumber}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            {!connected ? (
              <>
                <Button 
                  onClick={handleTestConnection} 
                  className="flex-1"
                  disabled={testing}
                >
                  {testing ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Testando...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Testar Conexão</>
                  )}
                </Button>
                <Button 
                  onClick={handleConnect} 
                  variant="outline"
                  className="flex-1"
                >
                  Salvar Credenciais
                </Button>
              </>
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
                href="https://api.z-api.io" 
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

      {/* Como Obter as Credenciais */}
      <Card>
        <CardHeader>
          <CardTitle>Como Obter as Credenciais</CardTitle>
          <CardDescription>
            Passo a passo para configurar sua instância Z-API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium">Crie uma conta na Z-API</p>
                <p className="text-sm text-muted-foreground">
                  Acesse <a href="https://api.z-api.io" target="_blank" className="text-primary hover:underline">api.z-api.io</a> e crie sua conta
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium">Crie uma nova instância</p>
                <p className="text-sm text-muted-foreground">
                  No painel Z-API, clique em "Criar Instância" e escolha um plano
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium">Conecte seu WhatsApp</p>
                <p className="text-sm text-muted-foreground">
                  Escaneie o QR Code com seu WhatsApp Business
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                4
              </div>
              <div className="flex-1">
                <p className="font-medium">Copie as credenciais</p>
                <p className="text-sm text-muted-foreground">
                  No dashboard, copie: Instance ID, Token e Client Token
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                5
              </div>
              <div className="flex-1">
                <p className="font-medium">Configure aqui no sistema</p>
                <p className="text-sm text-muted-foreground">
                  Cole as credenciais nos campos acima e teste a conexão
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades (quando conectado) */}
      {connected && (
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades Disponíveis</CardTitle>
            <CardDescription>
              O que você poderá fazer com o WhatsApp conectado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Envio automático de mensagens</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Lembretes de treino</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Follow-up de alunos</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Aniversários</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Renovações de planos</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Ocorrências com lembrete</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custos e Limites */}
      <Card>
        <CardHeader>
          <CardTitle>💰 Custos e Limites</CardTitle>
          <CardDescription>
            Informações sobre preços Z-API (consulte o site oficial)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Plano Básico:</strong> ~R$ 49/mês - até 3.000 mensagens</p>
            <p>• <strong>Plano Pro:</strong> ~R$ 99/mês - até 10.000 mensagens</p>
            <p>• <strong>Plano Premium:</strong> ~R$ 199/mês - mensagens ilimitadas</p>
            <p className="mt-3 text-xs">
              ⚠️ Os preços são estimados e podem variar. Consulte o site oficial da Z-API para valores atualizados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
