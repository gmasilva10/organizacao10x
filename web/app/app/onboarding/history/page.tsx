"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type HistoryItem = { id: string; student_id: string; trainer_id?: string | null; completed_at?: string | null }

export default function OnboardingHistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [trainerId, setTrainerId] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchHistory = useCallback(async () => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (trainerId) params.set('trainerId', trainerId)
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/kanban/history?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) {
        const text = await res.text().catch(()=>String(res.status))
        throw new Error(text || `Erro ${res.status}`)
      }
      const data = await res.json().catch(()=>({ items: [] }))
      const arr = Array.isArray(data?.items) ? data.items : []
      setItems(arr)
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message?: string }).message) : 'Falha ao carregar histórico'
      setError(msg)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [from, to, trainerId, page])
  useEffect(() => { fetchHistory() }, [fetchHistory])

  // default últimos 7 dias
  const didInitRef = useRef(false)
  useEffect(() => {
    if (didInitRef.current) return
    if (!from && !to) {
      const now = new Date()
      const past = new Date(now.getTime() - 6*24*60*60*1000)
      const f = past.toISOString().slice(0,10)
      const t = now.toISOString().slice(0,10)
      setFrom(f); setTo(t)
      didInitRef.current = true
    }
  }, [from, to])

  return (
    <div className="container py-8">
      <div className="mb-3 flex items-center gap-3">
        <a href="/onboarding" className="rounded-md border px-2 py-1 text-sm" aria-label="Voltar para o Kanban">Voltar</a>
        <h1 className="text-2xl font-semibold">Histórico de Alunos</h1>
      </div>
      <div className="mt-4 flex items-center gap-3 text-sm">
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="rounded-md border px-2 py-1" aria-label="De" />
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="rounded-md border px-2 py-1" aria-label="Até" />
        <input type="text" value={trainerId} onChange={e=>setTrainerId(e.target.value)} placeholder="trainerId (opcional)" className="rounded-md border px-2 py-1" aria-label="Treinador" />
        <button onClick={fetchHistory} className="rounded-md border px-3 py-1">Filtrar</button>
      </div>
      <div className="mt-4 rounded-md border" aria-busy={loading || undefined}>
        {error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : null}
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">Carregando…</div>
        ) : null}
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">Aluno</th>
              <th className="px-3 py-2 text-left">Treinador</th>
              <th className="px-3 py-2 text-left">Concluído em</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading && !error ? (
              <tr><td className="px-3 py-4 text-center text-muted-foreground" colSpan={3}>Sem itens</td></tr>
            ) : items.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="px-3 py-2">{it.student_id}</td>
                <td className="px-3 py-2">{it.trainer_id ?? '-'}</td>
                <td className="px-3 py-2">{it.completed_at ? new Date(it.completed_at).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <button disabled={page<=1} onClick={()=> setPage(p=>Math.max(1,p-1))} className="rounded-md border px-2 py-1">Anterior</button>
        <span>Página {page}</span>
        <button onClick={()=> setPage(p=>p+1)} className="rounded-md border px-2 py-1">Próxima</button>
      </div>
    </div>
  )
}


