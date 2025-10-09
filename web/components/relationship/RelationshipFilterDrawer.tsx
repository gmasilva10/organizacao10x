/**
 * GATE 10.7.3 - Drawer de Filtros Avançados para Relacionamento
 * 
 * Funcionalidades:
 * - Drawer lateral (direita→esquerda) seguindo Padrão_Filtros.md
 * - Filtros avançados: Âncora, Template, Canal, Busca, Datas
 * - Integração com useRelationshipFilters
 * - Design premium com animações suaves
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerDescription } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Filter, 
  X, 
  Calendar,
  Search,
  RefreshCw
} from 'lucide-react'
import { RelationshipFilters } from '@/hooks/useRelationshipFilters'

// Mapeamento de âncoras para exibição
const ANCHOR_LABELS = {
  'sale_close': 'Pós-venda',
  'onboarding': 'Onboarding',
  'manual': 'Manual',
  'recurrent': 'Recorrente',
  'birthday': 'Aniversário',
  'anniversary': 'Aniversário de Cliente',
  'churn_prevention': 'Prevenção de Churn',
  'reactivation': 'Reativação',
  'feedback': 'Feedback',
  'promotion': 'Promoção',
  'event': 'Evento',
  'other': 'Outro'
}

interface Template {
  id: string
  code: string
  title: string
  active: boolean
}

interface RelationshipFilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: RelationshipFilters
  onFiltersChange: (filters: Partial<RelationshipFilters>) => void
  onClear: () => void
  onApply: () => void
}

export default function RelationshipFilterDrawer({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onClear,
  onApply
}: RelationshipFilterDrawerProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // Carregar templates quando drawer abrir
  useEffect(() => {
    if (open && templates.length === 0) {
      loadTemplates()
    }
  }, [open, templates.length])

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true)
      const response = await fetch('/api/relationship/templates')
      const data = await response.json()
      setTemplates(data.items || [])
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  // Contar filtros ativos
  const getActiveFiltersCount = () => {
    return Object.entries(filters).filter(([key, value]) => 
      key !== 'q' && value && value !== 'all' && value !== ''
    ).length + (filters.q.trim() !== '' ? 1 : 0)
  }

  const handleApplyAndClose = () => {
    onApply()
    onOpenChange(false)
  }

  const handleClearAndClose = () => {
    onClear()
    onOpenChange(false)
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
          {/* Seção: Âncora */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Âncora</Label>
            <Select 
              value={filters.anchor} 
              onValueChange={(value: string) => onFiltersChange({ anchor: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as âncoras" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as âncoras</SelectItem>
                {Object.entries(ANCHOR_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
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
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os templates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os templates</SelectItem>
                {loadingTemplates ? (
                  <SelectItem value="" disabled>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Carregando...
                    </div>
                  </SelectItem>
                ) : (
                  templates.map((template) => (
                    <SelectItem key={template.code} value={template.code}>
                      {template.title}
                    </SelectItem>
                  ))
                )}
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
                <SelectValue placeholder="Todos os canais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os canais</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seção: Busca */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por ID, notas ou conteúdo..."
                value={filters.q}
                onChange={(e) => onFiltersChange({ q: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          {/* Seção: Data de Criação */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data de Criação
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Data Inicial</Label>
                <Input
                  type="date"
                  value={filters.created_from}
                  onChange={(e) => onFiltersChange({ created_from: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Data Final</Label>
                <Input
                  type="date"
                  value={filters.created_to}
                  onChange={(e) => onFiltersChange({ created_to: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Seção: Data de Agendamento */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data de Agendamento
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Data Inicial</Label>
                <Input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => onFiltersChange({ date_from: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Data Final</Label>
                <Input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => onFiltersChange({ date_to: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Indicador de filtros ativos */}
          {getActiveFiltersCount() > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Filter className="h-4 w-4" />
                <span>{getActiveFiltersCount()} filtro{getActiveFiltersCount() !== 1 ? 's' : ''} ativo{getActiveFiltersCount() !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="border-t bg-gray-50">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClearAndClose}>
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
            <Button onClick={handleApplyAndClose} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Aplicar Filtros
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
