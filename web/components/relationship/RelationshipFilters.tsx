/**
 * GATE 10.6.4 - Filtros Avançados para Relacionamento
 * 
 * Funcionalidades:
 * - Filtros reutilizáveis entre Kanban e Calendário
 * - Estado compartilhado
 * - Performance otimizada
 */

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { 
  Filter, 
  Search, 
  X,
  Calendar as CalendarIcon
} from 'lucide-react'

interface FilterState {
  status: string
  anchor: string
  template_code: string
  channel: string
  date_from: string
  date_to: string
  q: string
}

interface RelationshipFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: Partial<FilterState>) => void
  onClearFilters: () => void
  showDateFilters?: boolean
  compact?: boolean
}

const ANCHOR_OPTIONS = [
  { value: 'all', label: 'Todas as Âncoras' },
  { value: 'sale_close', label: 'Fechamento da Venda' },
  { value: 'first_workout', label: 'Primeiro Treino' },
  { value: 'weekly_followup', label: 'Acompanhamento Semanal' },
  { value: 'monthly_review', label: 'Revisão Mensal' },
  { value: 'birthday', label: 'Aniversário' },
  { value: 'renewal_window', label: 'Janela de Renovação' },
  { value: 'occurrence_followup', label: 'Follow-up de Ocorrência' }
]

const CHANNEL_OPTIONS = [
  { value: 'all', label: 'Todos os Canais' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'manual', label: 'Manual' }
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'due_today', label: 'Para Hoje' },
  { value: 'sent', label: 'Enviadas' },
  { value: 'snoozed', label: 'Adiada' },
  { value: 'skipped', label: 'Pulada' }
]

const TEMPLATE_OPTIONS = [
  { value: 'all', label: 'Todos os Templates' },
  { value: 'MSG1', label: 'MSG1 - Logo Após a Venda' },
  { value: 'MSG2', label: 'MSG2 - Dia Anterior ao Primeiro Treino' },
  { value: 'MSG3', label: 'MSG3 - Após o Primeiro Treino' },
  { value: 'MSG4', label: 'MSG4 - Final da Primeira Semana' },
  { value: 'MSG5', label: 'MSG5 - Acompanhamento Semanal' },
  { value: 'MSG6', label: 'MSG6 - Início do Mês Seguinte' },
  { value: 'MSG7', label: 'MSG7 - Acompanhamento Mensal' },
  { value: 'MSG8', label: 'MSG8 - Datas Especiais' },
  { value: 'MSG9', label: 'MSG9 - Acompanhamento Trimestral' },
  { value: 'MSG10', label: 'MSG10 - Oferecimento de Novos Serviços' }
]

export default function RelationshipFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  showDateFilters = true,
  compact = false 
}: RelationshipFiltersProps) {
  // Validação de filtros
  if (!filters) {
    return (
      <Card className={compact ? 'mb-4' : ''}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Carregando filtros...
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== 'q' && value && value !== 'all'
  ) || filters.q.trim() !== ''

  return (
    <div className={compact ? 'mb-4' : ''}>
      <div className={compact ? 'pb-3' : ''}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4" />
            Filtros
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>
      
      <div className={compact ? 'pt-0' : ''}>
        <div className={`grid gap-4 ${compact ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) => onFiltersChange({ status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Âncora */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Âncora</label>
            <Select
              value={filters.anchor}
              onValueChange={(value) => onFiltersChange({ anchor: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANCHOR_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Canal */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Canal</label>
            <Select
              value={filters.channel}
              onValueChange={(value) => onFiltersChange({ channel: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Template</label>
            <Select
              value={filters.template_code}
              onValueChange={(value) => onFiltersChange({ template_code: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros de data (opcional) */}
        {showDateFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Inicial</label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => onFiltersChange({ date_from: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => onFiltersChange({ date_to: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Busca */}
        <div className="space-y-2 mt-4">
          <label className="text-sm font-medium">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por ID ou notas..."
              value={filters.q}
              onChange={(e) => onFiltersChange({ q: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Indicador de filtros ativos */}
        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Filter className="h-4 w-4" />
              <span>Filtros ativos aplicados</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
