"use client"

/**
 * GATE 10.7.2 - Página de Relacionamento Simplificada
 * 
 * - Tabs: Kanban | Calendário
 * - Filtros gerenciados internamente pelo Kanban (useRelationshipFilters)
 * - Layout limpo e direto
 */

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import RelationshipKanban from "@/components/relationship/RelationshipKanban"
import RelationshipKanbanSimple from "@/components/relationship/RelationshipKanbanSimple"
import RelationshipCalendar from "@/components/relationship/RelationshipCalendar"

export default function RelationshipPage() {
  const [activeTab, setActiveTab] = useState<'kanban' | 'calendar'>('kanban')

  return (
    <div className="container py-8 px-4 md:px-6">
      {/* Tabs Kanban/Calendário */}
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={(v: 'kanban' | 'calendar') => setActiveTab(v)}>
          <TabsList className="h-10 bg-muted/60">
            <TabsTrigger value="kanban" className="px-6">
              Kanban
            </TabsTrigger>
            <TabsTrigger value="calendar" className="px-6">
              Calendário
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conteúdo por aba */}
      <div>
        {activeTab === 'kanban' && (
          process.env.NEXT_PUBLIC_REL_KANBAN_SIMPLE === '1' ? 
            <RelationshipKanbanSimple /> : 
            <RelationshipKanban />
        )}
        {activeTab === 'calendar' && <RelationshipCalendar />}
      </div>
    </div>
  )
}
