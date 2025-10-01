/**
 * GATE 10.9 - Integrations Settings Component
 * Integrações de plataformas externas (Eduzz, Hotmart)
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Zap,
  ShoppingCart,
  ArrowRight,
  CheckCircle2,
  XCircle
} from 'lucide-react'

interface Integration {
  id: string
  name: string
  description: string
  logo: string // URL or emoji
  status: 'connected' | 'disconnected' | 'coming_soon'
  href: string
  color: string
  bgColor: string
}

export default function IntegrationsSettings() {
  const [integrations] = useState<Integration[]>([
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      description: 'Conecte seu número WhatsApp para envio automático de mensagens.',
      logo: '/integrations/whatsapp-logo.jpg',
      status: 'disconnected',
      href: '/app/settings/integrations/whatsapp',
      color: 'text-green-600',
      bgColor: 'bg-white dark:bg-green-900/20'
    },
    {
      id: 'eduzz',
      name: 'Eduzz',
      description: 'Sincronize vendas, comissões e produtos automaticamente.',
      logo: '/integrations/eduzz-logo.jpg',
      status: 'disconnected',
      href: '/app/settings/integrations/eduzz',
      color: 'text-emerald-600',
      bgColor: 'bg-white dark:bg-emerald-900/20'
    },
    {
      id: 'hotmart',
      name: 'Hotmart',
      description: 'Automatize gestão de vendas e comissões via Hotmart.',
      logo: '/integrations/hotmart-logo.jpg',
      status: 'disconnected',
      href: '/app/settings/integrations/hotmart',
      color: 'text-orange-600',
      bgColor: 'bg-white dark:bg-orange-900/20'
    }
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Integrações</h2>
        <p className="text-muted-foreground">
          Conecte plataformas externas para automatizar seu negócio.
        </p>
      </div>

      {/* Grid de Integrações - Padrão Serviços */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Link key={integration.id} href={integration.href}>
            <Card className="group relative cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 border-l-4 border-l-transparent hover:border-l-primary">
              <CardContent className="p-6">
                {/* Logo e Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`${integration.bgColor} w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden`}>
                    <Image 
                      src={integration.logo} 
                      alt={`${integration.name} logo`}
                      width={integration.id === 'whatsapp' ? 64 : 48}
                      height={integration.id === 'whatsapp' ? 64 : 48}
                      className={integration.id === 'whatsapp' ? 'object-contain scale-125' : 'object-contain'}
                    />
                  </div>
                  <Badge 
                    variant={
                      integration.status === 'connected' ? 'default' : 
                      integration.status === 'coming_soon' ? 'secondary' : 
                      'outline'
                    }
                    className="text-xs"
                  >
                    {integration.status === 'connected' && (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Conectado</>
                    )}
                    {integration.status === 'disconnected' && (
                      <><XCircle className="h-3 w-3 mr-1" /> Desconectado</>
                    )}
                    {integration.status === 'coming_soon' && 'Em Breve'}
                  </Badge>
                </div>

                {/* Título e Descrição */}
                <h3 className="text-lg font-semibold mb-2">{integration.name}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {integration.description}
                </p>

                {/* CTA */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {integration.status === 'connected' ? 'Gerenciar' : 
                     integration.status === 'coming_soon' ? 'Em Breve' : 
                     'Conectar'}
                  </span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Informação Adicional */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              Automatize Seu Negócio
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              Conecte suas plataformas de venda e deixe o sistema sincronizar automaticamente 
              vendas, comissões, produtos e alunos. Configure webhooks para receber eventos em tempo real.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Próximas Integrações */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
          🚀 Próximas Integrações
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {['Kiwify', 'Monetizze', 'Braip', 'PerfectPay', 'Stripe', 'PayPal'].map((platform) => (
            <div 
              key={platform} 
              className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30 opacity-60"
            >
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{platform}</span>
              <Badge variant="secondary" className="ml-auto text-xs">Em Breve</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}