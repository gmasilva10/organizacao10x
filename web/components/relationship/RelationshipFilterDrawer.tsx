'use client'

import React from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Filter, X, RefreshCw, Search, Calendar as CalendarIcon, Eye, EyeOff } from 'lucide-react'
import { RelationshipFilters, RelationshipFiltersUI } from '@/hooks/useRelationshipFilters'
import { useTemplates } from '@/hooks/useTemplates'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

interface RelationshipFilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: RelationshipFiltersUI // Filtros formatados para UI
  onFiltersChange: (filters: Partial<RelationshipFiltersUI>) => void // Função para UI
  onClear: () => void
  onApply: () => void
}

const ANCHOR_OPTIONS = [
  { value: 'all', label: 'Todas as Âncoras' },
  { value: 'sale_close', label: 'Pós-venda' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'manual', label: 'Manual' },
  { value: 'recurrent', label: 'Recorrente' },
  { value: 'birthday', label: 'Aniversário' },
  { value: 'anniversary', label: 'Aniversário de Cliente' },
  { value: 'churn_prevention', label: 'Prevenção de Churn' },
  { value: 'reactivation', label: 'Reativação' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'promotion', label: 'Promoção' },
  { value: 'event', label: 'Evento' },
  { value: 'other', label: 'Outro' }
]

const CHANNEL_OPTIONS = [
  { value: 'all', label: 'Todos os Canais' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'manual', label: 'Manual' }
]

// Templates serão carregados dinamicamente via useTemplates hook

const COLUMN_OPTIONS = [
  { value: 'overdue', label: 'Atrasadas', icon: '🔴' },
  { value: 'due_today', label: 'Para Hoje', icon: '🔵' },
  { value: 'pending_future', label: 'Pendentes de Envio', icon: '🟡' },
  { value: 'sent', label: 'Enviadas', icon: '🟢' },
  { value: 'postponed_skipped', label: 'Adiadas/Puladas', icon: '⚪' }
]

export default function RelationshipFilterDrawer({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onClear,
  onApply
}: RelationshipFilterDrawerProps) {
  // Carregar templates dinamicamente
  const { templates, loading: templatesLoading, error: templatesError } = useTemplates()

  // Gerar opções de templates dinamicamente
  const templateOptions = [
    { value: 'all', label: 'Todos os Templates' },
    ...templates.map(template => ({
      value: template.code,
      label: `${template.code} - ${template.title}`
    }))
  ]

  const getActiveFiltersCount = () => {
    return Object.entries(filters).filter(([key, value]) => 
      key !== 'q' && key !== 'visible_columns' && value && value !== 'all' && value !== ''
    ).length + (filters.q.trim() !== '' ? 1 : 0) + (
      JSON.stringify(filters.visible_columns.sort()) !== JSON.stringify(['overdue', 'due_today', 'pending_future', 'sent', 'postponed_skipped'].sort()) ? 1 : 0
    )
  }

  const handleColumnToggle = (columnValue: string) => {
    const currentColumns = filters.visible_columns || []
    const newColumns = currentColumns.includes(columnValue)
      ? currentColumns.filter(col => col !== columnValue)
      : [...currentColumns, columnValue]
    
    onFiltersChange({ visible_columns: newColumns })
  }

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-[480px]">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <DrawerTitle>Filtros Avançados</DrawerTitle>
            </div>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700" aria-label={`${getActiveFiltersCount()} filtro${getActiveFiltersCount() !== 1 ? 's' : ''} ativo${getActiveFiltersCount() !== 1 ? 's' : ''}`}>
                {getActiveFiltersCount()} ativo{getActiveFiltersCount() !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <DrawerDescription>
            Configure filtros avançados para encontrar tarefas específicas
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Seção: Colunas Visíveis */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Colunas Visíveis</Label>
            <div className="space-y-2">
              {COLUMN_OPTIONS.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`column-${option.value}`}
                    checked={filters.visible_columns?.includes(option.value) || false}
                    onCheckedChange={() => handleColumnToggle(option.value)}
                  />
                  <Label
                    htmlFor={`column-${option.value}`}
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Seção: Âncora */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Âncora</Label>
            <Select
              value={filters.anchor}
              onValueChange={(value: string) => onFiltersChange({ anchor: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as Âncoras" />
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

          {/* Seção: Canal */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Canal</Label>
            <Select
              value={filters.channel}
              onValueChange={(value: string) => onFiltersChange({ channel: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os Canais" />
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

          {/* Seção: Template */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Template</Label>
            <Select
              value={filters.template_code}
              onValueChange={(value: string) => onFiltersChange({ template_code: value })}
              disabled={templatesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  templatesLoading 
                    ? "Carregando templates..." 
                    : templatesError 
                      ? "Erro ao carregar templates" 
                      : "Todos os Templates"
                } />
              </SelectTrigger>
              <SelectContent>
                {templatesLoading ? (
                  <SelectItem value="loading" disabled>
                    Carregando templates...
                  </SelectItem>
                ) : templatesError ? (
                  <SelectItem value="error" disabled>
                    Erro ao carregar templates
                  </SelectItem>
                ) : (
                  templateOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Seção: Data de Criação */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Data de Criação (Início)</Label>
            <Input
              type="date"
              value={filters.created_from}
              onChange={(e) => onFiltersChange({ created_from: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Data de Criação (Fim)</Label>
            <Input
              type="date"
              value={filters.created_to}
              onChange={(e) => onFiltersChange({ created_to: e.target.value })}
            />
          </div>

          {/* Seção: Data de Agendamento */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Data de Agendamento (Início)</Label>
            <Input
              type="date"
              value={filters.date_from}
              onChange={(e) => onFiltersChange({ date_from: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Data de Agendamento (Fim)</Label>
            <Input
              type="date"
              value={filters.date_to}
              onChange={(e) => onFiltersChange({ date_to: e.target.value })}
            />
          </div>

          {/* Seção: Busca */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por ID, nome do aluno ou notas..."
                value={filters.q}
                onChange={(e) => onFiltersChange({ q: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <DrawerFooter className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClear}>
            <X className="mr-2 h-4 w-4" />
            Limpar
          </Button>
          <Button onClick={onApply} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Aplicar Filtros
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}