/**
 * Componente de Filtro Padrão - Drawer da Direita para Esquerda
 * 
 * Baseado no Print 3 - Layout do filtro do anexo/relacionamento
 * Comportamento: Slide-in da direita para esquerda (como Print 2 - onboarding)
 */

'use client'

import React from 'react'
import { Dialog, DialogContent, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filter, X, RefreshCw } from 'lucide-react'

interface FilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: React.ReactNode
  onApply?: () => void
  onClear?: () => void
}

export function FilterDrawer({ 
  open, 
  onOpenChange, 
  title = "Filtros", 
  children, 
  onApply, 
  onClear 
}: FilterDrawerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed right-0 top-0 h-full w-80 max-w-sm transform transition-transform duration-300 ease-in-out data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full border-l">
        <DialogDescription className="sr-only">
          Painel de filtros para {title}
        </DialogDescription>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
            <Button variant="outline" onClick={onClear}>
              Limpar
            </Button>
            <Button onClick={onApply} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Componente específico para filtros de relacionamento
interface RelationshipFiltersProps {
  filters: {
    action: string
    channel: string
    template_code: string
    date_from: string
    date_to: string
    q: string
  }
  onFiltersChange: (filters: any) => void
}

export function RelationshipFilters({ filters, onFiltersChange }: RelationshipFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Ação */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Ação</Label>
        <Select
          value={filters.action}
          onValueChange={(value: string) => onFiltersChange({ ...filters, action: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas as Ações" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Ações</SelectItem>
            <SelectItem value="sent">Enviado</SelectItem>
            <SelectItem value="created">Criado</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="snoozed">Adiado</SelectItem>
            <SelectItem value="skipped">Ignorado</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Canal */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Canal</Label>
        <Select
          value={filters.channel}
          onValueChange={(value: string) => onFiltersChange({ ...filters, channel: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os Canais" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Canais</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="email">E-mail</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="system">Sistema</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Template */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Template</Label>
        <Select
          value={filters.template_code}
          onValueChange={(value: string) => onFiltersChange({ ...filters, template_code: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os Templates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Templates</SelectItem>
            <SelectItem value="MSG01">MSG01 - Boas-vindas</SelectItem>
            <SelectItem value="MSG02">MSG02 - Lembrete de Treino</SelectItem>
            <SelectItem value="MSG03">MSG03 - Acompanhamento</SelectItem>
            <SelectItem value="MSG04">MSG04 - Reagendamento</SelectItem>
            <SelectItem value="MSG05">MSG05 - Parabéns</SelectItem>
            <SelectItem value="MSG06">MSG06 - Lembrete de Pagamento</SelectItem>
            <SelectItem value="MSG07">MSG07 - Oferta Especial</SelectItem>
            <SelectItem value="MSG08">MSG08 - Pesquisa de Satisfação</SelectItem>
            <SelectItem value="MSG09">MSG09 - Acompanhamento Trimestral</SelectItem>
            <SelectItem value="MSG10">MSG10 - Oferecimento de Novos Serviços</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Buscar */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Buscar</Label>
        <Input 
          placeholder="Buscar nos logs..." 
          value={filters.q}
          onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
        />
      </div>

      {/* Data Inicial */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Data Inicial</Label>
        <Input 
          placeholder="dd/mm/aaaa" 
          value={filters.date_from}
          onChange={(e) => onFiltersChange({ ...filters, date_from: e.target.value })}
        />
      </div>

      {/* Data Final */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Data Final</Label>
        <Input 
          placeholder="dd/mm/aaaa" 
          value={filters.date_to}
          onChange={(e) => onFiltersChange({ ...filters, date_to: e.target.value })}
        />
      </div>
    </div>
  )
}
