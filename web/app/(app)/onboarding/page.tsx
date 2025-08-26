"use client"

import { useEffect, useState } from "react"

type Stage = { id: string; name: string; position: number }
type Item = { id: string; student_id: string; stage_id: string; position: number }

export default function OnboardingSkeletonPage() {
  const [stages, setStages] = useState<Stage[]>([])
  const [items, setItems] = useState<Item[]>([])
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {stages.map((s) => (
            <div key={s.id} className="border rounded p-3">
              <h2 className="font-medium mb-2">{s.name}</h2>
              <ul className="space-y-2">
                {items.filter((it) => it.stage_id === s.id).map((it) => (
                  <li key={it.id} className="text-sm bg-muted rounded px-2 py-1">Aluno {it.student_id.slice(0, 8)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


