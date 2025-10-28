"use client"

import React, { memo, useMemo } from 'react'
import { FilterDrawer } from '@/components/ui/filter-drawer'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type TrainerOption = { id: string; name: string }

interface StudentsFilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: {
    q: string
    status: string
    trainerId: string
  }
  trainers: TrainerOption[]
  onFiltersChange: (filters: { q: string; status: string; trainerId: string }) => void
  onClear: () => void
  onApply: () => void
}

const StudentsFilterDrawer = memo(function StudentsFilterDrawer({
  open,
  onOpenChange,
  filters,
  trainers,
  onFiltersChange,
  onClear,
  onApply
}: StudentsFilterDrawerProps) {
  
  // Memoizar options pesadas
  const trainerOptions = useMemo(() => {
    return trainers.map(t => ({
      value: t.id,
      label: t.name
    }))
  }, [trainers])

  const handleFiltersChange = (field: keyof typeof filters, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value
    })
  }

  const handleClear = () => {
    onClear()
    onOpenChange(false)
  }

  const handleApply = () => {
    onApply()
    onOpenChange(false)
  }

  return (
    <FilterDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Filtros de Alunos"
      onClear={handleClear}
      onApply={handleApply}
    >
      <div className="space-y-4">
        {/* Busca por Nome */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Buscar por Nome</Label>
          <Input
            placeholder="Digite o nome do aluno..."
            value={filters.q}
            onChange={(e) => handleFiltersChange('q', e.target.value)}
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value: string) => handleFiltersChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="paused">Pausado</SelectItem>
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Treinador */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Treinador</Label>
          <Select
            value={filters.trainerId}
            onValueChange={(value: string) => handleFiltersChange('trainerId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o treinador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Treinadores</SelectItem>
              {trainerOptions.map((trainer) => (
                <SelectItem key={trainer.value} value={trainer.value}>
                  {trainer.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </FilterDrawer>
  )
})

export default StudentsFilterDrawer
