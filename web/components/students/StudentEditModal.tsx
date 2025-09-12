import { useState, useEffect } from "react"

type TrainersList = Array<{ id: string; name: string }>
type StudentLike = { id: string; name?: string; full_name?: string; email?: string | null; phone?: string | null; status?: 'onboarding'|'active'|'paused'; trainer?: { id: string | null } | null }

export function StudentEditModal({
  open,
  student,
  onClose,
  onSave,
  trainers,
}: {
  open: boolean
  student: StudentLike | null
  onClose: () => void
  onSave: (payload: { id: string; name: string; email: string; phone?: string | null; status?: 'onboarding'|'active'|'paused'; trainer_id?: string | null }) => Promise<void>
  trainers: TrainersList
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [status, setStatus] = useState<'onboarding'|'active'|'paused'>("onboarding")
  const [trainerId, setTrainerId] = useState<string>("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && student) {
      const initialName = student.name || student.full_name || ""
      setName(initialName)
      setEmail(student.email || "")
      setPhone(student.phone || "")
      setStatus((student.status as 'onboarding'|'active'|'paused') || "onboarding")
      setTrainerId(student.trainer?.id || "")
      // Buscar dados completos incluindo email/phone via id
      if (student.id) {
        fetch(`/api/students?id=${encodeURIComponent(student.id)}&page=1&page_size=1`, { cache: 'no-store' })
          .then(r => r.json())
          .then(d => {
            const row = (d?.data || [])[0]
            if (row) {
              setName(row.full_name || initialName)
              if (row.email) setEmail(row.email)
              if (row.phone) setPhone(row.phone)
              if (row.status) setStatus(row.status)
              if (row.trainer?.id) setTrainerId(row.trainer.id)
            }
          }).catch(() => {})
      }
    }
  }, [open, student])

  if (!open || !student) return null

  const validEmail = (v: string) => /.+@.+\..+/.test(v)

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`
    if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
  }

  function sanitizePhoneToDigits(value: string) {
    const digits = value.replace(/\D/g, "")
    return digits.length ? digits : ""
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !validEmail(email) || !student) return
    setLoading(true)
    try {
      await onSave({ id: student.id, name, email, phone: sanitizePhoneToDigits(phone) || null, status, trainer_id: trainerId || null })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-student-title" onKeyDown={(e)=>{ if (e.key === 'Escape' && !loading) onClose() }}>
      <div className="w-full max-w-md rounded-lg bg-background p-5 shadow-lg ring-1 ring-border">
        <h2 id="edit-student-title" className="text-lg font-semibold">Editar aluno</h2>
        {process.env.NEXT_PUBLIC_DEBUG === 'true' && student?.id && (
          <p className="mt-1 text-xs text-muted-foreground">id={student.id}</p>
        )}
        <form onSubmit={submit} onKeyDown={(e)=>{ if (e.ctrlKey && e.key === 'Enter') submit(e as unknown as React.FormEvent) }} className="mt-4 space-y-3">
          <div>
            <label htmlFor="edit-name" className="mb-1 block text-sm">Nome</label>
            <input id="edit-name" value={name} onChange={(e)=>setName(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required aria-required="true" />
          </div>
          <div>
            <label htmlFor="edit-email" className="mb-1 block text-sm">E-mail</label>
            <input id="edit-email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required aria-required="true" />
            {email && !validEmail(email) && <p className="mt-1 text-xs text-red-600">E-mail inválido.</p>}
          </div>
          <div>
            <label htmlFor="edit-phone" className="mb-1 block text-sm">Telefone (opcional)</label>
            <input id="edit-phone" inputMode="tel" value={phone} onChange={(e)=>setPhone(formatPhone(e.target.value))} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="(11) 91234-5678" />
          </div>
          <div>
            <label htmlFor="edit-status" className="mb-1 block text-sm">Status</label>
            <select id="edit-status" value={status} onChange={(e)=>setStatus(e.target.value as 'onboarding'|'active'|'paused')} className="w-full rounded-md border px-3 py-2 text-sm">
              <option value="onboarding">onboarding</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
            </select>
          </div>
          <div>
            <label htmlFor="edit-trainer" className="mb-1 block text-sm">Treinador responsável</label>
            <select id="edit-trainer" value={trainerId} onChange={(e)=>setTrainerId(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
              <option value="">—</option>
              {trainers.map((t)=> (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm" aria-label="Cancelar (Esc)">Cancelar</button>
            <button disabled={loading || !name || !validEmail(email)} className="rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60" aria-label="Salvar (Ctrl+Enter)">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  )
}


