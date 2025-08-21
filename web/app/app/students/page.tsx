"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useToast } from "@/components/ui/toast"
import { UpgradeModal } from "@/components/UpgradeModal"
import { StudentsSkeleton } from "@/components/students/StudentsSkeleton"
import { StudentsFilters } from "@/components/students/StudentsFilters"
import { AssignTrainerSelect } from "@/components/students/AssignTrainerSelect"
import { StudentCreateModal } from "@/components/students/StudentCreateModal"
import { StudentEditModal } from "@/components/students/StudentEditModal"

type StudentRow = { id: string; full_name: string; status: string; trainer: { id: string | null; name: string | null } | null; created_at: string }
type Trainer = { id: string; name: string }

export default function StudentsPage() {
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<StudentRow[]>([])
  const [total, setTotal] = useState<number>(0)
  const [counts, setCounts] = useState<{ onboarding: number; active: number; paused: number; total: number } | null>(null)
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [trainerId, setTrainerId] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 20
  const qDebounceRef = useRef<number | null>(null)
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState<string>("")
  const [editing, setEditing] = useState<Student | null>(null)
  const toast = useToast()

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
      if (q) params.set('query', q)
      if (status) params.set('status', status)
      if (trainerId) params.set('trainer_id', trainerId)
      const res = await fetch(`/api/students?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setItems((data?.data || []) as StudentRow[])
      setTotal(Number(data?.pagination?.total || 0))
    } catch {
      setError('Falha ao carregar dados. Tente novamente.')
    } finally { setLoading(false) }
  }, [page, pageSize, q, status, trainerId])

  async function fetchTrainers() {
    const res = await fetch('/api/users/trainers', { cache: 'no-store' })
    const data = await res.json()
    const mapped = (data?.items || []).map((x: any) => ({ id: x.user_id, name: x.email })) as Trainer[]
    setTrainers(mapped)
  }

  async function fetchSummary() {
    const res = await fetch('/api/students/summary', { cache: 'no-store' })
    const data = await res.json().catch(() => ({}))
    if (data?.counts) setCounts(data.counts)
  }

  useEffect(() => { fetchTrainers() }, [])
  useEffect(() => { fetchList() }, [fetchList])
  // debounce para query (300ms)
  useEffect(() => {
    if (qDebounceRef.current) {
      clearTimeout(qDebounceRef.current)
    }
    qDebounceRef.current = window.setTimeout(() => {
      setPage(1)
      fetchList()
    }, 300)
    return () => {
      if (qDebounceRef.current) clearTimeout(qDebounceRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])
  useEffect(() => { fetchSummary() }, [])

  async function onCreate(payload: { name: string; email: string }) {
    setLoading(true)
    try {
      const res = await fetch('/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.status === 200) {
        toast.success('Aluno criado com sucesso.')
        fetchList(); fetchSummary()
      } else if (res.status === 422) {
        setShowUpgrade(true)
        toast.info('Limite de alunos atingido.')
      } else if (res.status === 403) {
        toast.error('Sem permissão para criar alunos.')
      } else {
        toast.error(`Falha ao criar aluno (${res.status}).`)
      }
    } finally { setLoading(false) }
  }

  async function onAssign(id: string, trainerId: string | null) {
    setLoading(true)
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trainer_id: trainerId }) })
      if (res.status === 200) {
        toast.success('Treinador atribuído.')
        fetchList(); fetchSummary()
      } else if (res.status === 403) {
        toast.error('Sem permissão para atribuir treinador.')
      } else {
        toast.error(`Falha ao atribuir (${res.status}).`)
      }
    } finally { setLoading(false) }
  }

  async function onUpdate(payload: { id: string; name: string; email: string }) {
    setLoading(true)
    try {
      const res = await fetch(`/api/students/${payload.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: payload.name, email: payload.email }) })
      if (res.status === 200) {
        toast.success('Aluno atualizado.')
        fetchList(); fetchSummary()
      } else {
        toast.error(`Falha ao atualizar (${res.status}).`)
      }
    } finally { setLoading(false) }
  }

  async function onDelete(id: string) {
    if (!confirm('Excluir aluno? Esta ação é irreversível.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
      if (res.status === 200) {
        toast.success('Aluno excluído.')
        fetchList(); fetchSummary()
      } else {
        toast.error(`Falha ao excluir (${res.status}).`)
      }
    } finally { setLoading(false) }
  }

  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total])

  return (
    <div className="container py-8">
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} title="Limite do seu plano foi atingido" description="Para adicionar mais alunos, faça upgrade para o plano Enterprise." primaryHref="/contact" secondaryHref="/planos" />
      <StudentCreateModal open={showCreate} onClose={()=>setShowCreate(false)} onCreate={onCreate} />
      <StudentEditModal open={!!editing} student={editing} onClose={()=>setEditing(null)} onSave={onUpdate} />
      <h1 className="text-2xl font-semibold">Alunos</h1>
      {counts && (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-md border px-2 py-1">Onboarding: <b>{counts.onboarding}</b></span>
          <span className="rounded-md border px-2 py-1">Active: <b>{counts.active}</b></span>
          <span className="rounded-md border px-2 py-1">Paused: <b>{counts.paused}</b></span>
          <span className="rounded-md border px-2 py-1">Total: <b>{counts.total}</b></span>
        </div>
      )}
      <div className="mt-4 flex items-center gap-3">
        <StudentsFilters q={q} status={status} trainerId={trainerId} trainers={trainers} onQ={setQ} onStatus={setStatus} onTrainer={setTrainerId} />
        <button onClick={()=>setShowCreate(true)} className="ml-auto rounded-md bg-primary px-4 py-2 text-sm text-white">Novo aluno</button>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Treinador</th>
              <th className="px-3 py-2 text-left">Criado em</th>
              <th className="px-3 py-2 text-left">Ações</th>
            </tr>
          </thead>
          {loading && <StudentsSkeleton rows={10} />}
          <tbody hidden={loading}>
            {items.map(s => (
              <tr key={s.id} className="border-t">
                <td className="px-3 py-2">{s.full_name}</td>
                <td className="px-3 py-2 capitalize">{s.status}</td>
                <td className="px-3 py-2">
                  <AssignTrainerSelect value={s.trainer?.id || null} trainers={trainers.map(t => ({ user_id: t.id, email: t.name }))} onChange={(v)=>onAssign(s.id, v)} />
                </td>
                <td className="px-3 py-2">{new Date(s.created_at).toLocaleDateString()}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button onClick={()=>setEditing(s)} className="rounded-md border px-2 py-1 text-xs">Editar</button>
                    <button onClick={()=>onDelete(s.id)} className="rounded-md border px-2 py-1 text-xs text-red-600">Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td className="px-3 py-6 text-center text-muted-foreground" colSpan={5}>{loading ? 'Carregando…' : 'Nenhum aluno encontrado. Crie seu primeiro aluno para começar.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Total: {total}</span>
        <div className="flex items-center gap-2">
          <button disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))} className="rounded-md border px-3 py-1 disabled:opacity-60">Anterior</button>
          <span>Página {page} / {pages}</span>
          <button disabled={page>=pages} onClick={() => setPage(p => Math.min(pages, p+1))} className="rounded-md border px-3 py-1 disabled:opacity-60">Próxima</button>
        </div>
      </div>
    </div>
  )
}


