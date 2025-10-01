"use client"

/**
 * GATE 10.9 - Hotmart Integration Test Page
 * Página para testar webhooks Hotmart localmente
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const MOCK_PAYLOADS = {
  PURCHASE_APPROVED: {
    id: "d5b2c8f4-3a1e-4b7c-9f0d-1e8a6c3b5d7f",
    event: "PURCHASE_APPROVED",
    version: "2.0.0",
    creation_date: Date.now(),
    data: {
      product: {
        id: 123456,
        name: "Plano Mensal - Personal Trainer",
        ucode: "abc-def-ghi-123"
      },
      buyer: {
        name: "João Silva Teste",
        email: "joao.teste@email.com",
        checkout_phone: "+5511987654321",
        document: "12345678900"
      },
      purchase: {
        order_ref: `HPM${Date.now()}`,
        status: "approved",
        approved_date: Date.now(),
        transaction: `HP${Date.now()}`,
        price: {
          currency_code: "BRL",
          value: 199.90
        },
        payment: {
          type: "CREDIT_CARD",
          installments_number: 1
        },
        subscription: {
          status: "ACTIVE",
          plan: {
            name: "Mensal"
          },
          subscriber: {
            code: `SUB-${Date.now()}`
          }
        }
      },
      producer: {
        name: "Academia Alpha"
      },
      commissions: []
    }
  },
  PURCHASE_REFUNDED: {
    id: "refund-test-" + Date.now(),
    event: "PURCHASE_REFUNDED",
    version: "2.0.0",
    creation_date: Date.now(),
    data: {
      product: {
        id: 123456,
        name: "Plano Mensal - Personal Trainer"
      },
      buyer: {
        name: "João Silva Teste",
        email: "joao.teste@email.com",
        checkout_phone: "+5511987654321",
        document: "12345678900"
      },
      purchase: {
        order_ref: "HPM123456789",
        transaction: "HP12345678901234567890",
        price: {
          currency_code: "BRL",
          value: 199.90
        }
      }
    }
  }
}

export default function HotmartTestPage() {
  const [selectedEvent, setSelectedEvent] = useState<'PURCHASE_APPROVED' | 'PURCHASE_REFUNDED'>('PURCHASE_APPROVED')
  const [payload, setPayload] = useState(JSON.stringify(MOCK_PAYLOADS.PURCHASE_APPROVED, null, 2))
  const [testing, setTesting] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)

  const handleEventChange = (event: 'PURCHASE_APPROVED' | 'PURCHASE_REFUNDED') => {
    setSelectedEvent(event)
    setPayload(JSON.stringify(MOCK_PAYLOADS[event], null, 2))
  }

  const handleTest = async () => {
    setTesting(true)
    setLastResult(null)

    try {
      // Parse payload
      const parsedPayload = JSON.parse(payload)
      
      // Simular webhook (chamando nossa própria API)
      const basicToken = 'test-basic-token-123' // Token fictício para teste
      const hottok = `Basic ${Buffer.from(`test@email.com:${basicToken}`).toString('base64')}`
      
      const response = await fetch('/api/webhooks/hotmart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hotmart-Hottok': hottok
        },
        body: JSON.stringify(parsedPayload)
      })

      const result = await response.json()

      setLastResult({
        status: response.status,
        ok: response.ok,
        data: result
      })

      if (response.ok) {
        toast.success('Webhook processado!', {
          description: result.message || 'Verifique os logs e o banco de dados'
        })
      } else {
        toast.error('Erro ao processar webhook', {
          description: result.error || 'Verifique os logs do console'
        })
      }

    } catch (error: any) {
      toast.error('Erro ao enviar webhook', {
        description: error.message
      })
      setLastResult({
        status: 0,
        ok: false,
        error: error.message
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6 container py-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/settings/integrations/hotmart">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teste de Integração Hotmart</h1>
          <p className="text-muted-foreground">
            Simule webhooks localmente sem precisar configurar na Hotmart
          </p>
        </div>
      </div>

      {/* Seletor de Evento */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Evento</CardTitle>
          <CardDescription>
            Selecione qual evento você deseja simular
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => handleEventChange('PURCHASE_APPROVED')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedEvent === 'PURCHASE_APPROVED'
                  ? 'border-green-500 bg-green-50 dark:bg-green-950'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold">Compra Aprovada</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Simula uma compra aprovada (cria aluno + vincula plano)
              </p>
            </button>

            <button
              onClick={() => handleEventChange('PURCHASE_REFUNDED')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedEvent === 'PURCHASE_REFUNDED'
                  ? 'border-red-500 bg-red-50 dark:bg-red-950'
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-red-600" />
                <h3 className="font-semibold">Reembolso</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Simula um reembolso (desativa aluno)
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Editor de Payload */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payload do Webhook</CardTitle>
              <CardDescription>
                Edite o JSON abaixo para personalizar o teste
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEventChange(selectedEvent)}
            >
              Resetar Payload
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            className="font-mono text-xs h-96"
            placeholder="Cole o payload JSON aqui..."
          />
        </CardContent>
      </Card>

      {/* Botão de Teste */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleTest}
          disabled={testing}
          size="lg"
          className="flex-1"
        >
          {testing ? (
            <>Processando...</>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Simular Webhook Hotmart
            </>
          )}
        </Button>
      </div>

      {/* Resultado */}
      {lastResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {lastResult.ok ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <CardTitle>
                Resultado - HTTP {lastResult.status}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Badge variant={lastResult.ok ? 'default' : 'destructive'}>
                  {lastResult.ok ? 'Sucesso' : 'Erro'}
                </Badge>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(lastResult.data || lastResult.error, null, 2)}
                </pre>
              </div>

              {lastResult.ok && lastResult.data.transaction_id && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        Próximos Passos
                      </p>
                      <ol className="list-decimal list-inside mt-2 space-y-1 text-blue-800 dark:text-blue-200">
                        <li>Verifique se o aluno foi criado em <strong>/app/students</strong></li>
                        <li>Verifique a transação registrada no banco (hotmart_transactions)</li>
                        <li>Verifique os logs no console do servidor</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>📚 Como Usar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">1. Pré-requisitos</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Hotmart conectado (credenciais configuradas)</li>
              <li>Pelo menos 1 mapeamento criado (Produto 123456 → Plano interno)</li>
              <li>Console do navegador aberto (F12) para ver logs</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. Testar Compra Aprovada</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Selecione "Compra Aprovada"</li>
              <li>Edite o <code>product.id</code> no JSON para corresponder ao seu mapeamento</li>
              <li>Clique "Simular Webhook Hotmart"</li>
              <li>Verifique se o aluno foi criado em /app/students</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. Validar no Banco</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Acesse Supabase Dashboard → SQL Editor</li>
              <li>Execute: <code>SELECT * FROM students WHERE email = 'joao.teste@email.com'</code></li>
              <li>Execute: <code>SELECT * FROM hotmart_transactions ORDER BY created_at DESC LIMIT 5</code></li>
              <li>Execute: <code>SELECT * FROM student_services WHERE student_id = '[id-do-aluno]'</code></li>
            </ul>
          </div>

          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                  ⚠️ Atenção
                </p>
                <p className="text-yellow-800 dark:text-yellow-200">
                  Este teste usa um Basic Token fictício. Para testar com token real, 
                  primeiro configure a integração e crie um mapeamento.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
