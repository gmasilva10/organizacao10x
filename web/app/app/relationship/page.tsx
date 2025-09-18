"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Filter, Search, MessageSquare, Clock, CheckCircle, XCircle, Pause, AlertCircle, X, BarChart3, Workflow } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { isFeatureEnabled } from "@/lib/feature-flags"
import { StandardizedCalendar } from "@/components/ui/standardized-calendar"

interface RelationshipTask {
  id: string
  student_id: string
  student_name: string
  template_code: string
  anchor: string
  scheduled_for: string
  status: string
  channel: string
  payload: {
    message: string
    student_name: string
    student_email: string
    student_phone: string
  }
  created_at: string
  sent_at?: string
}

interface FilterChip {
  key: string
  label: string
}

export default function RelationshipPage() {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [chips, setChips] = useState<FilterChip[]>([])
  const [tasks, setTasks] = useState<RelationshipTask[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Filtros
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [periodPreset, setPeriodPreset] = useState<'7d'|'30d'|'custom'>('7d')
  const [periodStart, setPeriodStart] = useState<string>("")
  const [periodEnd, setPeriodEnd] = useState<string>("")
  
  const firstFieldRef = useRef<HTMLInputElement | null>(null)
  const filterButtonRef = useRef<HTMLButtonElement | null>(null)

  // Ao fechar o drawer, devolver foco ao botão "Filtros"
  useEffect(() => {
    if (!filtersOpen && filterButtonRef.current) {
      filterButtonRef.current.focus()
    }
  }, [filtersOpen])

  // Hotkeys: F para filtros; Esc para fechar drawer
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || (e as any).isComposing
      if (isTyping) return
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setFiltersOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setFiltersOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        // Busca já implementada via filteredTasks
        console.log('Buscar por:', searchQuery)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Carregar dados iniciais e filtros salvos
  useEffect(() => {
    loadTasks()
    loadSavedFilters()
  }, [])

  // Quando abrir o drawer, focar primeiro campo para A11y
  useEffect(() => {
    if (filtersOpen) {
      setTimeout(() => firstFieldRef.current?.focus(), 0)
    }
  }, [filtersOpen])

  // Carregar filtros salvos do localStorage
  const loadSavedFilters = useCallback(() => {
    try {
      const saved = localStorage.getItem('relationship-filters')
      if (saved) {
        const filters = JSON.parse(saved)
        setSelectedStatus(filters.status || [])
        setSelectedChannels(filters.channels || [])
        setSelectedTemplates(filters.templates || [])
        setPeriodPreset(filters.periodPreset || '7d')
        setPeriodStart(filters.periodStart || '')
        setPeriodEnd(filters.periodEnd || '')
        
        // Aplicar filtros salvos
        const chips = buildChipsFromFilters(filters)
        setChips(chips)
      }
    } catch (error) {
      console.warn('Erro ao carregar filtros salvos:', error)
    }
  }, [])

  // Salvar filtros no localStorage
  const saveFilters = useCallback((filters: any) => {
    try {
      localStorage.setItem('relationship-filters', JSON.stringify(filters))
    } catch (error) {
      console.warn('Erro ao salvar filtros:', error)
    }
  }, [])

  // Construir chips a partir dos filtros salvos
  const buildChipsFromFilters = useCallback((filters: any): FilterChip[] => {
    const list: FilterChip[] = []
    
    for (const status of filters.status || []) {
      list.push({ key: `status:${status}`, label: `Status: ${getStatusLabel(status)}` })
    }
    
    for (const channel of filters.channels || []) {
      list.push({ key: `channel:${channel}`, label: `Canal: ${getChannelLabel(channel)}` })
    }
    
    for (const template of filters.templates || []) {
      list.push({ key: `template:${template}`, label: `Template: ${template}` })
    }
    
    if (filters.periodPreset === '7d' || filters.periodPreset === '30d') {
      list.push({ 
        key: `period:${filters.periodPreset}`, 
        label: filters.periodPreset === '7d' ? 'Período: 7 dias' : 'Período: 30 dias' 
      })
    } else if (filters.periodPreset === 'custom' && filters.periodStart && filters.periodEnd) {
      list.push({ 
        key: `period:custom`, 
        label: `Período: ${filters.periodStart} → ${filters.periodEnd}` 
      })
    }
    
    return list
  }, [])

  const loadTasks = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/relationship/tasks')
      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const applyFilters = useCallback((next: FilterChip[]) => {
    setChips(next)
    
    // Salvar filtros atuais no localStorage
    const currentFilters = {
      status: selectedStatus,
      channels: selectedChannels,
      templates: selectedTemplates,
      periodPreset,
      periodStart,
      periodEnd
    }
    saveFilters(currentFilters)
    
    // Aplicar filtros aqui (implementação futura)
    loadTasks()
  }, [selectedStatus, selectedChannels, selectedTemplates, periodPreset, periodStart, periodEnd, saveFilters, loadTasks])

  const buildChips = (): FilterChip[] => {
    const list: FilterChip[] = []
    
    for (const status of selectedStatus) {
      list.push({ key: `status:${status}`, label: `Status: ${status}` })
    }
    
    for (const channel of selectedChannels) {
      list.push({ key: `channel:${channel}`, label: `Canal: ${channel}` })
    }
    
    for (const template of selectedTemplates) {
      list.push({ key: `template:${template}`, label: `Template: ${template}` })
    }
    
    if (periodPreset === '7d' || periodPreset === '30d') {
      list.push({ 
        key: `period:${periodPreset}`, 
        label: periodPreset === '7d' ? 'Período: 7 dias' : 'Período: 30 dias' 
      })
    } else if (periodPreset === 'custom' && periodStart && periodEnd) {
      list.push({ 
        key: `period:custom`, 
        label: `Período: ${periodStart} → ${periodEnd}` 
      })
    }
    
    return list
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'due_today': return <Clock className="h-4 w-4 text-blue-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'snoozed': return <Pause className="h-4 w-4 text-orange-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case 'sent': return 'Enviado'
      case 'pending': return 'Pendente'
      case 'due_today': return 'Para Hoje'
      case 'failed': return 'Falhou'
      case 'snoozed': return 'Adiado'
      case 'skipped': return 'Ignorado'
      default: return status
    }
  }, [])

  const getChannelLabel = useCallback((channel: string) => {
    switch (channel) {
      case 'whatsapp': return 'WhatsApp'
      case 'email': return 'E-mail'
      case 'manual': return 'Manual'
      case 'system': return 'Sistema'
      default: return channel
    }
  }, [])

  // Memoizar tarefas filtradas para performance
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks
    
    return tasks.filter(task => 
      task.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.template_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.payload.message.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [tasks, searchQuery])

  return (
    <div className="container py-8">
      {/* Header sticky com título, busca, chips e ações */}
      <div className="sticky top-0 z-30 mb-4 flex flex-wrap items-center gap-3 border-b bg-background/80 px-4 py-3 md:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="text-sm font-medium text-muted-foreground">Relacionamento</div>
        
        {/* Busca simples */}
        <div className="ml-2 flex min-w-0 items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            aria-label="Buscar tarefa" 
            placeholder="Buscar tarefa..." 
            className="w-56" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Chips */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {chips.map(chip => (
            <Badge key={chip.key} variant="secondary" className="cursor-pointer hover:bg-muted">
              {chip.label}
              <X 
                className="ml-1 h-3 w-3" 
                onClick={() => {
                  const next = chips.filter(x => x.key !== chip.key)
                  applyFilters(next)
                }}
              />
            </Badge>
          ))}
        </div>
        
        {/* Ações à direita */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button variant="secondary" className="rounded-full" onClick={() => { /* placeholder processos */ }}>
            <Workflow className="h-4 w-4 mr-2" />
            Processos
          </Button>
          <Button variant="outline" onClick={() => setFiltersOpen(true)} ref={filterButtonRef}>
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <a href="/app/relationship/templates" className="rounded-md border px-3 py-1.5 text-sm">
            Templates
          </a>
        </div>
      </div>

      {/* Tabs compactas Kanban/Calendário/Analytics no padrão de Alunos */}
      <div className="container -mt-2 mb-4 px-4 md:px-6">
        <Tabs defaultValue="kanban">
          <TabsList className="h-9 bg-muted/60">
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
            <TabsTrigger value="analytics" disabled>Analytics</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Analytics (Feature Flag OFF) - visível apenas em DEV/DEBUG */}
      {!isFeatureEnabled('ANALYTICS_ENABLED') && ((process.env.NODE_ENV !== 'production') || (process.env.NEXT_PUBLIC_APP_DEBUG_UI === 'true')) && (
        <div className="mb-6">
          <Card className="border-dashed">
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-medium mb-2">Analytics Desabilitado</h3>
                <p className="text-sm">
                  Analytics está desabilitado por feature flag para melhorias de performance.
                </p>
                <Badge variant="outline" className="mt-2">
                  Feature Flag: OFF
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de tarefas */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 bg-muted rounded-full" />
                      <div>
                        <div className="h-4 w-32 bg-muted rounded mb-2" />
                        <div className="h-3 w-48 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-muted rounded-full" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 w-full bg-muted rounded mb-1" />
                  <div className="h-3 w-3/4 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma tarefa encontrada</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Crie sua primeira mensagem ou ajuste os filtros para ver mais tarefas.
              </p>
              <Button onClick={() => loadTasks()}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Nova Mensagem
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(task.status)}
                    <div>
                      <CardTitle className="text-base">{task.student_name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{getChannelLabel(task.channel)}</span>
                        <span>•</span>
                        <span>{task.template_code}</span>
                        <span>•</span>
                        <span>{format(new Date(task.scheduled_for), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={task.status === 'sent' ? 'default' : 'secondary'}>
                    {getStatusLabel(task.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {task.payload.message}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Drawer de Filtros (igual ao Onboarding) */}
      <Drawer open={filtersOpen} onOpenChange={setFiltersOpen} direction="right">
        <DrawerContent 
          className="ml-auto h-full w-full max-w-md overflow-y-auto" 
          aria-describedby="relationship-filters-desc"
          role="dialog"
          aria-labelledby="relationship-filters-title"
          onKeyDown={(e) => { if (e.key === 'Escape') setFiltersOpen(false) }}
        >
          <DrawerHeader>
            <DrawerTitle id="relationship-filters-title">Filtros</DrawerTitle>
            <p className="sr-only" id="relationship-filters-desc">
              Ajuste e aplique filtros para Status, Canal, Template e Período no Relacionamento.
            </p>
          </DrawerHeader>
          <div className="space-y-4 p-4">
            {/* Status */}
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <div 
                className="mt-2 max-h-36 overflow-auto rounded border p-2"
                role="group"
                aria-labelledby="status-filter"
              >
                {['sent', 'pending', 'due_today', 'failed', 'snoozed', 'skipped'].map(status => (
                  <label key={status} className="flex items-center gap-2 py-1 text-sm">
                    <input 
                      ref={firstFieldRef}
                      type="checkbox" 
                      checked={selectedStatus.includes(status)} 
                      onChange={(e) => {
                        setSelectedStatus(v => 
                          e.target.checked ? [...v, status] : v.filter(x => x !== status)
                        )
                      }}
                      aria-describedby={`status-${status}-label`}
                    />
                    <span id={`status-${status}-label`} className="truncate">{getStatusLabel(status)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Canais */}
            <div>
              <Label htmlFor="channels-filter">Canais</Label>
              <div 
                className="mt-2 max-h-36 overflow-auto rounded border p-2"
                role="group"
                aria-labelledby="channels-filter"
              >
                {['whatsapp', 'email', 'manual', 'system'].map(channel => (
                  <label key={channel} className="flex items-center gap-2 py-1 text-sm">
                    <input 
                      type="checkbox" 
                      checked={selectedChannels.includes(channel)} 
                      onChange={(e) => {
                        setSelectedChannels(v => 
                          e.target.checked ? [...v, channel] : v.filter(x => x !== channel)
                        )
                      }}
                      aria-describedby={`channel-${channel}-label`}
                    />
                    <span id={`channel-${channel}-label`} className="truncate">{getChannelLabel(channel)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Templates */}
            <div>
              <Label htmlFor="templates-filter">Templates</Label>
              <div 
                className="mt-2 max-h-36 overflow-auto rounded border p-2"
                role="group"
                aria-labelledby="templates-filter"
              >
                {['MSG01', 'MSG02', 'MSG03', 'MSG04', 'MSG05', 'MSG06', 'MSG07', 'MSG08', 'MSG09', 'MSG10'].map(template => (
                  <label key={template} className="flex items-center gap-2 py-1 text-sm">
                    <input 
                      type="checkbox" 
                      checked={selectedTemplates.includes(template)} 
                      onChange={(e) => {
                        setSelectedTemplates(v => 
                          e.target.checked ? [...v, template] : v.filter(x => x !== template)
                        )
                      }}
                      aria-describedby={`template-${template}-label`}
                    />
                    <span id={`template-${template}-label`} className="truncate">{template}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Período */}
            <div>
              <Label htmlFor="period-filter">Período</Label>
              <div 
                className="mt-2 flex flex-col gap-2"
                role="radiogroup"
                aria-labelledby="period-filter"
              >
                <div className="flex items-center gap-3 text-sm">
                  <label className="inline-flex items-center gap-1">
                    <input 
                      type="radio" 
                      name="period" 
                      checked={periodPreset === '7d'} 
                      onChange={() => setPeriodPreset('7d')}
                      aria-describedby="period-7d-label"
                    /> 
                    <span id="period-7d-label">Últimos 7 dias</span>
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input 
                      type="radio" 
                      name="period" 
                      checked={periodPreset === '30d'} 
                      onChange={() => setPeriodPreset('30d')}
                      aria-describedby="period-30d-label"
                    /> 
                    <span id="period-30d-label">Últimos 30 dias</span>
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input 
                      type="radio" 
                      name="period" 
                      checked={periodPreset === 'custom'} 
                      onChange={() => setPeriodPreset('custom')}
                      aria-describedby="period-custom-label"
                    /> 
                    <span id="period-custom-label">Custom</span>
                  </label>
                </div>
                {periodPreset === 'custom' && (
                  <div className="flex items-center gap-2">
                    <StandardizedCalendar
                      value={periodStart ? new Date(periodStart) : undefined}
                      onChange={(date) => setPeriodStart(date ? date.toISOString().split('T')[0] : '')}
                      placeholder="Data inicial"
                      className="w-full"
                    />
                    <span className="text-xs text-muted-foreground">→</span>
                    <StandardizedCalendar
                      value={periodEnd ? new Date(periodEnd) : undefined}
                      onChange={(date) => setPeriodEnd(date ? date.toISOString().split('T')[0] : '')}
                      placeholder="Data final"
                      className="w-full"
                    />
                  </div>
                )}
              </div>
        </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedStatus([])
                  setSelectedChannels([])
                  setSelectedTemplates([])
                  setPeriodPreset('7d')
                  setPeriodStart('')
                  setPeriodEnd('')
                  
                  // Limpar localStorage
                  localStorage.removeItem('relationship-filters')
                  
                  applyFilters([])
                }}
              >
                Limpar
              </Button>
              <Button 
                onClick={() => {
                  const next = buildChips()
                  applyFilters(next)
                  setFiltersOpen(false)
                }}
              >
                Aplicar
              </Button>
      </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}


