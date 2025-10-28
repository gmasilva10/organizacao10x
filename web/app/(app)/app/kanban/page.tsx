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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { KanbanLogDrawer } from '@/components/KanbanLogDrawer'
import { KanbanChecklist } from '@/components/KanbanChecklist'
import { KanbanCardEditor } from '@/components/KanbanCardEditor'
import { Clock, X } from 'lucide-react'

type Card = { id: string; title: string; studentId: string; status?: 'onboarding' | 'active' | 'paused' }
type Column = { id: string; title: string; cards: Card[]; locked?: boolean; blocked?: boolean; stageCode?: string }

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export default function KanbanPage() {
  // Exige um pequeno movimento antes de iniciar drag para evitar cliques no menu virarem drag
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const [columns, setColumns] = useState<Column[]>([])
  const [loadingBoard, setLoadingBoard] = useState<boolean>(true)
  const [showHistory] = useState(false)
  const [history, setHistory] = useState<Card[]>([])
  const [boardCollapsed, setBoardCollapsed] = useState(false)
  const [openEditorId, setOpenEditorId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const lastMovedIdRef = useRef<string | null>(null)
  const [trainerScope, setTrainerScope] = useState<string | undefined>(undefined)
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  // estados de arraste n £o usados removidos para atender regras de lint
  const toast = useToast()
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; description?: string; onConfirm?: () => void }>({ open: false, title: '' })
  const [edit, setEdit] = useState<{ open: boolean; id: string | null; name: string; order: number; loading: boolean }>({ open: false, id: null, name: "", order: 2, loading: false })
  const [logsDrawer, setLogsDrawer] = useState<{ open: boolean; cardId: string; cardTitle: string }>({ open: false, cardId: '', cardTitle: '' })
  
  // Estado para armazenar o progresso das tarefas de cada card
  const [cardProgress, setCardProgress] = useState<Record<string, { completed: number; total: number }>>({})
  
  // Debug do estado edit
  useEffect(() => {
    console.log('ðŸ” Estado edit mudou:', edit)
  }, [edit])
  const [busy, setBusy] = useState<boolean>(false)
  const draggingColRef = useRef<string | null>(null)
  // hotkeys: N para novo card; Esc para fechar dialog local
  useEffect(() => {
    function onKey(e: KeyboardEvent){
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || (e as any).isComposing
      if (isTyping) return
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        addCard()
      } else if (e.key === 'Escape') {
        if (confirm.open) setConfirm({ open:false, title:'' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirm.open])

  // Listener para invalidar cache quando templates s £o alterados
  useEffect(() => {
    function handleCacheInvalidation(event: CustomEvent) {
      console.log('ðŸ”„ Cache invalidation event received:', event.detail)
      
      // Recarregar board para sincronizar com mudan  as nos templates
      loadBoard(trainerScope)
      
      // Recarregar progresso de todos os cards
      if (columns.length > 0) {
        columns.forEach(column => {
          column.cards.forEach(card => {
            loadCardProgress(card.id)
          })
        })
      }
    }

    window.addEventListener('kanban:invalidateCache', handleCacheInvalidation as EventListener)
    return () => window.removeEventListener('kanban:invalidateCache', handleCacheInvalidation as EventListener)
  }, [trainerScope, columns])

  async function loadBoard(trainerId?: string) {
    setLoadingBoard(true)
    const url = new URL('/api/kanban/board', location.origin)
    if (trainerId) url.searchParams.set('trainerId', trainerId)
    const res = await fetch(url.toString(), { cache: 'no-store' })
    const data: { columns?: Array<{ id: string; title: string }>; cards?: Array<{ id: string; student_id: string; column_id: string; completed_at?: string | null; student_status?: 'onboarding'|'active'|'paused'; student_phone?: string }> } = await res.json().catch(()=>({}))
    // N £o deduplicar por t ­tulo; cada coluna    distinta por id
    const cols: Column[] = (data.columns || []).map((c) => ({
      id: c.id,
      title: c.title,
      cards: [],
      // Colunas fixas travadas por t ­tulo, independente da posi   £o
      locked: (c as any).is_fixed === true || ["Novo Aluno", "Entrega do Treino"].includes(String(c.title)),
      stageCode: (c as any).stage_code
    }))
    // Identifica a coluna de conclus £o por t ­tulo, n £o pela   ltima posi   £o
    const doneColId = cols.find(c => String(c.title).toLowerCase().includes('entrega do treino'))?.id
    const mapByCol = new Map<string, Card[]>()
    for (const col of cols) mapByCol.set(col.id, [])
    const historyBuffer: Card[] = []
    for (const k of data.cards || []) {
      const title = (k as any).student_name || k.student_id
      const card: Card = { 
        id: k.id, 
        title, 
        studentId: k.student_id, 
        status: k.student_status
      }
      if (k.completed_at && doneColId) {
        historyBuffer.push(card)
      } else {
        const arr = mapByCol.get(k.column_id)
        if (arr) arr.push(card)
      }
    }
    for (const col of cols) {
      col.cards = mapByCol.get(col.id) || []
    }
    setColumns(cols)
    setHistory(historyBuffer)
    setLoadingBoard(false)
    
    // Carregar progresso das tarefas para todos os cards
    console.log(`ðŸ”„ Carregando progresso para ${data.cards?.length || 0} cards`)
    for (const card of data.cards || []) {
      console.log(`ðŸ  Processando card: ${card.id} (${(card as any).student_name || card.student_id})`)
      await loadCardProgress(card.id)
    }
    console.log(' œ  Progresso de todos os cards carregado')
  }

  // Fun   £o para carregar o progresso das tarefas de um card
  async function loadCardProgress(cardId: string) {
    try {
      console.log(`ðŸ” Carregando progresso para card: ${cardId}`)
      const response = await fetch(`/api/kanban/items/${cardId}/tasks`)
      if (response.ok) {
        const data = await response.json()
        console.log(`ðŸ Š Dados recebidos para card ${cardId}:`, data)
        
        // Verificar se data.tasks existe e    um array
        const tasks = data.tasks || data || []
        console.log(`ðŸ   Tasks para card ${cardId}:`, tasks)
        
        if (Array.isArray(tasks)) {
          // Contar todas as tarefas (obrigat ³rias + opcionais)
          const completed = tasks.filter((task: any) => task.status === 'completed').length
          const total = tasks.length
          console.log(` œ  Progresso calculado para card ${cardId}: ${completed}/${total} (todas as tarefas)`)
          setCardProgress((prev: Record<string, { completed: number; total: number }>) => ({
            ...prev,
            [cardId]: { completed, total }
          }))
        } else {
          console.warn(` š  ¸ Tasks n £o    um array para card ${cardId}:`, tasks)
          setCardProgress((prev: Record<string, { completed: number; total: number }>) => ({
            ...prev,
            [cardId]: { completed: 0, total: 0 }
          }))
        }
      } else {
        console.warn(` š  ¸ Response n £o OK para card ${cardId}:`, response.status)
        setCardProgress((prev: Record<string, { completed: number; total: number }>) => ({
          ...prev,
          [cardId]: { completed: 0, total: 0 }
        }))
      }
    } catch (error) {
      console.error(` Œ Erro ao carregar progresso do card ${cardId}:`, error)
      // Em caso de erro, definir progresso como 0/0
      setCardProgress((prev: Record<string, { completed: number; total: number }>) => ({
        ...prev,
        [cardId]: { completed: 0, total: 0 }
      }))
    }
  }

  // Fun   £o para atualizar o progresso de um card ap ³s toggle de tarefa
  function updateCardProgress(cardId: string, taskId: string, newStatus: string) {
    setCardProgress((prev: Record<string, { completed: number; total: number }>) => {
      const current = prev[cardId] || { completed: 0, total: 0 }
      if (newStatus === 'completed') {
        return {
          ...prev,
          [cardId]: { ...current, completed: current.completed + 1 }
        }
      } else {
        return {
          ...prev,
          [cardId]: { ...current, completed: Math.max(0, current.completed - 1) }
        }
      }
    })
  }

  useEffect(() => { loadBoard(trainerScope) }, [trainerScope])

  // Restaurar estado de colapso da navega   £o (persist  ncia localStorage)
  useEffect(() => {
    try {
      const v = localStorage.getItem('pg.nav.collapsed')
      if (v === '1' || v === 'true') setBoardCollapsed(true)
    } catch {}
  }, [])

  // Debounce 200ms para busca r ¡pida
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.toLowerCase()), 200)
    return () => clearTimeout(t)
  }, [query])

  // Ouve a sele   £o da  ¡rvore
  useEffect(() => {
    function onScope(e: CustomEvent<{ trainerId?: string }>) {
      const id = e.detail?.trainerId
      setTrainerScope(id || undefined)
    }
    window.addEventListener('pg:kanban:setTrainer', onScope as EventListener)
    return () => window.removeEventListener('pg:kanban:setTrainer', onScope as EventListener)
  }, [])

  // Ouve busca do header externo (onboarding)
  useEffect(() => {
    function onSearch(e: CustomEvent<{ q?: string }>) {
      setQuery(String(e.detail?.q || ''))
    }
    window.addEventListener('pg:kanban:search', onSearch as EventListener)
    return () => window.removeEventListener('pg:kanban:search', onSearch as EventListener)
  }, [])

  // Ouve filtros aplicados pelo header/drawer
  useEffect(() => {
    function onFilters(e: CustomEvent<{ filters?: Record<string, string[]> }>) {
      setActiveFilters(e.detail?.filters || {})
    }
    window.addEventListener('pg:kanban:applyFilters', onFilters as EventListener)
    return () => window.removeEventListener('pg:kanban:applyFilters', onFilters as EventListener)
  }, [])

  // Ouve comandos externos de novo card/coluna
  useEffect(() => {
    function onNewCard(){ addCard() }
    function onNewColumn(){ addColumn() }
    window.addEventListener('pg:kanban:newCard', onNewCard as EventListener)
    window.addEventListener('pg:kanban:newColumn', onNewColumn as EventListener)
    return () => {
      window.removeEventListener('pg:kanban:newCard', onNewCard as EventListener)
      window.removeEventListener('pg:kanban:newColumn', onNewColumn as EventListener)
    }
  }, [])

  function addCard() {
    // Cria   £o do card correto: direciona para cadastro completo com onboarding=enviar
    window.location.href = '/app/students?new=true&onboarding=enviar'
  }

  function addColumn() {
    // Redireciona para o m ³dulo de Servi  os (aba Onboarding) para criar a coluna l ¡
    try {
      const url = new URL('/app/services', window.location.origin)
      url.searchParams.set('tab', 'onboarding')
      url.searchParams.set('newColumn', '1')
      window.location.href = url.toString()
    } catch {
      window.location.href = '/app/services?tab=onboarding&newColumn=1'
    }
  }

  async function reorderColumnsMiddle(newMiddleIds: string[]) {
    // novo endpoint de stages com range 2..98
    const updates = newMiddleIds.map((id, idx) => ({ id, order: 2 + idx }))
    setBusy(true)
    try {
      const r = await fetch('/api/kanban/stages/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!r.ok) throw new Error(String(r.status))
      toast.success('Ordem das colunas atualizada')
    } catch {
      toast.error('Falha ao reordenar colunas')
    } finally {
      setBusy(false)
      await loadBoard(trainerScope)
    }
  }

  function openEditModal(col: Column) {
    console.log('ðŸ” openEditModal chamado com:', col)
    const fixedFirst = columns.find(c=>c.title==='Novo Aluno')?.id
    const fixedLast = columns.find(c=>c.title==='Entrega do Treino')?.id
    const isFixed = col.id === fixedFirst || col.id === fixedLast
    
    console.log('ðŸ” Colunas fixas encontradas:', { fixedFirst, fixedLast, isFixed })
    
    if (isFixed) {
      // Colunas fixas: s ³ podem editar nome, posi   £o fica fixa
      const order = col.id === fixedFirst ? 1 : 99
      console.log('ðŸ” Definindo coluna fixa:', { order })
      setEdit({ open: true, id: col.id, name: col.title, order, loading: false })
    } else {
      // Colunas intermedi ¡rias: podem editar nome e posi   £o
      const middle = columns.filter(c=> c.id!==fixedFirst && c.id!==fixedLast)
      const idx = middle.findIndex(c=>c.id===col.id)
      const order = Math.max(2, Math.min(98, 2 + (idx >= 0 ? idx : 0)))
      console.log('ðŸ” Definindo coluna intermedi ¡ria:', { order, idx })
      setEdit({ open: true, id: col.id, name: col.title, order, loading: false })
    }
    
    console.log('ðŸ” Estado edit definido:', { open: true, id: col.id, name: col.title })
  }

  async function submitEdit() {
    if (!edit.id) return
    const name = edit.name.trim()
    const isFixed = edit.order === 1 || edit.order === 99
    
    setEdit(v=>({ ...v, loading: true }))
    try {
      if (isFixed) {
        // Colunas fixas: s ³ atualiza nome, mant  m posi   £o
        const res = await fetch(`/api/kanban/stages/${edit.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
        if (!res.ok) throw new Error('fail')
        toast.success('Nome da coluna atualizado')
      } else {
        // Colunas intermedi ¡rias: atualiza nome e posi   £o
        const order = Math.max(2, Math.min(98, Number(edit.order || 2)))
        const res = await fetch(`/api/kanban/stages/${edit.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, order }) })
        if (!res.ok) {
          if (res.status === 403) throw new Error('fixed')
          throw new Error('fail')
        }
        // Ap ³s editar ordem de uma, garantimos sequ  ncia chamando reorder com o snapshot atual
        const fixedFirst = columns.find(c=>c.title==='Novo Aluno')?.id
        const fixedLast = columns.find(c=>c.title==='Entrega do Treino')?.id
        const middle = columns.filter(c=> c.id!==fixedFirst && c.id!==fixedLast)
        // Coloca a coluna editada na posi   £o desejada
        const others = middle.filter(c=> c.id !== edit.id)
        const clampedIndex = Math.max(0, Math.min(others.length, order - 2))
        const reordered = [...others]
        reordered.splice(clampedIndex, 0, { id: edit.id, title: name, cards: [], locked: false })
        const updates = reordered.map((c, idx) => ({ id: c.id, order: 2 + idx }))
        await fetch('/api/kanban/stages/reorder', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(updates) })
        toast.success('Coluna atualizada')
      }
      setEdit({ open: false, id: null, name: "", order: 2, loading: false })
      await loadBoard(trainerScope)
    } catch (e:any) {
      if (e?.message === 'fixed') toast.error('Coluna fixa n £o pode ser editada.')
      else toast.error('Falha ao atualizar coluna')
      setEdit(v=>({ ...v, loading: false }))
    }
  }

  // Exclus £o de coluna    feita apenas na tela de Servi  os/Onboard

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
    setConfirm({
      open: true,
      title: 'Renomear coluna',
      description: 'Confirma renomear esta coluna? (form de edi   £o completo vir ¡ na pr ³xima etapa)',
      onConfirm: () => {
        const title = `Coluna ${Date.now().toString().slice(-3)}`
        fetch(`/api/kanban/columns/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title }) })
          .then(r=>{ if(!r.ok) throw new Error(String(r.status)); return r.json() })
          .then(()=> { loadBoard(); toast.success('Coluna renomeada') })
          .catch(()=> toast.error('Falha ao renomear coluna'))
      }
    })
  }

  function removeColumn(id: string) {
    const col = columns.find(c => c.id === id)
    if (!col) return
    
    if (col.cards.length > 0) {
      toast.error('N £o    poss ­vel excluir: coluna n £o est ¡ vazia.')
      return
    }
    
    if (col.locked) {
      toast.error('N £o    poss ­vel excluir: coluna fixa.')
      return
    }
    
    setConfirm({
      open: true,
      title: 'Excluir coluna',
      description: `Tem certeza que deseja excluir a coluna "${col.title}"? Esta a   £o n £o pode ser desfeita.`,
      onConfirm: () => {
        fetch(`/api/kanban/stages/${id}`, { method:'DELETE' })
          .then(async (r)=>{
            if(!r.ok){
              if (r.status === 422) throw new Error('not_empty')
              throw new Error(String(r.status))
            }
            return r.json()
          })
          .then(()=> { loadBoard(); window.dispatchEvent(new Event('pg:kanban:refetchTree')); toast.success('Coluna removida') })
          .catch((e)=>{
            const msg = String(e?.message||'')
            if (msg === 'not_empty') toast.error('N £o    poss ­vel remover: coluna n £o est ¡ vazia.')
            else toast.error('Falha ao remover coluna')
          })
      }
    })
  }

  async function handleMoveCard(card: Card, fromId: string, toId: string) {
    // Compat: backend atual exp µe POST em /api/kanban/move com payload cardId/fromColumnId/toColumnId
    const res = await fetch("/api/kanban/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id, fromColumnId: fromId, toColumnId: toId }),
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
    if (!over || active.id === over.id) return
    // Reordena   £o de colunas pelo cabe  alho
    if (String(active.id).startsWith('col:')) {
      const fromId = String(active.id).slice(4)
      const toId = String(over.id)
      const fromCol = columns.find(c=>c.id===fromId)
      const toCol = columns.find(c=>c.id===toId)
      if (!fromCol || !toCol) return
      if (fromCol.locked || fromCol.blocked || toCol.locked) return
      const fixedFirst = columns.find(c=>c.title==='Novo Aluno')?.id
      const fixedLast = columns.find(c=>c.title==='Entrega do Treino')?.id
      const middle = columns.filter(c=> c.id!==fixedFirst && c.id!==fixedLast)
      const fromIndex = middle.findIndex(c=>c.id===fromId)
      const toIndex = middle.findIndex(c=>c.id===toId)
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return
      const next = middle.map(c=>c.id)
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      reorderColumnsMiddle(next)
      draggingColRef.current = null
      return
    }

    const fromCol = columns.find((c) => c.cards.some((k) => k.id === String(active.id)))
    const toCol = columns.find((c) => c.id === String(over.id))
    if (!fromCol || !toCol) return
    const card = fromCol.cards.find((k) => k.id === String(active.id))!

    // Se destino    o mesmo, n £o faz nada (evita POSTs indevidos)
    if (fromCol.id === toCol.id) return

    // Remover do from
    const next = columns.map((c) =>
      c.id === fromCol.id ? { ...c, cards: c.cards.filter((k) => k.id !== card.id) } : c
    )

    // Adicionar no destino
    const after = next.map((c) => (c.id === toCol.id ? { ...c, cards: [...c.cards, card] } : c))

    // Se destino    "Entrega do Treino" (por t ­tulo)  †  mandar para hist ³rico
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
    handleMoveCard(card, fromCol.id, toCol.id).then(async () => {
      // atualizar ordena   £o sequencial no destino
      const target = after.find(c => c.id === toCol.id)
      if (target) {
        const cardIds = target.cards.map(c=>c.id)
        await fetch('/api/kanban/reorder', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ columnId: toCol.id, cardIds }) }).catch(()=>{})
      }
      loadBoard(trainerScope)
      // sinalizar  ¡rvore para atualizar contadores
      window.dispatchEvent(new Event('pg:kanban:refetchTree'))
    }).catch((err) => {
      // rollback visual: desfaz altera   £o local e informa usu ¡rio
      setColumns(columns)
      const status = err?.status || 'error'
      console.error('[Kanban] move failed', { studentId: card.studentId, from: fromCol.id, to: toCol.id, status })
      if (status === 401) {
        toast.error('Sess £o expirada   ” fa  a login novamente.')
      } else if (status === 403) {
        toast.error('Sem permiss £o para mover este card.')
      } else {
        toast.error('N £o foi poss ­vel salvar a movimenta   £o. Sua tela foi revertida.')
      }
    })
    // Acessibilidade: devolver foco ao card ap ³s o movimento
    setTimeout(() => {
      const el = document.getElementById(card.id)
      if (el) (el as HTMLElement).focus()
    }, 0)
  }
  
  function onDragStart(e?: DragEndEvent | any) {
    const id = String(e?.active?.id || '')
    if (id.startsWith('col:')) draggingColRef.current = id.slice(4)
  }

  function onDragOver() {}

  return (
    <div className="container py-8" data-alias="onboarding-kanban">
      
      <Breadcrumb 
        items={[
          { label: "Onboarding/Kanban", current: true }
        ]}
        className="mb-4"
      />

      {showHistory ? (
        <div className="rounded-md border p-4">
          <h2 className="text-lg font-medium">Hist ³rico de Alunos</h2>
          {history.length === 0 ? (
            <div className="mt-3 flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <div className="mb-2 text-3xl">ðŸ ¦</div>
              <p className="text-sm text-muted-foreground">Nenhum hist ³rico por aqui ainda</p>
              <p className="text-xs text-muted-foreground">Movimente cards para a etapa de entrega para v  -los aqui.</p>
            </div>
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
            {/* Lista horizontal de colunas (estilo Trello) com scroll-x e snap opcional */}
            <div className={`${boardCollapsed ? "opacity-60" : ""} flex gap-4 overflow-x-auto pb-2`} style={{ scrollSnapType: 'x proximity' }}>
              {loadingBoard ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={`sk-${i}`} className="w-[300px] shrink-0 rounded-md border bg-card p-3">
                    <div className="mb-4">
                      <Skeleton className="h-5 w-2/3 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-md border p-3">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2 mb-2" />
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-4 w-8" />
                        </div>
                      </div>
                      <div className="rounded-md border p-3">
                        <Skeleton className="h-4 w-2/3 mb-2" />
                        <Skeleton className="h-3 w-3/4 mb-2" />
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-5 w-20 rounded-full" />
                          <Skeleton className="h-4 w-8" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                columns.map((col) => (
                  <div key={col.id} style={{ scrollSnapAlign: 'start' }}>
                    <ColumnView
                      column={col}
                      query={query}
                      filters={activeFilters}
                      debouncedQuery={debouncedQuery}
                      onRename={() => {
                        console.log('ðŸ” onRename chamado para coluna:', col.title)
                        console.log('ðŸ” Estado busy:', busy)
                        console.log('ðŸ” Chamando openEditModal...')
                        openEditModal(col)
                      }}
                      onRemove={() => !col.locked && !busy && removeColumn(col.id)}
                      onMoveLeft={() => !col.locked && !busy && moveColumnLeft(col.id)}
                      onMoveRight={() => !col.locked && !busy && moveColumnRight(col.id)}
                      isBusy={busy}
                      droppableId={col.id}
                      openEditorId={openEditorId}
                      setOpenEditorId={setOpenEditorId}
                      cardProgress={cardProgress}
                      updateCardProgress={updateCardProgress}
                    />
                  </div>
                ))
              )}
            </div>
          </DndContext>
        </>
      )}
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(v: boolean) => setConfirm(prev => ({ ...prev, open: v }))}
        title={confirm.title || ''}
        description={confirm.description}
        onCancel={()=> setConfirm({ open:false, title:'' })}
        onConfirm={()=>{ try { confirm.onConfirm?.() } finally { setConfirm({ open:false, title:'' }) } }}
      />

      <Dialog open={edit.open} onOpenChange={(v: boolean)=> setEdit(prev=>({ ...prev, open: v }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar coluna</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm">Nome</label>
              <Input value={edit.name} onChange={(e)=> setEdit(v=>({ ...v, name: e.target.value }))} placeholder="Nome da coluna" />
            </div>
            {edit.order !== 1 && edit.order !== 99 && (
              <div>
                <label className="mb-1 block text-sm">Posi   £o</label>
                <Input aria-invalid={edit.order<2 || edit.order>98} type="number" min={2} max={98} value={edit.order} onChange={(e)=> setEdit(v=>({ ...v, order: Number(e.target.value||2) }))} />
                {(edit.order<2 || edit.order>98) && (
                  <p className="mt-1 text-xs text-red-600">Posi   £o permitida: 2 a 98</p>
                )}
              </div>
            )}
            {(edit.order === 1 || edit.order === 99) && (
              <p className="text-xs text-muted-foreground">
                {edit.order === 1 ? 'Coluna fixa de entrada' : 'Coluna fixa de sa ­da'}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=> setEdit({ open:false, id:null, name:"", order:2, loading:false })} disabled={edit.loading}>Cancelar</Button>
            <Button onClick={submitEdit} disabled={edit.loading || !edit.name.trim() || (edit.order !== 1 && edit.order !== 99 && (edit.order<2 || edit.order>98))}>
              {edit.loading ? 'Salvando  ¦' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <KanbanLogDrawer
        isOpen={logsDrawer.open}
        onClose={() => setLogsDrawer({ open: false, cardId: '', cardTitle: '' })}
        cardId={logsDrawer.cardId}
        cardTitle={logsDrawer.cardTitle}
      />

      {/* Modal do Editor de Card */}
      {openEditorId && (
        <KanbanCardEditor
          card={columns.flatMap(c => c.cards).find(c => c.id === openEditorId)!}
          column={columns.find(c => c.cards.some(card => card.id === openEditorId))!}
          isOpen={!!openEditorId}
          onClose={() => setOpenEditorId(null)}
          updateCardProgress={updateCardProgress}
          onMove={async (cardId, fromColumnId, toColumnId) => {
            try {
              const response = await fetch('/api/kanban/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId, fromColumnId, toColumnId })
              })

              if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Erro ao mover card')
              }

              // Recarregar board para refletir mudan  as
              await loadBoard(trainerScope)
              
              // Toast de sucesso
              toast.success('Card movido com sucesso!')
              
              // Sinalizar  ¡rvore para atualizar contadores
              window.dispatchEvent(new Event('pg:kanban:refetchTree'))
            } catch (error) {
              console.error('Erro ao mover card:', error)
              toast.error(error instanceof Error ? error.message : 'Erro ao mover card')
            }
          }}
          onComplete={async (cardId) => {
            try {
              // Recarregar board para refletir mudan  as
              await loadBoard(trainerScope)
              
              // Toast de sucesso
              toast.success('Onboarding encerrado com sucesso!')
              
              // Sinalizar  ¡rvore para atualizar contadores
              window.dispatchEvent(new Event('pg:kanban:refetchTree'))
            } catch (error) {
              console.error('Erro ao encerrar onboarding:', error)
              toast.error('Erro ao encerrar onboarding')
            }
          }}
        />
      )}
    </div>
  )
}

function ColumnView({
  column,
  query,
  filters,
  debouncedQuery,
  onRename,
  onRemove,
  onMoveLeft,
  onMoveRight,
  isBusy,
  droppableId,
  openEditorId,
  setOpenEditorId,
  cardProgress,
  updateCardProgress,
}: {
  column: Column
  query: string
  filters?: Record<string, string[]>
  debouncedQuery?: string
  onRename: () => void
  onRemove: () => void
  onMoveLeft: () => void
  onMoveRight: () => void
  isBusy: boolean
  droppableId: string
  openEditorId: string | null
  setOpenEditorId: (id: string | null) => void
  cardProgress: Record<string, { completed: number; total: number }>
  updateCardProgress: (cardId: string, taskId: string, newStatus: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId })
  const matchesFilters = (title: string) => {
    // MVP: aplica apenas filtro por coluna ("column:Nome") e status ("status:active|paused|onboarding")
    if (!filters) return true
    const byCol = filters.column && filters.column.length > 0
    const byStatus = filters.status && filters.status.length > 0
    // coluna
    if (byCol) {
      const ok = filters.column.some((v) => String(column.title).toLowerCase() === String(v).toLowerCase())
      if (!ok) return false
    }
    // status    validado por card individual (feito abaixo)
    return true
  }
  const dragDisabled = !!column.locked || !!column.blocked || isBusy
  // Drag apenas pelo cabe  alho (handle)
  const headerDrag = useDraggable({ id: `col:${column.id}`, disabled: dragDisabled })
  return (
    <div ref={setNodeRef} className={`kanban-column h-fit w-[300px] shrink-0 rounded-md border bg-background p-3 ${isOver ? 'ring-2 ring-primary/40 bg-primary/5' : ''}`} aria-dropeffect={isOver ? 'move' : undefined}>
      <div className="mb-2 flex items-center justify-between">
        <h3
          {...headerDrag.listeners}
          {...headerDrag.attributes}
          ref={headerDrag.setNodeRef}
          className={`font-medium select-none ${dragDisabled ? '' : 'cursor-grab active:cursor-grabbing'}`}
          title={column.blocked ? 'N £o    poss ­vel reordenar: h ¡ cards com servi  os pendentes nesta coluna.' : undefined}
        >
          {column.title}
          {column.blocked && <span className="ml-1" aria-label="bloqueado">ðŸ” </span>}
          <span className="ml-1 rounded bg-muted px-1.5 text-[10px] text-muted-foreground">{column.cards.length}</span>
        </h3>
        <div className="relative">
          <button
            type="button"
            className={`rounded px-2 py-0.5 text-xs hover:bg-muted ${isBusy?'cursor-not-allowed opacity-50':'cursor-pointer'}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              // Toggle do menu
              const menu = e.currentTarget.nextElementSibling
              if (menu) {
                menu.classList.toggle('hidden')
              }
            }}
          >
               
          </button>
          <div className="absolute right-0 z-50 mt-1 w-48 rounded border bg-background p-1 shadow-lg hidden">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('ðŸ” Bot £o Editar clicado!')
                console.log('ðŸ” Estado isBusy:', isBusy)
                onRename()
                // Fecha o menu
                const menu = e.currentTarget.closest('div')
                if (menu) menu.classList.add('hidden')
              }} 
              disabled={isBusy} 
              aria-disabled={isBusy} 
              className="block w-full rounded px-2 py-1 text-left text-xs disabled:opacity-50 hover:bg-muted"
            >
              Editar
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onRemove()
                // Fecha o menu
                const menu = e.currentTarget.closest('div')
                if (menu) menu.classList.add('hidden')
              }} 
              disabled={!!column.locked || isBusy || column.cards.length > 0} 
              aria-disabled={!!column.locked || isBusy || column.cards.length > 0} 
              className="mt-1 block w-full rounded px-2 py-1 text-left text-xs text-red-600 disabled:opacity-50 hover:bg-muted"
            >
              {column.cards.length > 0 ? 'Excluir (coluna n £o vazia)' : 'Excluir coluna'}
            </button>
          </div>
        </div>
      </div>
      <div id={droppableId} className={`space-y-2 ${isOver ? 'outline-dashed outline-2 outline-primary/40 rounded-md p-1' : ''}`}>
        {matchesFilters(column.title) && column.cards.filter(c=>{
          const textOk = c.title.toLowerCase().includes((debouncedQuery ?? query).toLowerCase())
          const statusOk = !filters?.status || filters.status.length === 0 || filters.status.includes(String(c.status || 'onboarding'))
          return textOk && statusOk
        }).length === 0 ? (
          <EmptyState
            title="Nenhum card aqui ainda"
            description="Arraste cards de outras colunas ou crie um novo"
            icon="ðŸ ‚ ¸"
            className="min-h-[80px] border-dashed"
          />
        ) : (
          matchesFilters(column.title) ? (
            column.cards
              .filter(c=>{
                const textOk = c.title.toLowerCase().includes((debouncedQuery ?? query).toLowerCase())
                const statusOk = !filters?.status || filters.status.length === 0 || filters.status.includes(String(c.status || 'onboarding'))
                return textOk && statusOk
              })
              .map((c) => (
                <DraggableCard 
                  key={c.id} 
                  card={c}
                  column={column}
                  isOpen={openEditorId === c.id}
                  onToggle={() => setOpenEditorId(openEditorId === c.id ? null : c.id)}
                  onClose={() => setOpenEditorId(null)}
                  cardProgress={cardProgress[c.id]}
                  updateCardProgress={updateCardProgress}
                />
              ))
          ) : null
        )}
      </div>
    </div>
  )
}

function DraggableCard({ card, column, isOpen, onToggle, onClose, cardProgress, updateCardProgress }: { card: Card; column: Column; isOpen: boolean; onToggle: () => void; onClose: () => void; cardProgress: { completed: number; total: number } | undefined; updateCardProgress: (cardId: string, taskId: string, newStatus: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id })
  
  // Hotkey: E para abrir editor
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'e' && document.activeElement === document.getElementById(card.id)) {
        e.preventDefault()
        onToggle()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [card.id, onToggle])

  // P2-01: Estados visuais refinados com  ­cones contextuais
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'ðŸŸ¢' // Verde para ativo
      case 'paused':
        return 'ðŸŸ¡' // Amarelo para pausado
      case 'onboarding':
      default:
        return 'ðŸ”µ' // Azul para onboarding
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'paused':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'onboarding':
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  return (
    <div
      id={card.id}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`kanban-card group relative rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1 max-w-full ${isDragging ? 'ring-2 ring-primary/60 bg-primary/5 scale-[1.01] z-50' : ''}`}
      tabIndex={0}
      aria-label={`Mover aluno: ${card.title}`}
      title={`${card.title}${card.status ? `   ” ${card.status}` : ''}`}
    >
      {/* P2-01: Indicador visual de foco */}
      <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-primary/20 group-focus:border-primary/40 transition-colors duration-200" />
      
      <div className="relative z-10 w-full">
        {/* Header do Card - APENAS nome do aluno */}
        <div className="flex items-start justify-between mb-2 w-full">
          <div className="min-w-0 flex-1 pr-2">
            <h4 className="line-clamp-2 break-words font-medium text-gray-900 group-hover:text-gray-800 transition-colors text-sm leading-tight">
              {card.title}
            </h4>
          </div>
          
          {/* P2-01: Bot £o de Edi   £o refinado */}
          <button 
            className="flex-shrink-0 rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 group-hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1"
            onClick={(e)=> { e.preventDefault(); e.stopPropagation(); onToggle() }}
            aria-label="Editar card"
            title="Editar card (E)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

        {/* P2-01: Footer minimalista - Status discreto + Progresso de tarefas */}
        <div className="flex items-center justify-between w-full">
          {/* Status discreto - badge pequeno */}
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(card.status || 'onboarding')}`}>
            <span className="text-xs">{getStatusIcon(card.status || 'onboarding')}</span>
            <span className="capitalize text-xs">{card.status || 'onboarding'}</span>
          </span>
          
          {/* P2-01: Progresso de tarefas discreto - apenas 0/0 no canto inferior direito */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-xs">
              {cardProgress ? `${cardProgress.completed}/${cardProgress.total}` : '0/0'}
            </span>
          </div>
        </div>
      </div>

      {/* P2-01: Indicador de intera   £o sutil */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse" />
      </div>
    </div>
  )
}


