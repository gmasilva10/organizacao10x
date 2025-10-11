'use client'

import React from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Filter, X, RefreshCw, Search } from 'lucide-react'
import { ProfessionalsFilters } from '@/hooks/useProfessionalsFilters'
import { Badge } from '@/components/ui/badge'

interface ProfessionalsFilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: ProfessionalsFilters
  onFiltersChange: (filters: Partial<ProfessionalsFilters>) => void
  onClear: () => void
  onApply: () => void
  profiles: Array<{ id: string; name: string }>
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' }
]

export default function ProfessionalsFilterDrawer({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onClear,
  onApply,
  profiles
}: ProfessionalsFilterDrawerProps) {

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search.trim() !== '') count++
    if (filters.status !== 'all') count++
    if (filters.profile !== 'all') count++
    if (filters.dateFrom !== '') count++
    if (filters.dateTo !== '') count++
    return count
  }

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-[480px]">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <DrawerTitle>Filtros</DrawerTitle>
            </div>
            {getActiveFiltersCount() > 0 && (
              <Badge 
                variant="secondary" 
                className="bg-blue-100 text-blue-700" 
                aria-label={`${getActiveFiltersCount()} filtro${getActiveFiltersCount() !== 1 ? 's' : ''} ativo${getActiveFiltersCount() !== 1 ? 's' : ''}`}
              >
                {getActiveFiltersCount()} ativo{getActiveFiltersCount() !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <DrawerDescription>
            Configure filtros para encontrar profissionais específicos
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Seção: Busca */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Busca</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Nome, e-mail ou telefone..."
                value={filters.search}
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>

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

          {/* Seção: Função */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Função</Label>
            <Select
              value={filters.profile}
              onValueChange={(value: string) => onFiltersChange({ profile: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as Funções" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Funções</SelectItem>
                {profiles.map(profile => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seção: Data de Cadastro */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Data de Cadastro (Início)</Label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onFiltersChange({ dateFrom: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Data de Cadastro (Fim)</Label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onFiltersChange({ dateTo: e.target.value })}
            />
          </div>
        </div>

        <DrawerFooter className="flex flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClear}
            className="flex-1"
            aria-label="Limpar todos os filtros"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpar
          </Button>
          <Button
            onClick={() => {
              onApply()
              onOpenChange(false)
            }}
            className="flex-1"
            aria-label="Aplicar filtros selecionados"
          >
            <Filter className="h-4 w-4 mr-2" />
            Aplicar Filtros
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

