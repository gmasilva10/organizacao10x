"use client"

import { useEffect, useRef, useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type OccurrencesFiltersDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (filters: {
    from: string
    to: string
    groupId: string
    typeId: string
    status: 'OPEN'|'DONE'|'all'
    hasReminder: 'yes'|'no'|'all'
    remFrom: string
    remTo: string
    reminderStatus: 'PENDING'|'DONE'|'CANCELLED'|'all'
    owners: string[]
    q: string
  }) => void
  onClear: () => void
  initialFilters: {
    from: string
    to: string
    groupId: string
    typeId: string
    status: 'OPEN'|'DONE'|'all'
    hasReminder: 'yes'|'no'|'all'
    remFrom: string
    remTo: string
    reminderStatus: 'PENDING'|'DONE'|'CANCELLED'|'all'
    owners: string[]
    q: string
  }
}

export function OccurrencesFiltersDrawer({ 
  open, 
  onOpenChange, 
  onApply, 
  onClear, 
  initialFilters 
}: OccurrencesFiltersDrawerProps) {
  const [filters, setFilters] = useState(initialFilters)
  const [groups, setGroups] = useState<Array<{id:number; name:string}>>([])
  const [types, setTypes] = useState<Array<{id:number; name:string; group_id:number}>>([])
  const [trainers, setTrainers] = useState<Array<{user_id:string; name:string}>>([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [loadingTypes, setLoadingTypes] = useState(false)
  const [loadingTrainers, setLoadingTrainers] = useState(false)
  const firstFieldRef = useRef<HTMLInputElement | null>(null)

  // Hotkeys: Esc para fechar drawer
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || (e as any).isComposing
      if (isTyping) return
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onOpenChange])

  // Carregar opções quando abrir o drawer
  useEffect(() => {
    if (!open) return
    
    // Foco no primeiro campo
    try { 
      setTimeout(() => firstFieldRef.current?.focus(), 0) 
    } catch {}
    
    // Carregar grupos
    if (groups.length === 0) {
      setLoadingGroups(true)
      fetch('/api/occurrence-groups', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => setGroups(Array.isArray(d?.groups) ? d.groups : (Array.isArray(d) ? d : [])))
        .catch(() => {})
        .finally(() => setLoadingGroups(false))
    }
    
    // Carregar tipos
    if (types.length === 0) {
      setLoadingTypes(true)
      fetch('/api/occurrence-types', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => setTypes(Array.isArray(d?.types) ? d.types : (Array.isArray(d) ? d : [])))
        .catch(() => {})
        .finally(() => setLoadingTypes(false))
    }
    
    // Carregar treinadores
    if (trainers.length === 0) {
      setLoadingTrainers(true)
      fetch('/api/professionals/trainers', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => setTrainers(Array.isArray(d?.trainers) ? d.trainers : []))
        .catch(() => {})
        .finally(() => setLoadingTrainers(false))
    }
  }, [open, groups.length, types.length, trainers.length])

  // Atualizar filtros quando initialFilters mudar
  useEffect(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  function handleApply() {
    onApply(filters)
    onOpenChange(false)
  }

  function handleClear() {
    const clearedFilters = {
      from: '',
      to: '',
      groupId: '',
      typeId: '',
      status: 'OPEN' as const,
      priority: 'all' as const,
      sensitive: 'all' as const,
      hasReminder: 'all' as const,
      remFrom: '',
      remTo: '',
      reminderStatus: 'all' as const,
      owners: [],
      q: ''
    }
    setFilters(clearedFilters)
    onClear()
  }

  function updateFilter(field: string, value: any) {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const filteredTypes = types.filter(t => !filters.groupId || t.group_id === parseInt(filters.groupId))

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="ml-auto h-full w-full max-w-md flex flex-col" aria-describedby="occurrences-filters-desc">
        <DrawerHeader>
          <DrawerTitle>Filtros de Ocorrências</DrawerTitle>
          <p className="sr-only" id="occurrences-filters-desc">
            Ajuste e aplique filtros para período, grupo, tipo, status, prioridade, sensível, lembrete, responsáveis e busca.
          </p>
        </DrawerHeader>
        
        <div className="space-y-4 p-4 overflow-y-auto flex-1">
          {/* Período */}
          <div>
            <Label>Período</Label>
            <div className="mt-2 flex flex-col gap-2">
              <Input
                ref={firstFieldRef}
                type="date"
                value={filters.from}
                onChange={e => updateFilter('from', e.target.value)}
                placeholder="De"
              />
              <Input
                type="date"
                value={filters.to}
                onChange={e => updateFilter('to', e.target.value)}
                placeholder="Até"
              />
            </div>
          </div>

          {/* Grupo */}
          <div>
            <Label>Grupo</Label>
            <Select 
              value={filters.groupId || 'all'} 
              onValueChange={v => {
                updateFilter('groupId', v === 'all' ? '' : v)
                updateFilter('typeId', '') // Reset type when group changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os grupos</SelectItem>
                {loadingGroups ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : groups.map(g => (
                  <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo */}
          <div>
            <Label>Tipo</Label>
            <Select 
              value={filters.typeId || 'all'} 
              onValueChange={v => updateFilter('typeId', v === 'all' ? '' : v)}
              disabled={!filters.groupId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {loadingTypes ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : filteredTypes.map(t => (
                  <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <Select 
              value={filters.status} 
              onValueChange={v => updateFilter('status', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Abertas</SelectItem>
                <SelectItem value="DONE">Encerradas</SelectItem>
                <SelectItem value="all">Todas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prioridade */}
          <div>
            <Label>Prioridade</Label>
            <Select 
              value={filters.priority} 
              onValueChange={v => updateFilter('priority', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sensível */}
          <div>
            <Label>Sensível</Label>
            <Select 
              value={filters.sensitive} 
              onValueChange={v => updateFilter('sensitive', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="yes">Sim</SelectItem>
                <SelectItem value="no">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lembrete */}
          <div>
            <Label>Lembrete</Label>
            <div className="mt-2 space-y-2">
              <Select 
                value={filters.hasReminder} 
                onValueChange={v => updateFilter('hasReminder', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Com lembrete</SelectItem>
                  <SelectItem value="no">Sem lembrete</SelectItem>
                </SelectContent>
              </Select>
              
              {filters.hasReminder === 'yes' && (
                <div className="flex flex-col gap-2">
                  <Input
                    type="datetime-local"
                    value={filters.remFrom}
                    onChange={e => updateFilter('remFrom', e.target.value)}
                    placeholder="Lembrete de"
                  />
                  <Input
                    type="datetime-local"
                    value={filters.remTo}
                    onChange={e => updateFilter('remTo', e.target.value)}
                    placeholder="Lembrete até"
                  />
                  <Select 
                    value={filters.reminderStatus} 
                    onValueChange={v => updateFilter('reminderStatus', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status do lembrete" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="DONE">Concluído</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Responsáveis */}
          <div>
            <Label>Responsáveis</Label>
            <div className="mt-2 max-h-36 overflow-auto rounded border p-2">
              {loadingTrainers ? (
                <div className="text-sm text-muted-foreground">Carregando...</div>
              ) : trainers.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum responsável</div>
              ) : (
                trainers.map(t => (
                  <label key={t.user_id} className="flex items-center gap-2 py-1 text-sm">
                    <input 
                      type="checkbox" 
                      checked={filters.owners.includes(t.user_id)} 
                      onChange={e => {
                        const newOwners = e.target.checked 
                          ? [...filters.owners, t.user_id]
                          : filters.owners.filter(id => id !== t.user_id)
                        updateFilter('owners', newOwners)
                      }} 
                    />
                    <span className="truncate">{t.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Busca rápida */}
          <div>
            <Label>Busca rápida</Label>
            <Input
              value={filters.q}
              onChange={e => updateFilter('q', e.target.value)}
              placeholder="Aluno / #ID / descrição..."
            />
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClear}>
              Limpar
            </Button>
            <Button 
              disabled={loadingGroups || loadingTypes || loadingTrainers} 
              onClick={handleApply}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
