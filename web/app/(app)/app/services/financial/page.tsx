"use client"

/**
 * GATE 10.8 - Módulo Financeiro
 * 
 * Submódulos:
 * - Planos: Gerenciamento de planos de serviços
 * - Categoria: Categorias financeiras
 */

import { useState } from "react"
import { Package, FolderTree } from "lucide-react"
import PlansManager from "@/components/services/PlansManager"
import CategoryManager from "@/components/services/CategoryManager"

type TabType = 'plans' | 'category'

export default function FinancialPage() {
  const [activeTab, setActiveTab] = useState<TabType>('plans')

  return (
    <div className="space-y-6 container py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie planos de serviços e categorias financeiras.
        </p>
      </div>

      {/* Submódulos - Grid Compacto */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <button
          onClick={() => setActiveTab('plans')}
          className={`block rounded-lg border p-6 text-left transition-colors ${
            activeTab === 'plans'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card hover:bg-accent'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4" />
            <h3 className="font-semibold">Planos</h3>
          </div>
          <p className="text-sm opacity-80">Gerencie serviços, planos e opções de preços.</p>
        </button>

        <button
          onClick={() => setActiveTab('category')}
          className={`block rounded-lg border p-6 text-left transition-colors ${
            activeTab === 'category'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card hover:bg-accent'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <FolderTree className="h-4 w-4" />
            <h3 className="font-semibold">Categoria</h3>
          </div>
          <p className="text-sm opacity-80">Configure categorias financeiras para organização.</p>
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'plans' && <PlansManager />}
        {activeTab === 'category' && <CategoryManager />}
      </div>
    </div>
  )
}
