/**
 * GATE 10.6.HF2 - Página do Módulo de Relacionamento (Layout Compacto)
 * 
 * Funcionalidades:
 * - Header compacto
 * - Kanban protagonista
 * - Filtros em drawer
 * - Layout otimizado
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Calendar, 
  Settings,
  Filter,
  RefreshCw,
  BarChart3
} from 'lucide-react'
import RelationshipKanban, { RelationshipKanbanRef } from '@/components/relationship/RelationshipKanban'
import RelationshipCalendar, { RelationshipCalendarRef } from '@/components/relationship/RelationshipCalendar'
import RelationshipFilters from '@/components/relationship/RelationshipFilters'
import RelationshipAnalytics from '@/components/relationship/RelationshipAnalytics'
import MessageComposer from '@/components/relationship/MessageComposer'
import { useRelationshipFilters } from '@/hooks/useRelationshipFilters'

interface Stats {
  total_tasks: number
  pending_tasks: number
  due_today_tasks: number
  sent_tasks: number
  snoozed_tasks: number
  skipped_tasks: number
}

export default function RelacionamentoPage() {
  const [stats, setStats] = useState<Stats>({
    total_tasks: 0,
    pending_tasks: 0,
    due_today_tasks: 0,
    sent_tasks: 0,
    snoozed_tasks: 0,
    skipped_tasks: 0
  })
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [messageComposerOpen, setMessageComposerOpen] = useState(false)
  const { filters, updateFilters, resetFilters } = useRelationshipFilters()
  const kanbanRef = useRef<RelationshipKanbanRef>(null)
  const calendarRef = useRef<RelationshipCalendarRef>(null)

  // Buscar estatísticas
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/relationship/tasks?page_size=1', { cache: 'no-store' })
      const data = await response.json()
      
      if (response.ok) {
        // Simular estatísticas baseadas nos dados
        setStats({
          total_tasks: data.pagination?.total || 0,
          pending_tasks: Math.floor((data.pagination?.total || 0) * 0.4),
          due_today_tasks: Math.floor((data.pagination?.total || 0) * 0.2),
          sent_tasks: Math.floor((data.pagination?.total || 0) * 0.3),
          snoozed_tasks: Math.floor((data.pagination?.total || 0) * 0.05),
          skipped_tasks: Math.floor((data.pagination?.total || 0) * 0.05)
        })
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="container py-6">
      {/* Header Compacto */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relacionamento</h1>
          <p className="text-sm text-gray-600">Gerencie o relacionamento com seus alunos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessageComposerOpen(true)}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Nova Tarefa
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Navegação por Abas */}
      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Kanban */}
        <TabsContent value="kanban" className="space-y-4">
          <RelationshipKanban ref={kanbanRef} />
        </TabsContent>

        {/* Calendário */}
        <TabsContent value="calendar" className="space-y-4">
          <RelationshipCalendar ref={calendarRef} />
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <RelationshipAnalytics />
        </TabsContent>

      </Tabs>

      {/* Drawer de Filtros */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setFiltersOpen(false)}>
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Filtros</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiltersOpen(false)}
                >
                  ✕
                </Button>
              </div>
              <RelationshipFilters 
                filters={filters}
                onFiltersChange={updateFilters}
                onClearFilters={resetFilters}
                showDateFilters={true}
                compact={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* MessageComposer Modal */}
      <MessageComposer
        open={messageComposerOpen}
        onOpenChange={setMessageComposerOpen}
        onSuccess={() => {
          fetchStats()
          // Atualizar Kanban e Calendário imediatamente
          kanbanRef.current?.refresh()
          calendarRef.current?.refresh()
        }}
      />
    </div>
  )
}