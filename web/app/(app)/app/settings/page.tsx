"use client"

/**
 * GATE 10.9 - Módulo de Configurações
 * 
 * Submódulos:
 * - Organização: Dados da organização, tema, preferências
 * - Integrações: WhatsApp (Z-API), Supabase, webhooks
 */

import { useState } from "react"
import { Building2, Plug, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import OrganizationSettings from "@/components/settings/OrganizationSettings"
import IntegrationsSettings from "@/components/settings/IntegrationsSettings"

type TabType = 'organization' | 'integrations'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('integrations')

  return (
    <div className="space-y-6 container py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie sua organização e integrações externas.
        </p>
      </div>

      {/* Submódulos - Grid 2 colunas */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card 
          className={`group relative cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
            activeTab === 'organization'
              ? 'border-l-4 border-l-primary shadow-md -translate-y-0.5'
              : 'border-l-4 border-l-transparent hover:border-l-primary'
          }`}
          onClick={() => setActiveTab('organization')}
          aria-pressed={activeTab === 'organization'}
          aria-label="Acessar Organização"
        >
          <CardContent className="p-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
              <Building2 className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Organização</h3>
            <p className="text-muted-foreground text-xs mb-2 line-clamp-2">Dados da empresa, tema e preferências gerais.</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Acessar</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`group relative cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
            activeTab === 'integrations'
              ? 'border-l-4 border-l-primary shadow-md -translate-y-0.5'
              : 'border-l-4 border-l-transparent hover:border-l-primary'
          }`}
          onClick={() => setActiveTab('integrations')}
          aria-pressed={activeTab === 'integrations'}
          aria-label="Acessar Integrações"
        >
          <CardContent className="p-3">
            <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
              <Plug className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Integrações</h3>
            <p className="text-muted-foreground text-xs mb-2 line-clamp-2">Conecte WhatsApp, Supabase e outras APIs.</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Acessar</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'organization' && <OrganizationSettings />}
        {activeTab === 'integrations' && <IntegrationsSettings />}
      </div>
    </div>
  )
}