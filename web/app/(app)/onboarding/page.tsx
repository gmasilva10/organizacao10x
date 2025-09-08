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
  const toast = useToast()
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
      const card: Card = { id: k.id, title, studentId: k.student_id, status: k.student_status }
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

  return (
    <div className="container py-8" data-alias="onboarding-kanban">
      <div className="mb-3" />
      <div className="text-center text-muted-foreground">
        <p>Onboarding integrado ao Kanban principal</p>
        <p className="text-sm">Use /app/kanban para acessar o board completo</p>
      </div>
    </div>
  )
}
