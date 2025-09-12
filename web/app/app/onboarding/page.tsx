"use client"

// Rota oficial de Onboarding — renderiza o Kanban
import { useEffect, useMemo, useRef, useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Import estático temporário para resolver ChunkLoadError
import Kanban from "../kanban/page"

export default function OnboardingKanban() {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [chips, setChips] = useState<Array<{ key: string; label: string }>>([])
  const [trainers, setTrainers] = useState<Array<{ id: string; name: string }>>([])
  const [stages, setStages] = useState<Array<{ id: string; name: string; order: number }>>([])
  const [loadingTrainers, setLoadingTrainers] = useState(false)
  const [loadingStages, setLoadingStages] = useState(false)
  const [selectedTrainerIds, setSelectedTrainerIds] = useState<string[]>([])
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([])
  const [periodPreset, setPeriodPreset] = useState<'7d'|'30d'|'custom'>('7d')
  const [periodStart, setPeriodStart] = useState<string>("")
  const [periodEnd, setPeriodEnd] = useState<string>("")
  const firstFieldRef = useRef<HTMLInputElement | null>(null)
  // hotkeys: F para filtros; Esc para fechar drawer; N é tratado no Kanban
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

  useEffect(() => {
    // restaurar filtros do usuário
    try {
      const raw = localStorage.getItem('pg.kanban.filters')
      if (raw) {
        const arr = JSON.parse(raw) as Array<{ key: string; label: string }>
        if (Array.isArray(arr)) setChips(arr)
      }
      // restaurar seleção aplicada
      const rawState = localStorage.getItem('pg.kanban.filters.state')
      if (rawState) {
        const s = JSON.parse(rawState) as { trainer_id?: string[]; column?: string[]; period?: { start?: string; end?: string; preset?: '7d'|'30d'|'custom' } }
        if (s?.trainer_id) setSelectedTrainerIds(s.trainer_id)
        if (s?.column) setSelectedStageIds(s.column)
        if (s?.period?.preset) setPeriodPreset(s.period.preset)
        if (s?.period?.start) setPeriodStart(s.period.start)
        if (s?.period?.end) setPeriodEnd(s.period.end)
      }
    } catch {}
  }, [])

  function applyFilters(next: Array<{ key: string; label: string }>) {
    setChips(next)
    try { localStorage.setItem('pg.kanban.filters', JSON.stringify(next)) } catch {}
    try {
      const payload: { trainer_id: string[]; column: string[]; period?: { start: string; end: string; preset?: '7d'|'30d'|'custom' } } = {
        trainer_id: selectedTrainerIds,
        column: selectedStageIds,
      }
      // período (presets)
      if (periodPreset === '7d' || periodPreset === '30d') {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - (periodPreset === '7d' ? 7 : 30))
        payload.period = { start: start.toISOString(), end: end.toISOString(), preset: periodPreset }
      } else if (periodPreset === 'custom' && periodStart && periodEnd) {
        payload.period = { start: new Date(periodStart).toISOString(), end: new Date(periodEnd).toISOString(), preset: 'custom' }
      }
      // persistência do estado aplicado
      try { localStorage.setItem('pg.kanban.filters.state', JSON.stringify(payload)) } catch {}
      window.dispatchEvent(new CustomEvent('pg:kanban:applyFilters', { detail: { filters: payload } }))
    } catch {}
  }
  // Carregar opções quando abrir o drawer pela primeira vez
  useEffect(() => {
    if (!filtersOpen) return
    try { setTimeout(() => firstFieldRef.current?.focus(), 0) } catch {}
    if (trainers.length === 0) {
      setLoadingTrainers(true)
      fetch('/api/collaborators?role=trainer&status=active', { cache:'no-store' })
        .then(r=> r.json())
        .then(d=> setTrainers(((d?.items)||[]).map((x:any)=>({ id: x.id || x.user_id || x.collaborator_id || x.email, name: x.full_name || x.email || 'Treinador' }))))
        .catch(()=>{})
        .finally(()=> setLoadingTrainers(false))
    }
    if (stages.length === 0) {
      setLoadingStages(true)
      fetch('/api/kanban/stages', { cache:'no-store' })
        .then(r=> r.json())
        .then(d=> setStages((d?.stages||[]) as any))
        .catch(()=>{})
        .finally(()=> setLoadingStages(false))
    }
  }, [filtersOpen])

  function buildChips(): Array<{ key: string; label: string }> {
    const list: Array<{ key: string; label: string }> = []
    for (const id of selectedTrainerIds) {
      const name = trainers.find(t=>t.id===id)?.name || id
      list.push({ key: `trainer_id:${id}`, label: `Treinador: ${name}` })
    }
    for (const id of selectedStageIds) {
      const name = stages.find(s=>s.id===id)?.name || id
      list.push({ key: `column:${id}`, label: `Coluna: ${name}` })
    }
    if (periodPreset === '7d' || periodPreset === '30d') {
      list.push({ key: `period:${periodPreset}`, label: periodPreset==='7d' ? 'Período: 7 dias' : 'Período: 30 dias' })
    } else if (periodPreset === 'custom' && periodStart && periodEnd) {
      list.push({ key: `period:custom`, label: `Período: ${periodStart} → ${periodEnd}` })
    }
    return list
  }


  return (
    <div className="container py-8">
      {/* Telemetria de view */}
      {typeof window !== 'undefined' && (
        (fetch('/api/telemetry', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ type: 'kanban.board.view' }) }).catch(()=>{})),
        null
      )}

      {/* Header sticky com título, busca, chips e ações */}
      <div className="sticky top-0 z-30 mb-4 flex flex-wrap items-center gap-3 border-b bg-background/80 px-4 py-3 md:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="text-sm font-medium text-muted-foreground">Onboarding / Kanban</div>
        {/* Busca simples: delegada ao Kanban por evento customizado */}
        <div className="ml-2 flex min-w-0 items-center gap-2">
          <Input aria-label="Buscar aluno" placeholder="Buscar aluno" className="w-56" onChange={(e)=>{
            const v = e.target.value
            window.dispatchEvent(new CustomEvent('pg:kanban:search', { detail: { q: v } }))
          }} />
        </div>
        {/* Chips */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {chips.map(c => (
            <button key={c.key} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs hover:bg-muted" onClick={()=> setFiltersOpen(true)}>
              {c.label}
              <span className="text-muted-foreground" onClick={(e)=>{ e.stopPropagation(); const next = chips.filter(x=>x.key!==c.key); applyFilters(next) }}>×</span>
            </button>
          ))}
        </div>
        {/* Ações à direita */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={()=> setFiltersOpen(true)}>Filtros</Button>
          <Button onClick={()=>{ try { window.dispatchEvent(new Event('pg:kanban:newCard')) } catch {} }} className="bg-primary text-white">+ Novo card</Button>
          <Button variant="outline" onClick={()=>{ try { window.dispatchEvent(new Event('pg:kanban:newColumn')) } catch {} }}>+ Nova coluna</Button>
          <a href="/onboarding/history" className="rounded-md border px-3 py-1.5 text-sm">Histórico</a>
        </div>
      </div>

      <Kanban />

      {/* Drawer de Filtros (mínimo viável) */}
      <Drawer open={filtersOpen} onOpenChange={setFiltersOpen} direction="right">
        <DrawerContent className="ml-auto h-full w-full max-w-md overflow-y-auto" aria-describedby="kanban-filters-desc">
          <DrawerHeader>
            <DrawerTitle>Filtros</DrawerTitle>
            <p className="sr-only" id="kanban-filters-desc">Ajuste e aplique filtros para Treinador, Coluna e Período no Kanban.</p>
          </DrawerHeader>
          <div className="space-y-4 p-4">
            <div>
              <Label>Treinadores</Label>
              <div className="mt-2 max-h-36 overflow-auto rounded border p-2">
                {loadingTrainers ? (
                  <div className="text-sm text-muted-foreground">Carregando...</div>
                ) : trainers.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhum treinador</div>
                ) : (
                  trainers.map(t => (
                    <label key={t.id} className="flex items-center gap-2 py-1 text-sm">
                      <input ref={firstFieldRef} type="checkbox" checked={selectedTrainerIds.includes(t.id)} onChange={(e)=>{
                        setSelectedTrainerIds(v=> e.target.checked ? [...v, t.id] : v.filter(x=>x!==t.id))
                      }} />
                      <span className="truncate">{t.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div>
              <Label>Colunas</Label>
              <div className="mt-2 max-h-36 overflow-auto rounded border p-2">
                {loadingStages ? (
                  <div className="text-sm text-muted-foreground">Carregando...</div>
                ) : stages.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhuma coluna</div>
                ) : (
                  stages.map(s => (
                    <label key={s.id} className="flex items-center gap-2 py-1 text-sm">
                      <input type="checkbox" checked={selectedStageIds.includes(s.id)} onChange={(e)=>{
                        setSelectedStageIds(v=> e.target.checked ? [...v, s.id] : v.filter(x=>x!==s.id))
                      }} />
                      <span className="truncate">{s.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div>
              <Label>Período</Label>
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex items-center gap-3 text-sm">
                  <label className="inline-flex items-center gap-1"><input type="radio" name="period" checked={periodPreset==='7d'} onChange={()=> setPeriodPreset('7d')} /> Últimos 7 dias</label>
                  <label className="inline-flex items-center gap-1"><input type="radio" name="period" checked={periodPreset==='30d'} onChange={()=> setPeriodPreset('30d')} /> Últimos 30 dias</label>
                  <label className="inline-flex items-center gap-1"><input type="radio" name="period" checked={periodPreset==='custom'} onChange={()=> setPeriodPreset('custom')} /> Custom</label>
                </div>
                {periodPreset==='custom' && (
                  <div className="flex items-center gap-2">
                    <Input type="date" value={periodStart} onChange={(e)=> setPeriodStart(e.target.value)} />
                    <span className="text-xs text-muted-foreground">→</span>
                    <Input type="date" value={periodEnd} onChange={(e)=> setPeriodEnd(e.target.value)} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={()=>{ 
                setSelectedTrainerIds([]); setSelectedStageIds([]); setPeriodPreset('7d'); setPeriodStart(''); setPeriodEnd(''); 
                applyFilters([]); 
                try { window.dispatchEvent(new CustomEvent('pg:telemetry',{ detail:{ type:'kanban.filters.cleared' } })) } catch {} 
              }}>Limpar</Button>
              <Button disabled={loadingTrainers || loadingStages} onClick={()=>{
                const next = buildChips()
                applyFilters(next)
                try { window.dispatchEvent(new CustomEvent('pg:telemetry',{ detail:{ type:'kanban.filters.applied', payload: next } })) } catch {}
                setFiltersOpen(false)
              }}>Aplicar</Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}



