"use client"

/**
 * GATE 10.8 - Módulo Financeiro
 * 
 * Submódulos:
 * - Planos: Gerenciamento de planos de serviços
 * - Categoria: Categorias financeiras
 */

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Package, FolderTree, ArrowRight } from "lucide-react"
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

      {/* Submódulos - Cards Compactos com Hover */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <Card 
          className={`group relative cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
            activeTab === 'plans'
              ? 'border-l-4 border-l-primary shadow-md -translate-y-0.5'
              : 'border-l-4 border-l-transparent hover:border-l-primary'
          }`}
          onClick={() => setActiveTab('plans')}
        >
          <CardContent className="p-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
              <Package className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Planos</h3>
            <p className="text-muted-foreground text-xs mb-2 line-clamp-2">Gerencie serviços, planos e opções de preços.</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Acessar</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`group relative cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
            activeTab === 'category'
              ? 'border-l-4 border-l-primary shadow-md -translate-y-0.5'
              : 'border-l-4 border-l-transparent hover:border-l-primary'
          }`}
          onClick={() => setActiveTab('category')}
        >
          <CardContent className="p-3">
            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
              <FolderTree className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Categoria</h3>
            <p className="text-muted-foreground text-xs mb-2 line-clamp-2">Configure categorias financeiras para organização.</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Acessar</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'plans' && <PlansManager />}
        {activeTab === 'category' && <CategoryManager />}
      </div>
    </div>
  )
}
