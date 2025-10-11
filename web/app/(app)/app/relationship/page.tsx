"use client"

/**
 * GATE 10.7.2 - Página de Relacionamento Padronizada
 * 
 * - Cards Compactos: Kanban | Calendário
 * - Filtros gerenciados internamente pelo Kanban (useRelationshipFilters)
 * - Layout padronizado seguindo padrão Cards Compactos
 */

import { useState } from "react"
import { Calendar, ArrowRight, LayoutGrid } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import RelationshipKanban from "@/components/relationship/RelationshipKanban"
import RelationshipCalendar from "@/components/relationship/RelationshipCalendar"

export default function RelationshipPage() {
  const [activeTab, setActiveTab] = useState<'kanban' | 'calendar'>('kanban')

  return (
    <div className="space-y-6 container py-6">
      {/* Header com título e descrição */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relacionamento</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie tarefas e comunicações com seus alunos.
        </p>
      </div>

      {/* Grid de Cards Compactos */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card 
          className={`group relative cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
            activeTab === 'kanban'
              ? 'border-l-4 border-l-primary shadow-md -translate-y-0.5'
              : 'border-l-4 border-l-transparent hover:border-l-primary'
          }`}
          onClick={() => setActiveTab('kanban')}
          aria-pressed={activeTab === 'kanban'}
          aria-label="Acessar Kanban"
        >
          <CardContent className="p-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Kanban</h3>
            <p className="text-muted-foreground text-xs mb-2 line-clamp-2">Visualize e gerencie tarefas de relacionamento.</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Acessar</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`group relative cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
            activeTab === 'calendar'
              ? 'border-l-4 border-l-primary shadow-md -translate-y-0.5'
              : 'border-l-4 border-l-transparent hover:border-l-primary'
          }`}
          onClick={() => setActiveTab('calendar')}
          aria-pressed={activeTab === 'calendar'}
          aria-label="Acessar Calendário"
        >
          <CardContent className="p-3">
            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
              <Calendar className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Calendário</h3>
            <p className="text-muted-foreground text-xs mb-2 line-clamp-2">Visualize tarefas organizadas por data.</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Acessar</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo da aba ativa */}
      <div className="space-y-6">
        {activeTab === 'kanban' && <RelationshipKanban />}
        {activeTab === 'calendar' && <RelationshipCalendar />}
      </div>
    </div>
  )
}
