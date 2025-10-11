'use client'

import React from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Filter, X, RefreshCw, Search, Calendar as CalendarIcon } from 'lucide-react'
import { OnboardingFilters } from '@/hooks/useOnboardingFilters'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

interface OnboardingFilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: OnboardingFilters
  onFiltersChange: (filters: Partial<OnboardingFilters>) => void
  onClear: () => void
  onApply: () => void
  availableColumns?: string[] // Colunas disponíveis dinamicamente
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'active', label: 'Ativo' },
  { value: 'paused', label: 'Pausado' }
]

const SERVICE_OPTIONS = [
  { value: 'all', label: 'Todos os Serviços' },
  { value: 'personal_training', label: 'Personal Training' },
  { value: 'group_class', label: 'Aula em Grupo' },
  { value: 'nutrition', label: 'Nutrição' },
  { value: 'assessment', label: 'Avaliação' }
]

const RESPONSIBLE_OPTIONS = [
  { value: 'all', label: 'Todos os Responsáveis' },
  { value: 'trainer', label: 'Personal Trainer' },
  { value: 'nutritionist', label: 'Nutricionista' },
  { value: 'coordinator', label: 'Coordenador' }
]

export default function OnboardingFilterDrawer({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onClear,
  onApply,
  availableColumns = []
}: OnboardingFilterDrawerProps) {

  const getActiveFiltersCount = () => {
    return Object.entries(filters).filter(([key, value]) => 
      key !== 'q' && key !== 'visible_columns' && value && value !== 'all' && value !== ''
    ).length + (filters.q.trim() !== '' ? 1 : 0) + (filters.visible_columns.length > 0 ? 1 : 0)
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
              <DrawerTitle>Filtros de Onboarding</DrawerTitle>
            </div>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700" aria-label={`${getActiveFiltersCount()} filtro${getActiveFiltersCount() !== 1 ? 's' : ''} ativo${getActiveFiltersCount() !== 1 ? 's' : ''}`}>
                {getActiveFiltersCount()} ativo{getActiveFiltersCount() !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <DrawerDescription>
            Configure filtros para encontrar alunos específicos no onboarding
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Seção: Colunas Visíveis */}
          {availableColumns.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Colunas Visíveis</Label>
              <div className="space-y-2">
                {availableColumns.map(column => (
                  <div key={column} className="flex items-center space-x-2">
                    <Checkbox
                      id={`column-${column}`}
                      checked={filters.visible_columns?.includes(column) || false}
                      onCheckedChange={() => handleColumnToggle(column)}
                    />
                    <Label
                      htmlFor={`column-${column}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {column}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seção: Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value: string) => onFiltersChange({ status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os Status" />
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

          {/* Seção: Serviço */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Serviço</Label>
            <Select
              value={filters.service}
              onValueChange={(value: string) => onFiltersChange({ service: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os Serviços" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seção: Responsável */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Responsável</Label>
            <Select
              value={filters.responsible}
              onValueChange={(value: string) => onFiltersChange({ responsible: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os Responsáveis" />
              </SelectTrigger>
              <SelectContent>
                {RESPONSIBLE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
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
                placeholder="Buscar por nome, ID ou notas..."
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
