"use client"

// Rota oficial de Onboarding — renderiza o Kanban
import dynamic from "next/dynamic"
import { FeatureGate } from "@/components/FeatureGate"
import { UpgradeBadge } from "@/components/Badges"
import { useEffect, useState } from "react"

const Kanban = dynamic(() => import("../kanban/page"), { ssr: false })

export default function OnboardingKanban() {
  return (
    <div className="container py-8">
      <FeatureGate
        feature="features.onboarding.kanban"
        fallback={
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-4">
            <UpgradeBadge />
            <p className="text-sm text-muted-foreground">Onboarding Kanban — Disponível no plano Enterprise</p>
          </div>
        }
      >
        {/* Inicialização de colunas padrão (idempotente) */}
        <KanbanInit />
        <div className="flex gap-0">
          <SidebarTree />
          <div className="flex-1">
            <Kanban />
          </div>
        </div>
      </FeatureGate>
    </div>
  )
}

function KanbanInit() {
  // dispara init em background
  if (typeof window !== 'undefined') {
    fetch('/api/kanban/board/init', { method: 'POST' }).catch(()=>{})
  }
  return null
}

function SidebarTree() {
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [state, setState] = useState<{ rootCount: number; nodes: Array<{ id: string; title: string; count: number }> }>({ rootCount: 0, nodes: [] })
  const [selected, setSelected] = useState<string | 'org'>('org')
  // plano não utilizado removido
  const [busy, setBusy] = useState(false)

  function reloadTree() {
    setBusy(true)
    fetch('/api/kanban/tree', { cache: 'no-store' })
      .then(r=>r.json())
      .then((j: { root?: { count?: number }, nodes?: Array<{ id: string; title: string; count: number }> }) => {
        const nodes = (j.nodes || []).map((n) => ({ id: n.id, title: n.title, count: n.count }))
        setState({ rootCount: j.root?.count || 0, nodes })
      }).catch(()=>{})
      .finally(()=> setBusy(false))
  }

  useEffect(() => {
    // init collapsed state
    setCollapsed(localStorage.getItem('pg.nav.collapsed') === '1')
    reloadTree()
    const onRefetch = () => reloadTree()
    window.addEventListener('pg:kanban:refetchTree', onRefetch)
    const onToggle = () => {
      const next = !(localStorage.getItem('pg.nav.collapsed') === '1')
      localStorage.setItem('pg.nav.collapsed', next ? '1' : '0')
      setCollapsed(next)
    }
    window.addEventListener('pg:nav:toggle', onToggle)
    return () => window.removeEventListener('pg:kanban:refetchTree', onRefetch)
  }, [])

  function toggle() {
    const next = !collapsed
    localStorage.setItem('pg.nav.collapsed', next ? '1' : '0')
    setCollapsed(next)
  }

  function navigateWithTrainer(trainerId?: string) {
    const url = new URL(location.href)
    if (trainerId) url.searchParams.set('trainerId', trainerId)
    else url.searchParams.delete('trainerId')
    history.replaceState(null, '', url.toString())
  }

  function moveSelection(delta: number) {
    if (busy) return
    const ids = ['org', ...state.nodes.map(n=>n.id)]
    const idx = Math.max(0, ids.indexOf(selected))
    const nextIdx = Math.min(ids.length - 1, Math.max(0, idx + delta))
    setSelected(ids[nextIdx])
  }

  function activateSelection() {
    if (selected === 'org') {
      navigateWithTrainer(undefined)
      window.dispatchEvent(new CustomEvent('pg:kanban:setTrainer', { detail: {} }))
    } else {
      navigateWithTrainer(String(selected))
      window.dispatchEvent(new CustomEvent<{ trainerId?: string }>('pg:kanban:setTrainer', { detail: { trainerId: String(selected) } }))
    }
  }

  return (
    <aside className={`shrink-0 border-r ${collapsed ? 'w-16' : 'w-72'} transition-all`} aria-label="Navegação do Onboarding">
      <div className="p-2">
        <button
          type="button"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-pressed={collapsed}
          onClick={toggle}
          className="mb-3 w-full rounded-md border px-3 py-1 text-sm"
        >
          {collapsed ? '▶' : '◀ Recolher'}
        </button>
        <nav className="text-sm">
          <div className="mb-2 px-1 text-[10px] uppercase text-muted-foreground">{collapsed ? 'Org' : 'Organização'}</div>
          <button
            className={`group flex w-full items-center justify-between rounded border-l-4 px-2 py-1 ${selected==='org'?'bg-accent border-primary':'border-transparent hover:bg-accent/50'}`}
            onClick={()=>{ setSelected('org'); navigateWithTrainer(undefined); window.dispatchEvent(new CustomEvent('pg:kanban:setTrainer', { detail: {} })) }}
            aria-pressed={selected==='org'}
            aria-current={selected==='org' ? 'page' : undefined}
            onKeyDown={(e)=>{
              if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1) }
              if (e.key === 'ArrowUp') { e.preventDefault(); moveSelection(-1) }
              if (e.key === 'Enter') { e.preventDefault(); activateSelection() }
            }}
          >
            <span className="truncate">{collapsed ? 'ORG' : 'Toda a organização'}</span>
            <span className="ml-2 rounded bg-muted px-2 text-xs">{state.rootCount}</span>
          </button>

          <div className="mt-3 mb-2 px-1 text-[10px] uppercase text-muted-foreground">{collapsed ? 'Tr' : 'Treinadores'}</div>
          <div className="space-y-1">
            {busy ? (
              <div className="space-y-1" aria-live="polite" aria-busy="true">
                <div className="h-6 w-full animate-pulse rounded bg-muted" />
                <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            ) : state.nodes.length === 0 ? (
              <button className="flex w-full items-center justify-between rounded border-l-4 border-transparent px-2 py-1 hover:bg-accent/50" onClick={()=>alert('Convide sua equipe para colaborar')}>
                <span className="truncate">{collapsed ? 'CTA' : 'Convidar equipe'}</span>
              </button>
            ) : state.nodes.map(n => (
              <button
                key={n.id}
                className={`group flex w-full items-center justify-between rounded border-l-4 px-2 py-1 ${selected===n.id?'bg-accent border-primary':'border-transparent hover:bg-accent/50'}`}
                onClick={()=>{
                  setSelected(n.id)
                  navigateWithTrainer(n.id)
                  window.dispatchEvent(new CustomEvent<{ trainerId?: string }>('pg:kanban:setTrainer', { detail: { trainerId: n.id } }))
                }}
                aria-pressed={selected===n.id}
                title={n.title}
                aria-current={selected===n.id ? 'page' : undefined}
                onKeyDown={(e)=>{
                  if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1) }
                  if (e.key === 'ArrowUp') { e.preventDefault(); moveSelection(-1) }
                  if (e.key === 'Enter') { e.preventDefault(); activateSelection() }
                }}
              >
                <span className="truncate flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px]">{(n.title||'T').slice(0,1)}</span>
                  {collapsed ? null : n.title}
                </span>
                <span className="ml-2 rounded bg-muted px-2 text-xs">{n.count}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 border-t pt-2">
            <a href="/onboarding/history" className="flex items-center gap-2 rounded px-2 py-1 hover:bg-accent/50">
              <span className="inline-block h-4 w-4">🕘</span>
              {collapsed ? null : <span>Histórico</span>}
            </a>
          </div>
        </nav>
      </div>
    </aside>
  )
}


