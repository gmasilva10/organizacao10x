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
import { KanbanLogDrawer } from '@/components/KanbanLogDrawer'
import { KanbanChecklist } from '@/components/KanbanChecklist'
import { KanbanCardEditor } from '@/components/KanbanCardEditor'
import { Clock, X } from 'lucide-react'

type Card = { id: string; title: string; studentId: string; status?: 'onboarding' | 'active' | 'paused' }
type Column = { id: string; title: string; cards: Card[]; locked?: boolean; blocked?: boolean; stageCode?: string }

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export default function OnboardingPage() {
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
  // estados de arraste não usados removidos para atender regras de lint
  const { success: toastSuccess, error: toastError } = useToast()
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; description?: string; onConfirm?: () => void }>({ open: false, title: '' })
  const [edit, setEdit] = useState<{ open: boolean; id: string | null; name: string; order: number; loading: boolean }>({ open: false, id: null, name: "", order: 2, loading: false })
  const [logsDrawer, setLogsDrawer] = useState<{ open: boolean; cardId: string; cardTitle: string }>({ open: false, cardId: '', cardTitle: '' })
  
  // Estado para armazenar o progresso das tarefas de cada card
  const [cardProgress, setCardProgress] = useState<Record<string, { completed: number; total: number }>>({})
  
  // Debug do estado edit
  useEffect(() => {
    console.log('🔍 Estado edit mudou:', edit)
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

  async function loadBoard(trainerId?: string) {
    setLoadingBoard(true)
    const url = new URL('/api/kanban/board', location.origin)
    if (trainerId) url.searchParams.set('trainerId', trainerId)
    const res = await fetch(url.toString(), { cache: 'no-store' })
    const data: { columns?: Array<{ id: string; title: string }>; cards?: Array<{ id: string; student_id: string; column_id: string; completed_at?: string | null; student_status?: 'onboarding'|'active'|'paused' }> } = await res.json().catch(()=>({}))
    // Não deduplicar por título; cada coluna é distinta por id
    const cols: Column[] = (data.columns || []).map((c) => ({
      id: c.id,
      title: c.title,
      cards: [],
      // Colunas fixas travadas por título, independente da posição
      locked: (c as any).is_fixed === true || ["Novo Aluno", "Entrega do Treino"].includes(String(c.title)),
      stageCode: (c as any).stage_code
    }))
    // Identifica a coluna de conclusão por título, não pela última posição
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
        status: k.student_status,
        studentPhone: (k as any).student_phone
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
    console.log(`🔄 Carregando progresso para ${data.cards?.length || 0} cards`)
    for (const card of data.cards || []) {
      console.log(`📝 Processando card: ${card.id} (${(card as any).student_name || card.student_id})`)
      await loadCardProgress(card.id)
    }
    console.log('✅ Progresso de todos os cards carregado')
  }

  // Função para carregar o progresso das tarefas de um card
  async function loadCardProgress(cardId: string) {
    try {
      console.log(`🔍 Carregando progresso para card: ${cardId}`)
      const response = await fetch(`/api/kanban/items/${cardId}/tasks`)
      if (response.ok) {
        const data = await response.json()
        console.log(`📊 Dados recebidos para card ${cardId}:`, data)
        
        // Verificar se data.tasks existe e é um array
        const tasks = data.tasks || data || []
        console.log(`📋 Tasks para card ${cardId}:`, tasks)
        
        if (Array.isArray(tasks)) {
          // Contar todas as tarefas (obrigatórias + opcionais)
          const completed = tasks.filter((task: any) => task.status === 'completed').length
          const total = tasks.length
          console.log(`✅ Progresso calculado para card ${cardId}: ${completed}/${total} (todas as tarefas)`)
          setCardProgress((prev: Record<string, { completed: number; total: number }>) => ({
            ...prev,
            [cardId]: { completed, total }
          }))
        } else {
          console.warn(`⚠️ Tasks não é um array para card ${cardId}:`, tasks)
          setCardProgress((prev: Record<string, { completed: number; total: number }>) => ({
            ...prev,
            [cardId]: { completed: 0, total: 0 }
          }))
        }
      } else {
        console.warn(`⚠️ Response não OK para card ${cardId}:`, response.status)
        setCardProgress((prev: Record<string, { completed: number; total: number }>) => ({
          ...prev,
          [cardId]: { completed: 0, total: 0 }
        }))
      }
    } catch (error) {
      console.error(`❌ Erro ao carregar progresso do card ${cardId}:`, error)
      // Em caso de erro, definir progresso como 0/0
      setCardProgress((prev: Record<string, { completed: number; total: number }>) => ({
        ...prev,
        [cardId]: { completed: 0, total: 0 }
      }))
    }
  }

  // Função para atualizar o progresso de um card após toggle de tarefa
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
    // Criação do card correto: direciona para cadastro completo com onboarding=enviar
    window.location.href = '/app/students?new=true&onboarding=enviar'
  }

  function addColumn() {
    // Redireciona para o módulo de Serviços (aba Onboarding) para criar a coluna lá
    try {
      const url = new URL('/app/services', window.location.origin)
      url.searchParams.set('tab', 'onboarding')
      url.searchParams.set('newColumn', '1')
      window.location.href = url.toString()
    } catch {
      window.location.href = '/app/services?tab=onboarding&newColumn=1'
    }
  }

  // Carregar board ao montar o componente
  useEffect(() => {
    loadBoard(trainerScope)
  }, [trainerScope])

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

  return (
    <div className="container py-8" data-alias="onboarding-kanban">
      {loadingBoard ? (
        <>
          <div className="space-y-3">
            <div className="h-8 bg-muted rounded animate-pulse flex items-center gap-1">
              <span className="text-muted-foreground px-2">Carregando board...</span>
            </div>
          </div>
        </>
      ) : columns.length === 0 ? (
        <div className="mb-3" />
      ) : (
        <>
      <div className="mb-3" />

          <DndContext sensors={sensors} onDragStart={(e) => {
            const isDraggingCol = e.active.id.toString().startsWith('col:')
            if (isDraggingCol) {
              draggingColRef.current = String(e.active.id).replace('col:', '')
            }
          }} onDragOver={(e) => {
            if (busy) return
            const over = e.over
            if (!over || !draggingColRef.current) return

            const currentIndex = columns.findIndex(col => col.id === draggingColRef.current)
            if (currentIndex === -1) return
        
            let newIndex = columns.findIndex(col => col.id === over.id)
            if (newIndex === -1) {
              // Se passou por uma coluna válida, calcula baseado na posição
              const targetPosition = over.data.current?.sortableInfo?.index as number
              if (targetPosition === undefined) {
                return
              }
              newIndex = Math.max(0, Math.min(targetPosition, columns.length - 1))
            }

            if (currentIndex !== newIndex) {
              const newColumns = [...columns]
              const draggedColumn = newColumns.splice(currentIndex, 1)[0]
              newColumns.splice(newIndex, 0, draggedColumn)
              setColumns(newColumns)
            }
          }} onDragEnd={async (e) => {
            draggingColRef.current = null
            setBusy(false)
            const { active, over } = e
            if (!over) return
            
            const cardId = String(active.id)
            const targetId = String(over.id)
            const isDraggingCol = cardId.startsWith('col:')
            
            if (isDraggingCol) {
              // Atividade futura: reordenção de colunas
              return
            }
            
            setBusy(true)
            
            const fromColumnId = columns.find(col => col.cards.some(c => c.id === cardId))?.id
            const toColumn = columns.find(col => col.id === targetId || col.cards.some(c => c.id === targetId))
            
            if (!fromColumnId || !toColumn) {
              setBusy(false)
              return
            }
            
            const toColumnId = toColumn.id
            const toCardId = toColumn.cards.find(c => c.id === targetId)?.id
            const toIndex = toCardId ? toColumn.cards.findIndex(c => c.id === targetId) : toColumn.cards.length
            
            lastMovedIdRef.current = cardId
            
            try {
              const response = await fetch('/api/kanban/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  cardId,
                  fromColumnId,
                  toColumnId,
                  toCardId,
                  toIndex
                })
              })
              
              if (!response.ok) {
                const errorData = await response.json()
                toastError(errorData.error || "Não foi possível mover o card para a nova posição")
              }
              await loadBoard(trainerScope)
            } catch (err) {
              console.error('Erro ao mover card via API:', err)
              toastError("Não foi possível se comunicar com o servidor. Recarregue a página.")
            }
          }}>
            <div className={`${boardCollapsed ? "opacity-60" : ""} flex gap-4 overflow-x-auto pb-2`} style={{ scrollSnapType: 'x proximity' }}>
              {columns.map((column, index) => (
                <ColumnView
                  key={column.id}
                  column={column}
                  index={index}
                  query={query}
                  debouncedQuery={debouncedQuery}
                  activeFilters={activeFilters}
                  openEditorId={openEditorId}
                  setOpenEditorId={setOpenEditorId}
                  cardProgress={cardProgress}
                  updateCardProgress={updateCardProgress}
                />
              ))}
            </div>
          </DndContext>
        </>
      )}

      {/* ConfirmDialog */}
      {confirm.open && (
        <ConfirmDialog
          open={confirm.open}
          onConfirm={confirm.onConfirm || (() => setConfirm({...confirm, open: false}))}
          onCancel={() => setConfirm({...confirm, open: false})}
          title={confirm.title}
          description={confirm.description}
        />
      )}

      {/* KanbanCardEditor */}
      {openEditorId && columns.map(col => col.cards.find(c => c.id === openEditorId)).filter(Boolean).length > 0 && (
        <KanbanCardEditor
          card={columns.map(col => col.cards.find(c => c.id === openEditorId)).filter(Boolean)[0]!}
          column={columns.map(col => col.cards.find(c => c.id === openEditorId)).find(Boolean)?.[0] ? columns.find(col => col.cards.some(c => c.id === openEditorId))! : columns[0]!}
          isOpen={!!openEditorId}
          onClose={() => setOpenEditorId(null)}
          onMove={async (cardId: string, fromColumnId: string, toColumnId: string) => {
            try {
              const response = await fetch('/api/kanban/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  cardId, 
                  fromColumnId, 
                  toColumnId, 
                  toCardId: null, 
                  toIndex: 0 
                })
              })
              
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
                throw new Error(errorData.error || 'Erro ao mover card')
              }
              
              const result = await response.json()
              if (result.success) {
                await loadBoard(trainerScope)
                toastSuccess(result.message || 'Card movido com sucesso')
              }
            } catch (err) {
              console.error('Erro ao mover card via editor:', err)
              toastError(err instanceof Error ? err.message : "Não foi possível avançar para a próxima etapa.")
            }
          }}
          onComplete={(cardId: string) => {
            toastSuccess("Card completado: As tarefas do card foram concluídas.")
            loadBoard(trainerScope)
          }}
          updateCardProgress={updateCardProgress}
        />
      )}

      {/* Log Drawer */}
      {logsDrawer.open && columns.map(col => col.cards.find(c => c.id === logsDrawer.cardId)).filter(Boolean).length > 0 && (
        <KanbanLogDrawer
          cardId={logsDrawer.cardId}
          cardTitle={logsDrawer.cardTitle}
          isOpen={logsDrawer.open}
          onClose={() => setLogsDrawer({...logsDrawer, open: false})}
        />
      )}
    </div>
  )
}

function ColumnView({
  column,
  index,
  query,
  debouncedQuery,
  activeFilters,
  openEditorId,
  setOpenEditorId,
  cardProgress,
  updateCardProgress
}: {
  column: Column
  index: number
  query: string
  debouncedQuery: string
  activeFilters: Record<string, string[]>
  openEditorId: string | null
  setOpenEditorId: (id: string | null) => void
  cardProgress: Record<string, { completed: number; total: number }>
  updateCardProgress: (cardId: string, taskId: string, newStatus: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const matchesFilters = (title: string) => {
    // MVP: aplica apenas filtro por coluna ("column:Nome") e status ("status:active|paused|onboarding")
    if (!activeFilters) return true
    const byCol = activeFilters.column && activeFilters.column.length > 0
    const byStatus = activeFilters.status && activeFilters.status.length > 0
    
    if (byCol) {
      const ok = activeFilters.column.some((v) => String(column.title).toLowerCase() === String(v).toLowerCase())
      if (!ok) return false
    }
    
    return true
  }

  return (
    <div ref={setNodeRef} className="w-[300px] shrink-0 bg-card rounded-md border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium select-none cursor-default">
          {column.title}
          <span className="ml-1 rounded bg-muted px-1.5 text-[10px] text-muted-foreground">
            {column.cards.length}
          </span>
        </h3>
        <span 
          className="text-[10px] text-muted-foreground" 
          title={`Coluna ${index + 1}`}
        >
          #{index + 1}
        </span>
      </div>
      <div className={`space-y-2 ${isOver ? 'outline-dashed outline-2 outline-primary/40 rounded-md p-1' : ''}`}>
        {matchesFilters(column.title) && column.cards.length === 0 ? (
          <div className="min-h-[80px] border-dashed border rounded-md p-3 text-muted-foreground text-center">
            <p className="text-sm">Nenhum card aqui ainda</p>
            <p className="text-xs">Arraste cards de outras colunas ou crie um novo</p>
          </div>
        ) : (
          matchesFilters(column.title) ? (
            column.cards
              .filter(card => {
                const textOk = card.title.toLowerCase().includes((debouncedQuery ?? query).toLowerCase())
                const statusOk = !activeFilters?.status || activeFilters.status.length === 0 || activeFilters.status.includes(String(card.status || 'onboarding'))
                return textOk && statusOk
              })
              .map((card) => (
                <DraggableCard
                  key={card.id}
                  card={card}
                  column={column}
                  isOpen={openEditorId === card.id}
                  onToggle={() => setOpenEditorId(openEditorId === card.id ? null : card.id)}
                  onClose={() => setOpenEditorId(null)}
                  cardProgress={cardProgress[card.id]}
                  updateCardProgress={updateCardProgress}
                />
              ))
          ) : null
        )}
      </div>
    </div>
  )
}

function DraggableCard({ card, column, isOpen, onToggle, onClose, cardProgress, updateCardProgress }: { 
  card: Card; 
  column: Column; 
  isOpen: boolean; 
  onToggle: () => void; 
  onClose: () => void; 
  cardProgress: { completed: number; total: number } | undefined; 
  updateCardProgress: (cardId: string, taskId: string, newStatus: string) => void 
}) {
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

  // Estados visuais refinados com ícones contextuais
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢' // Verde para ativo
      case 'paused':
        return '🟡' // Amarelo para pausado
      case 'onboarding':
      default:
        return '🔵' // Azul para onboarding
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
      title={`${card.title}${card.status ? ` — ${card.status}` : ''}`}
    >
      {/* Indicador visual de foco */}
      <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-primary/20 group-focus:border-primary/40 transition-colors duration-200" />
      
      <div className="relative z-10 w-full">
        {/* Header do Card - APENAS nome do aluno */}
        <div className="flex items-start justify-between mb-2 w-full">
          <div className="min-w-0 flex-1 pr-2">
            <h4 className="line-clamp-2 break-words font-medium text-gray-900 group-hover:text-gray-800 transition-colors text-sm leading-tight">
              {card.title}
            </h4>
          </div>
          
          {/* Botão de Edição refinado */}
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

        {/* Footer minimalista - Status discreto + Progresso de tarefas */}
        <div className="flex items-center justify-between w-full">
          {/* Status discreto - badge pequeno */}
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(card.status || 'onboarding')}`}>
            <span className="text-xs">{getStatusIcon(card.status || 'onboarding')}</span>
            <span className="capitalize text-xs">{card.status || 'onboarding'}</span>
          </span>
          
          {/* Progresso de tarefas discreto */}
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

      {/* Indicador de interação sutil */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse" />
      </div>
    </div>
  )
}
