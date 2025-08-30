"use client"

import { useEffect, useMemo, useState } from "react"
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

type Stage = { id: string; name: string; position: number }
type Item = { id: string; student_id: string; stage_id: string; position: number }

export default function OnboardingSkeletonPage() {
  const [stages, setStages] = useState<Stage[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [savingId, setSavingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const resp = await fetch("/api/kanban", { cache: "no-store" })
        const json = await resp.json()
        if (!cancelled) {
          if (resp.ok) {
            setStages(json.stages || [])
            setItems(json.items || [])
          } else {
            setError("Falha ao carregar Kanban.")
          }
        }
      } catch {
        if (!cancelled) setError("Falha ao carregar Kanban.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  function handleDragEnd(ev: DragEndEvent) {
    const id = String(ev.active?.id || "")
    const overId = String(ev.over?.id || "")
    if (!id || !overId) return
    const targetStageId = overId.startsWith("stage-") ? overId.slice(6) : items.find(x => x.id === overId)?.stage_id
    if (!targetStageId) return
    const siblingIds = items.filter(x => x.stage_id === targetStageId).map(x => x.id)
    const toIndex = Math.max(0, siblingIds.indexOf(overId.startsWith("stage-") ? "" : overId))
    // optimistic
    setSavingId(id)
    const prev = items
    setItems(prev => prev.map(x => x.id === id ? { ...x, stage_id: targetStageId } : x))
    ;(async () => {
      try {
        const resp = await fetch('/api/kanban/move', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: id, toStageId: targetStageId, toIndex }) })
        if (!resp.ok) throw new Error('fail')
      } catch {
        setItems(prev)
      } finally {
        setSavingId(null)
      }
    })()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Onboarding</h1>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 bg-muted rounded w-2/3 animate-pulse" />
              <div className="h-24 bg-muted rounded animate-pulse" />
              <div className="h-24 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stages.map((s) => (
              <div key={s.id} className="border rounded p-3">
                <h2 className="font-medium mb-2">{s.name}</h2>
                <SortableContext items={items.filter((it)=>it.stage_id===s.id).map(it=>it.id)} strategy={verticalListSortingStrategy}>
                  <ul className="space-y-2" id={`stage-${s.id}`}>
                    {items.filter((it) => it.stage_id === s.id).map((it) => (
                      <li key={it.id} id={it.id} className={`text-sm rounded px-2 py-1 border ${savingId===it.id? 'opacity-60' : 'bg-muted'}`}>Aluno {it.student_id.slice(0, 8)}</li>
                    ))}
                  </ul>
                </SortableContext>
              </div>
            ))}
          </div>
        </DndContext>
      )}
    </div>
  )
}


