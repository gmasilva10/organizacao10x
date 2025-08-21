"use client"

import { useEffect, useRef, useState } from "react"
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core"
import { useToast } from "@/components/ui/toast"

type Card = { id: string; title: string; studentId: string; status?: 'onboarding' | 'active' | 'paused' }
type Column = { id: string; title: string; cards: Card[]; locked?: boolean }

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export default function KanbanPage() {
  const sensors = useSensors(useSensor(PointerSensor))

  const [columns, setColumns] = useState<Column[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<Card[]>([])
  const [boardCollapsed, setBoardCollapsed] = useState(false)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const lastMovedIdRef = useRef<string | null>(null)
  const [trainerScope, setTrainerScope] = useState<string | undefined>(undefined)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)
  const toast = useToast()

  async function loadBoard(trainerId?: string) {
    const url = new URL('/api/kanban/board', location.origin)
    if (trainerId) url.searchParams.set('trainerId', trainerId)
    const res = await fetch(url.toString(), { cache: 'no-store' })
    const data: { columns?: Array<{ id: string; title: string }>; cards?: Array<{ id: string; student_id: string; column_id: string; completed_at?: string | null; student_status?: 'onboarding'|'active'|'paused' }> } = await res.json().catch(()=>({}))
    const rawCols = (data.columns || [])
    const cols: Column[] = rawCols.map((c) => ({
      id: c.id,
      title: c.title,
      cards: [],
      // Colunas fixas travadas por título, independente da posição
      locked: ["Novo Aluno", "Entrega do Treino"].includes(String(c.title))
    }))
    // Identifica a coluna de conclusão por título, não pela última posição
    const doneColId = cols.find(c => String(c.title).toLowerCase().includes('entrega do treino'))?.id
    const mapByCol = new Map<string, Card[]>()
    for (const col of cols) mapByCol.set(col.id, [])
    const historyBuffer: Card[] = []
    for (const k of data.cards || []) {
      const card: Card = { id: k.id, title: k.student_id, studentId: k.student_id, status: k.student_status }
      if (k.completed_at && doneColId) {
        historyBuffer.push(card)
      } else {
        const arr = mapByCol.get(k.column_id)
        if (arr) arr.push(card)
      }
    }
    const next = cols.map(c => ({ ...c, cards: mapByCol.get(c.id) || [] }))
    setColumns(next)
    setHistory(historyBuffer)
  }

  useEffect(() => { loadBoard(trainerScope) }, [trainerScope])

  // Restaurar estado de colapso da navegação (persistência localStorage)
  useEffect(() => {
    try {
      const v = localStorage.getItem('pg.nav.collapsed')
      if (v === '1' || v === 'true') setBoardCollapsed(true)
    } catch {}
  }, [])

  // Debounce 200ms para busca rápida
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.toLowerCase()), 200)
    return () => clearTimeout(t)
  }, [query])

  // Ouve a seleção da árvore
  useEffect(() => {
    function onScope(e: CustomEvent<{ trainerId?: string }>) {
      const id = e.detail?.trainerId
      setTrainerScope(id || undefined)
    }
    window.addEventListener('pg:kanban:setTrainer', onScope as EventListener)
    return () => window.removeEventListener('pg:kanban:setTrainer', onScope as EventListener)
  }, [])

  function addCard() {
    const title = prompt("Nome do aluno")?.trim()
    if (!title || title.length < 2) {
      alert('Nome obrigatório (mín. 2 caracteres).')
      return
    }
    const card: Card = { id: createId("card"), title, studentId: title }
    setColumns((cols) =>
      cols.map((c, idx) => (idx === 0 ? { ...c, cards: [...c.cards, card] } : c))
    )
  }

  function addColumn() {
    const title = prompt("Nome da coluna")?.trim()
    if (!title || title.length < 2) { alert('Título obrigatório (mín. 2 caracteres).'); return }
    fetch('/api/kanban/columns', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title }) })
      .then(r=>{ if(!r.ok) throw new Error(String(r.status)); return r.json() })
      .then(()=> { loadBoard(); window.dispatchEvent(new Event('pg:kanban:refetchTree')) })
      .catch(()=> alert('Falha ao criar coluna'))
  }

  async function reorderColumnsMiddle(newMiddleIds: string[]) {
    await fetch('/api/kanban/columns/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columnIds: newMiddleIds }),
    }).then(r=>{ if(!r.ok) throw new Error(String(r.status)) }).catch(()=>{})
    await loadBoard(trainerScope)
  }

  function moveColumnLeft(id: string) {
    const fixedFirst = columns.find(c=>c.title==='Novo Aluno')?.id
    const fixedLast = columns.find(c=>c.title==='Entrega do Treino')?.id
    const middle = columns.map(c=>c.id).filter(cid=> cid!==fixedFirst && cid!==fixedLast)
    const idx = middle.indexOf(id)
    if (idx <= 0) return
    const next = [...middle]
    ;[next[idx-1], next[idx]] = [next[idx], next[idx-1]]
    reorderColumnsMiddle(next)
  }

  function moveColumnRight(id: string) {
    const fixedFirst = columns.find(c=>c.title==='Novo Aluno')?.id
    const fixedLast = columns.find(c=>c.title==='Entrega do Treino')?.id
    const middle = columns.map(c=>c.id).filter(cid=> cid!==fixedFirst && cid!==fixedLast)
    const idx = middle.indexOf(id)
    if (idx === -1 || idx >= middle.length - 1) return
    const next = [...middle]
    ;[next[idx], next[idx+1]] = [next[idx+1], next[idx]]
    reorderColumnsMiddle(next)
  }

  function renameColumn(id: string) {
    const title = prompt("Novo nome da coluna")?.trim()
    if (!title) return
    fetch(`/api/kanban/columns/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title }) })
      .then(r=>{ if(!r.ok) throw new Error(String(r.status)); return r.json() })
      .then(()=> { loadBoard(); window.dispatchEvent(new Event('pg:kanban:refetchTree')) })
      .catch(()=> alert('Falha ao renomear coluna (colunas fixas não podem ser renomeadas)'))
  }

  function removeColumn(id: string) {
    if (!confirm('Remover esta coluna?')) return
    fetch(`/api/kanban/columns/${id}`, { method:'DELETE' })
      .then(async (r)=>{
        if(!r.ok){
          if (r.status === 422) throw new Error('not_empty')
          throw new Error(String(r.status))
        }
        return r.json()
      })
      .then(()=> { loadBoard(); window.dispatchEvent(new Event('pg:kanban:refetchTree')) })
      .catch((e)=>{
        const msg = String(e?.message||'')
        if (msg === 'not_empty') alert('Não é possível remover: coluna não está vazia.')
        else alert('Falha ao remover coluna (fixas não podem ser removidas)')
      })
  }

  async function handleMoveTelemetry(card: Card, fromId: string, toId: string) {
    const res = await fetch("/api/kanban/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: card.studentId, from: fromId, to: toId }),
      cache: "no-store",
    })
    if (!res.ok) {
      const status = res.status
      const err = new Error(String(status)) as Error & { status?: number }
      err.status = status
      throw err
    }
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setOverColumnId(null)
    setDraggingId(null)
    if (!over || active.id === over.id) return

    const fromCol = columns.find((c) => c.cards.some((k) => k.id === String(active.id)))
    const toCol = columns.find((c) => c.id === String(over.id))
    if (!fromCol || !toCol) return
    const card = fromCol.cards.find((k) => k.id === String(active.id))!

    // Remover do from
    const next = columns.map((c) =>
      c.id === fromCol.id ? { ...c, cards: c.cards.filter((k) => k.id !== card.id) } : c
    )

    // Adicionar no destino
    const after = next.map((c) => (c.id === toCol.id ? { ...c, cards: [...c.cards, card] } : c))

    // Se destino é "Entrega do Treino" (por título) → mandar para histórico
    const doneCol = columns.find(c => String(c.title).toLowerCase().includes('entrega do treino'))
    if (doneCol && toCol.id === doneCol.id) {
      setHistory((h) => [{ ...card }, ...h])
      const cleared = after.map((c) =>
        c.id === toCol.id ? { ...c, cards: c.cards.filter((k) => k.id !== card.id) } : c
      )
      setColumns(cleared)
    } else {
      setColumns(after)
    }

    lastMovedIdRef.current = card.id
    // Optimistic UI + persist; em erro, rollback simples: recarregar board
    handleMoveTelemetry(card, fromCol.id, toCol.id).then(async () => {
      // atualizar ordenação sequencial no destino
      const target = after.find(c => c.id === toCol.id)
      if (target) {
        const cardIds = target.cards.map(c=>c.id)
        await fetch('/api/kanban/reorder', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ columnId: toCol.id, cardIds }) }).catch(()=>{})
      }
      loadBoard(trainerScope)
      // sinalizar árvore para atualizar contadores
      window.dispatchEvent(new Event('pg:kanban:refetchTree'))
    }).catch((err) => {
      // rollback visual: desfaz alteração local e informa usuário
      setColumns(columns)
      const status = err?.status || 'error'
      console.error('[Kanban] move failed', { studentId: card.studentId, from: fromCol.id, to: toCol.id, status })
      if (status === 401) {
        toast.error('Sessão expirada — faça login novamente.')
      } else if (status === 403) {
        toast.error('Sem permissão para mover este card.')
      } else {
        toast.error('Não foi possível salvar a movimentação. Sua tela foi revertida.')
      }
    })
    // Acessibilidade: devolver foco ao card após o movimento
    setTimeout(() => {
      const el = document.getElementById(card.id)
      if (el) (el as HTMLElement).focus()
    }, 0)
  }
  
  function onDragStart(e: { active?: { id?: string | number } }) {
    const { active } = e
    setDraggingId(String(active?.id || ''))
  }

  function onDragOver(e: { over?: { id?: string | number } | null }) {
    const { over } = e
    setOverColumnId(over ? String(over.id) : null)
  }

  return (
    <div className="container py-8" data-alias="onboarding-kanban">
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar aluno"
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
          className="w-72 rounded-md border px-3 py-1 text-sm"
          aria-label="Buscar aluno"
        />
        {query ? <span className="rounded bg-muted px-2 text-xs text-muted-foreground">filtro aplicado</span> : null}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={addColumn} className="rounded-md border px-3 py-1 text-sm">Nova coluna</button>
          <button onClick={addCard} className="rounded-md bg-primary px-3 py-1 text-sm text-white">Novo card</button>
          <a href="/onboarding/history" className="rounded-md border px-3 py-1 text-sm" aria-label="Histórico">Histórico</a>
          <button
            onClick={() => {
              setBoardCollapsed((v) => {
                const next = !v
                try { localStorage.setItem('pg.nav.collapsed', next ? '1' : '0') } catch {}
                window.dispatchEvent(new Event('pg:nav:toggle'))
                return next
              })
            }}
            aria-pressed={boardCollapsed}
            className="rounded-md border px-3 py-1 text-sm"
          >
            {boardCollapsed ? "Expandir" : "Recolher"}
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className="rounded-md border p-4">
          <h2 className="text-lg font-medium">Histórico de Alunos</h2>
          {history.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Sem históricos por enquanto.</p>
          ) : (
            <ul className="mt-3 list-disc pl-6 text-sm">
              {history.map((c) => (
                <li key={c.id}>{c.title}</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <div className="mb-3" />

          <DndContext sensors={sensors} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
            <div className={`flex gap-4 overflow-x-auto overflow-y-hidden ${boardCollapsed ? "opacity-60" : ""}`}>
              {columns.map((col) => (
                <ColumnView
                  key={col.id}
                  column={col}
                  query={query}
                  debouncedQuery={debouncedQuery}
                  onRename={() => !col.locked && renameColumn(col.id)}
                  onRemove={() => !col.locked && removeColumn(col.id)}
                  onMoveLeft={() => !col.locked && moveColumnLeft(col.id)}
                  onMoveRight={() => !col.locked && moveColumnRight(col.id)}
                  droppableId={col.id}
                />
              ))}
              {/* Botão duplicado removido para evitar CTA redundante */}
            </div>
          </DndContext>
        </>
      )}
    </div>
  )
}

function ColumnView({
  column,
  query,
  debouncedQuery,
  onRename,
  onRemove,
  onMoveLeft,
  onMoveRight,
  droppableId,
}: {
  column: Column
  query: string
  debouncedQuery?: string
  onRename: () => void
  onRemove: () => void
  onMoveLeft: () => void
  onMoveRight: () => void
  droppableId: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId })
  return (
    <div ref={setNodeRef} className={`min-w-[280px] flex-1 rounded-md border bg-background p-3 ${isOver ? 'ring-2 ring-primary/40 bg-primary/5' : ''}`} aria-dropeffect={isOver ? 'move' : undefined}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium">{column.title} <span className="ml-1 rounded bg-muted px-1.5 text-[10px] text-muted-foreground">{column.cards.length}</span></h3>
        <div className="relative">
          <details>
            <summary className="cursor-pointer rounded px-2 py-0.5 text-xs hover:bg-muted">⋮</summary>
            <div className="absolute right-0 z-10 mt-1 w-48 rounded border bg-background p-1 shadow">
              <div className="mb-1 flex items-center justify-between gap-1 px-1 py-0.5">
                <button onClick={onMoveLeft} disabled={!!column.locked} aria-disabled={!!column.locked} className="rounded px-2 py-0.5 text-xs disabled:opacity-50">←</button>
                <button onClick={onMoveRight} disabled={!!column.locked} aria-disabled={!!column.locked} className="rounded px-2 py-0.5 text-xs disabled:opacity-50">→</button>
              </div>
              <button onClick={onRename} disabled={!!column.locked} aria-disabled={!!column.locked} className="block w-full rounded px-2 py-1 text-left text-xs disabled:opacity-50">Renomear</button>
              <button onClick={onRemove} disabled={!!column.locked} aria-disabled={!!column.locked} className="block w-full rounded px-2 py-1 text-left text-xs text-red-600 disabled:opacity-50">Remover</button>
            </div>
          </details>
        </div>
      </div>
      <div id={droppableId} className={`space-y-2 ${isOver ? 'outline-dashed outline-2 outline-primary/40 rounded-md p-1' : ''}`}>
        {column.cards.filter(c=>c.title.toLowerCase().includes((debouncedQuery ?? query).toLowerCase())).length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem cards.</p>
        ) : (
          column.cards
            .filter(c=>c.title.toLowerCase().includes((debouncedQuery ?? query).toLowerCase()))
            .map((c) => <DraggableCard key={c.id} card={c} />)
        )}
      </div>
    </div>
  )
}

function DraggableCard({ card }: { card: Card }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id })
  return (
    <div
      id={card.id}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${isDragging ? 'ring-2 ring-primary/60 bg-primary/5' : ''}`}
      tabIndex={0}
      aria-label={`Mover aluno: ${card.title}`}
      title={card.title}
    >
      <div className="flex items-center justify-between">
        <span className="truncate">{card.title}</span>
        <span className={`ml-2 rounded-full px-2 text-[10px] ${card.status==='active'?'bg-green-100 text-green-700':card.status==='paused'?'bg-yellow-100 text-yellow-700':'bg-blue-100 text-blue-700'}`}>{card.status || 'onboarding'}</span>
      </div>
    </div>
  )
}


