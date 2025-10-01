"use client"

/**
 * GATE 10.9 - Módulo de Configurações
 * 
 * Submódulos:
 * - Organização: Dados da organização, tema, preferências
 * - Integrações: WhatsApp (Z-API), Supabase, webhooks
 */

import { useState } from "react"
import { Building2, Plug } from "lucide-react"
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <button
          onClick={() => setActiveTab('organization')}
          className={`block rounded-lg border p-6 text-left transition-colors ${
            activeTab === 'organization'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card hover:bg-accent'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4" />
            <h3 className="font-semibold">Organização</h3>
          </div>
          <p className="text-sm opacity-80">Dados da empresa, tema e preferências gerais.</p>
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          className={`block rounded-lg border p-6 text-left transition-colors ${
            activeTab === 'integrations'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card hover:bg-accent'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Plug className="h-4 w-4" />
            <h3 className="font-semibold">Integrações</h3>
          </div>
          <p className="text-sm opacity-80">Conecte WhatsApp, Supabase e outras APIs.</p>
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'organization' && <OrganizationSettings />}
        {activeTab === 'integrations' && <IntegrationsSettings />}
      </div>
    </div>
  )
}