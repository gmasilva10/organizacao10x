"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useToast } from "@/components/ui/toast"

type Trainer = { id: string; name: string }
type Address = { zip?: string; street?: string; number?: string; complement?: string; district?: string; city?: string; state?: string; country?: string }
type StudentRow = { id: string; full_name: string; email?: string | null; phone?: string | null; cpf?: string | null; birth_date?: string | null; customer_stage?: string | null; address?: Address | null; status: string; trainer?: { id: string | null } | null }

// Tipos de serviço usados dentro e fora do componente
type Service = {
  id: string
  name: string
  type: 'single'|'plan'|'package'
  status: 'active'|'paused'|'ended'
  price_cents: number
  currency: string
  discount_amount_cents?: number|null
  discount_pct?: number|null
  purchase_status: 'pending'|'paid'|'overdue'|'canceled'
  payment_method?: 'pix'|'card'|'boleto'|'transfer'|'other'|null
  installments?: number|null
  billing_cycle?: 'monthly'|'quarterly'|'semiannual'|'annual'|'one_off'|null
  start_date?: string|null
  delivery_date?: string|null
  end_date?: string|null
  last_payment_at?: string|null
  next_payment_at?: string|null
  is_active?: boolean
  notes?: string|null
}

export function StudentFullModal({
  open,
  mode,
  student,
  trainers,
  onClose,
  onSaved,
}: {
  open: boolean
  mode: 'create'|'edit'
  student: StudentRow | null
  trainers: Trainer[]
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const [tab, setTab] = useState<'general'|'address'|'services'>("general")
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [timelineItems, setTimelineItems] = useState<Array<{ id:string; created_at:string; type:string; channel:string|null; body:string }>>([])
  const [timelinePage, setTimelinePage] = useState(1)
  const [timelineTotal, setTimelineTotal] = useState(0)
  const [timelineType, setTimelineType] = useState<'all'|'nota'|'ligacao'|'whatsapp'|'email'>('all')
  const [timelineFrom, setTimelineFrom] = useState<string>('')
  const [timelineTo, setTimelineTo] = useState<string>('')
  const [newMsgBody, setNewMsgBody] = useState('')
  const [newMsgType, setNewMsgType] = useState<'nota'|'ligacao'|'whatsapp'|'email'>('nota')
  const [newMsgChannel, setNewMsgChannel] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [cpf, setCpf] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [status, setStatus] = useState<'onboarding'|'active'|'paused'>("onboarding")
  const [customerStage, setCustomerStage] = useState<'new'|'renewal'|'canceled'>("new")
  const [trainerId, setTrainerId] = useState<string>("")
  const [address, setAddress] = useState<Address>({})
  const [ownerId, setOwnerId] = useState<string>("")
  const [primaryId, setPrimaryId] = useState<string>("")
  const [supportId, setSupportId] = useState<string>("")
  const nameRef = useRef<HTMLInputElement | null>(null)
  const emailRef = useRef<HTMLInputElement | null>(null)

  // Serviços
  const [services, setServices] = useState<Service[]>([])

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && student) {
      setName(student.full_name || "")
      setEmail(student.email || "")
      setPhone(student.phone || "")
      setCpf(student.cpf || "")
      setBirthDate(student.birth_date || "")
      setStatus((student.status as 'onboarding'|'active'|'paused') || 'onboarding')
      setCustomerStage((student.customer_stage as 'new'|'renewal'|'canceled') || 'new')
      setTrainerId(student.trainer?.id || "")
      setAddress(student.address || {})
      // carregar responsibles
      fetch(`/api/students/${student.id}/responsibles`, { cache: 'no-store' })
        .then(r=>r.json())
        .then(d => {
          const items: Array<{ user_id:string; role:string }> = Array.isArray(d?.items)? d.items: []
          setOwnerId(items.find(x=>x.role==='owner')?.user_id||"")
          setPrimaryId(items.find(x=>x.role==='trainer_primary')?.user_id||"")
          setSupportId(items.find(x=>x.role==='trainer_support')?.user_id||"")
        }).catch(()=>{})
      setTab('general')
      // carregar serviços
      fetch(`/api/students/${student.id}/services`, { cache: 'no-store' }).then(r=>r.json()).then(d => setServices(d?.items || [])).catch(()=>setServices([]))
    } else if (mode === 'create') {
      setName(""); setEmail(""); setPhone(""); setCpf(""); setBirthDate(""); setStatus('onboarding'); setCustomerStage('new'); setTrainerId(""); setAddress({}); setServices([]); setTab('general')
    }
  }, [open, mode, student])

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`
    if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
  }
  function onlyDigits(v: string) { return v.replace(/\D/g, "") }

  const canSubmit = Boolean(name && /.+@.+\..+/.test(email))

  const financialSummary = useMemo(() => {
    const active = services.find((s) => !!s.is_active) || null
    function addMonths(dateStr?: string|null, months?: string|null) {
      if (!dateStr || !months) return null
      const d = new Date(dateStr)
      const m = months === 'monthly' ? 1 : months === 'quarterly' ? 3 : months === 'semiannual' ? 6 : months === 'annual' ? 12 : 0
      if (m === 0) return null
      d.setMonth(d.getMonth() + m)
      return d.toISOString().slice(0,10)
    }
    function netPriceCents(s: Service) {
      const base = Number(s.price_cents || 0)
      const hasPct = s.discount_pct != null
      const hasAmt = s.discount_amount_cents != null
      if (hasPct) return Math.max(0, Math.round(base * (1 - Number(s.discount_pct)/100)))
      if (hasAmt) return Math.max(0, base - Number(s.discount_amount_cents))
      return base
    }
    const nextCharge = active ? addMonths(active.last_payment_at, active.billing_cycle) : null
    const totalMonthly = services
      .filter((s) => !!s.is_active && s.billing_cycle === 'monthly')
      .reduce((acc:number, s) => acc + netPriceCents(s), 0)
    return {
      activeTitle: active ? `${active.name} (${active.billing_cycle || '—'})` : '—',
      nextCharge: nextCharge || '—',
      totalMonthlyBRL: (totalMonthly/100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }
  }, [services])

  if (!open) return null

  async function loadTimeline(page = 1) {
    if (!student?.id) return
    const res = await fetch(`/api/relationship/students/${student.id}/timeline?page=${page}&pageSize=20`, { cache: 'no-store' })
    const data = await res.json().catch(()=>({ items:[], total:0 }))
    let items = (data.items || []) as Array<{ id:string; created_at:string; type:string; channel:string|null; body:string }>
    if (timelineType !== 'all') items = items.filter(i => i.type === timelineType)
    if (timelineFrom) items = items.filter(i => i.created_at.slice(0,10) >= timelineFrom)
    if (timelineTo) items = items.filter(i => i.created_at.slice(0,10) <= timelineTo)
    setTimelineItems(items)
    setTimelinePage(page)
    setTimelineTotal(Number(data.total||0))
  }

  function openTimeline() {
    setTimelineOpen(true)
    loadTimeline(1)
  }

  async function quickAddMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!student?.id) return
    if (!newMsgBody.trim()) return
    const res = await fetch('/api/relationship/messages', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ student_id: student.id, type: newMsgType, channel: newMsgChannel || null, body: newMsgBody }) })
    if (res.ok) {
      setNewMsgBody(''); setNewMsgChannel(''); setNewMsgType('nota')
      await loadTimeline(1)
      toast.success('Interação registrada.')
    } else {
      toast.error('Falha ao registrar interação.')
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name) {
      setTab('general'); nameRef.current?.focus(); return
    }
    if (!/.+@.+\..+/.test(email)) {
      setTab('general'); emailRef.current?.focus(); return
    }
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        name,
        email,
        phone: onlyDigits(phone) || null,
        cpf: onlyDigits(cpf) || null,
        birth_date: birthDate || null,
        status,
        customer_stage: customerStage,
        trainer_id: trainerId || null,
        address: address && Object.keys(address).length ? address : null,
      }
      // persist responsibles (somente em edit com id)
      if (mode === 'edit' && student?.id) {
        const base = `/api/students/${student.id}/responsibles`
        const upserts: Array<{role:'owner'|'trainer_primary'|'trainer_support', id:string}> = []
        if (ownerId) upserts.push({ role:'owner', id: ownerId })
        if (primaryId) upserts.push({ role:'trainer_primary', id: primaryId })
        if (supportId) upserts.push({ role:'trainer_support', id: supportId })
        // limpar existentes e reatribuir de forma simples (MVP):
        // nota: endpoints DELETE por id exigem fetch prévio; mantemos POST idempotente (merge duplicates via regra DB de unicidade)
        for (const r of upserts) {
          await fetch(base, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ user_id: r.id, role: r.role }) })
        }
      }
      toast.info(mode === 'create' ? 'Criando aluno...' : 'Salvando aluno...')
      const res = await fetch(mode === 'create' ? '/api/students' : `/api/students/${student!.id}`, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        if (res.status === 422) {
          const body = await res.json().catch(()=>({}))
          if (body?.error === 'limit_reached' && body?.details?.limit === 'students') toast.error('Limite de alunos do plano atingido.')
          else if (body?.code === 'unique_email') toast.error('Este e‑mail já está cadastrado.')
          else if (body?.code === 'validation' && body?.message) {
            toast.error(String(body.message))
            if (String(body.message).toLowerCase().includes('cep')) { setTab('address') }
            if (String(body.message).toLowerCase().includes('uf')) { setTab('address') }
          }
          else toast.error('Erro de validação ao salvar aluno.')
        } else {
          toast.error(`Falha ao ${mode==='create'?'criar':'salvar'} (${res.status})`)
        }
        return
      }
      toast.success(mode === 'create' ? 'Aluno criado.' : 'Aluno salvo.')
      onSaved()
      onClose()
    } catch {
      toast.error('Erro de rede.')
    } finally { setLoading(false) }
  }

  async function addService(row: Partial<Service>) {
    if (!student?.id) return
    if (row.discount_amount_cents != null && row.discount_pct != null) {
      toast.error('Informe apenas um tipo de desconto.')
      return
    }
    const res = await fetch(`/api/students/${student.id}/services`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row)
    })
    if (res.ok) { toast.success('Serviço adicionado.'); const d = await (await fetch(`/api/students/${student.id}/services`)).json(); setServices(d?.items||[]) }
    else {
      if (res.status === 400) {
        const body = await res.json().catch(()=>({}))
        if (body?.error === 'invalid_discount') toast.error('Informe apenas um tipo de desconto (valor OU %).')
        else toast.error('Falha ao adicionar serviço.')
      } else {
        toast.error('Falha ao adicionar serviço.')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="student-full-title" onKeyDown={(e)=>{ if (e.key==='Escape' && !loading) onClose() }}>
      <div className="w-full max-w-3xl rounded-lg bg-background p-5 shadow-lg ring-1 ring-border">
        <h2 id="student-full-title" className="text-lg font-semibold">{mode==='create'?'Novo aluno (Cadastro Completo)':'Editar aluno (Cadastro Completo)'}</h2>
        <div className="mt-4 flex items-center justify-between gap-2 text-sm">
          <div role="tablist" aria-label="Abas do cadastro" className="flex gap-2">
            <button role="tab" aria-selected={tab==='general'} className={`rounded-md border px-3 py-1 ${tab==='general'?'bg-muted':''}`} onClick={()=>setTab('general')}>Dados Gerais</button>
            <button role="tab" aria-selected={tab==='address'} className={`rounded-md border px-3 py-1 ${tab==='address'?'bg-muted':''}`} onClick={()=>setTab('address')}>Endereço</button>
            <button role="tab" aria-selected={tab==='services'} className={`rounded-md border px-3 py-1 ${tab==='services'?'bg-muted':''}`} onClick={()=>setTab('services')}>Financeiro → Serviços</button>
          </div>
          {student?.id && (
            <button type="button" onClick={openTimeline} className="rounded-md border px-3 py-1" aria-label="Ver timeline do aluno">Ver timeline</button>
          )}
        </div>

        <form onSubmit={submit} onKeyDown={(e)=>{ if (e.ctrlKey && e.key==='Enter') submit(e as unknown as React.FormEvent) }} className="mt-4 space-y-4">
          {tab === 'general' && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="f-name" className="mb-1 block text-sm">Nome</label>
                <input id="f-name" ref={nameRef} value={name} onChange={(e)=>setName(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required aria-required="true" />
              </div>
              <div>
                <label htmlFor="f-email" className="mb-1 block text-sm">E-mail</label>
                <input id="f-email" ref={emailRef} type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required aria-required="true" />
              </div>
              <div>
                <label htmlFor="f-phone" className="mb-1 block text-sm">Telefone</label>
                <input id="f-phone" inputMode="tel" value={phone} onChange={(e)=>setPhone(formatPhone(e.target.value))} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="(11) 91234-5678" />
              </div>
              <div>
                <label htmlFor="f-cpf" className="mb-1 block text-sm">CPF</label>
                <input id="f-cpf" inputMode="numeric" value={cpf} onChange={(e)=>setCpf(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="___.___.___-__" />
              </div>
              <div>
                <label htmlFor="f-birth" className="mb-1 block text-sm">Data de Nascimento</label>
                <input id="f-birth" type="date" value={birthDate} onChange={(e)=>setBirthDate(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="f-status" className="mb-1 block text-sm">Status</label>
                <select id="f-status" value={status} onChange={(e)=>setStatus(e.target.value as 'onboarding'|'active'|'paused')} className="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="onboarding">onboarding</option>
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                </select>
              </div>
              <div>
                <label htmlFor="f-cstage" className="mb-1 block text-sm">Tipo de Cliente</label>
                <select id="f-cstage" value={customerStage} onChange={(e)=>setCustomerStage(e.target.value as 'new'|'renewal'|'canceled')} className="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="new">new</option>
                  <option value="renewal">renewal</option>
                  <option value="canceled">canceled</option>
                </select>
              </div>
              <div>
                <label htmlFor="f-trainer" className="mb-1 block text-sm">Treinador responsável</label>
                <select id="f-trainer" value={trainerId} onChange={(e)=>setTrainerId(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="">—</option>
                  {trainers.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                </select>
              </div>
              <div className="md:col-span-2 mt-2">
                <div className="rounded-md border p-3">
                  <h3 className="text-sm font-medium mb-2">Responsáveis</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm">Proprietário</label>
                      <select value={ownerId} onChange={(e)=>setOwnerId(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                        <option value="">—</option>
                        {trainers.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm">Treinador Principal</label>
                      <select value={primaryId} onChange={(e)=>setPrimaryId(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                        <option value="">—</option>
                        {trainers.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm">Treinador de Apoio</label>
                      <select value={supportId} onChange={(e)=>setSupportId(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                        <option value="">—</option>
                        {trainers.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'address' && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="a-zip" className="mb-1 block text-sm">CEP</label>
                <input id="a-zip" inputMode="numeric" value={address.zip || ''} onChange={(e)=>setAddress({ ...address, zip: e.target.value.replace(/\D/g,'').slice(0,8) })} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="00000000" />
              </div>
              <div>
                <label htmlFor="a-street" className="mb-1 block text-sm">Logradouro</label>
                <input id="a-street" value={address.street || ''} onChange={(e)=>setAddress({ ...address, street: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="a-number" className="mb-1 block text-sm">Número</label>
                <input id="a-number" value={address.number || ''} onChange={(e)=>setAddress({ ...address, number: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="a-complement" className="mb-1 block text-sm">Complemento</label>
                <input id="a-complement" value={address.complement || ''} onChange={(e)=>setAddress({ ...address, complement: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="a-district" className="mb-1 block text-sm">Bairro</label>
                <input id="a-district" value={address.district || ''} onChange={(e)=>setAddress({ ...address, district: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="a-city" className="mb-1 block text-sm">Cidade</label>
                <input id="a-city" value={address.city || ''} onChange={(e)=>setAddress({ ...address, city: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="a-state" className="mb-1 block text-sm">UF</label>
                <input id="a-state" value={address.state || ''} onChange={(e)=>setAddress({ ...address, state: e.target.value.toUpperCase().slice(0,2) })} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="SP" />
              </div>
              <div>
                <label htmlFor="a-country" className="mb-1 block text-sm">País</label>
                <input id="a-country" value={address.country || 'BR'} onChange={(e)=>setAddress({ ...address, country: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
            </div>
          )}

          {tab === 'services' && (
            <div className="space-y-3">
              <div className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap gap-4">
                  <div><span className="text-muted-foreground">Serviço ativo:</span> <b>{financialSummary.activeTitle}</b></div>
                  <div><span className="text-muted-foreground">Próxima cobrança:</span> <b>{financialSummary.nextCharge}</b></div>
                  <div><span className="text-muted-foreground">Total mensal estimado:</span> <b>{financialSummary.totalMonthlyBRL}</b></div>
                </div>
              </div>
              {student?.id ? (
                <ServicesGrid studentId={student.id} services={services} onChanged={async()=>{ const d = await (await fetch(`/api/students/${student.id}/services`)).json(); setServices(d?.items||[]) }} onAdd={addService} />
              ) : (
                <div className="rounded-md border p-4 text-sm text-muted-foreground">Salve o aluno para gerenciar serviços.</div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm" aria-label="Cancelar (Esc)">Cancelar</button>
            <button disabled={loading || !canSubmit} className="rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60" aria-label="Salvar (Ctrl+Enter)">{mode==='create'?'Criar':'Salvar'}</button>
          </div>
        </form>

        {timelineOpen && (
          <div className="fixed inset-0 z-[60]" aria-modal="true" role="dialog" aria-labelledby="timeline-title">
            <div className="absolute inset-0 bg-black/40" onClick={()=>setTimelineOpen(false)}></div>
            <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-background shadow-xl ring-1 ring-border">
              <div className="flex items-center justify-between border-b p-4">
                <h3 id="timeline-title" className="text-base font-semibold">Timeline do Aluno</h3>
                <button className="rounded-md border px-3 py-1 text-sm" onClick={()=>setTimelineOpen(false)} aria-label="Fechar timeline">Fechar</button>
              </div>
              <div className="border-b p-4 text-sm">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs">Tipo</label>
                    <select value={timelineType} onChange={(e)=>{ setTimelineType(e.target.value as any); loadTimeline(1) }} className="w-full rounded-md border px-2 py-1">
                      <option value="all">todos</option>
                      <option value="nota">nota</option>
                      <option value="ligacao">ligação</option>
                      <option value="whatsapp">whatsapp</option>
                      <option value="email">email</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs">De</label>
                    <input type="date" value={timelineFrom} onChange={(e)=>{ setTimelineFrom(e.target.value); loadTimeline(1) }} className="w-full rounded-md border px-2 py-1" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs">Até</label>
                    <input type="date" value={timelineTo} onChange={(e)=>{ setTimelineTo(e.target.value); loadTimeline(1) }} className="w-full rounded-md border px-2 py-1" />
                  </div>
                </div>
              </div>
              <div className="h-[calc(100%-200px)] overflow-y-auto p-4">
                {timelineItems.length === 0 && (
                  <div className="rounded-md border p-3 text-sm text-muted-foreground">Nenhuma interação registrada.</div>
                )}
                <ul className="space-y-3">
                  {timelineItems.map((it)=> (
                    <li key={it.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="font-medium capitalize">{it.type}{it.channel?` · ${it.channel}`:''}</div>
                        <div className="text-xs text-muted-foreground">{new Date(it.created_at).toLocaleString('pt-BR')}</div>
                      </div>
                      <div className="mt-2 whitespace-pre-wrap text-sm">{it.body}</div>
                    </li>
                  ))}
                </ul>
                {timelineTotal > 20 && (
                  <div className="mt-3 flex justify-between text-xs">
                    <button className="rounded-md border px-2 py-1" disabled={timelinePage<=1} onClick={()=>loadTimeline(timelinePage-1)}>Anterior</button>
                    <div>Página {timelinePage}</div>
                    <button className="rounded-md border px-2 py-1" onClick={()=>loadTimeline(timelinePage+1)}>Próxima</button>
                  </div>
                )}
              </div>
              <div className="border-t p-4">
                <form onSubmit={quickAddMessage} className="grid grid-cols-1 gap-2 md:grid-cols-4">
                  <select value={newMsgType} onChange={(e)=>setNewMsgType(e.target.value as any)} className="rounded-md border px-2 py-1 text-sm">
                    <option value="nota">nota</option>
                    <option value="ligacao">ligação</option>
                    <option value="whatsapp">whatsapp</option>
                    <option value="email">email</option>
                  </select>
                  <input placeholder="canal (opcional)" value={newMsgChannel} onChange={(e)=>setNewMsgChannel(e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
                  <input placeholder="Mensagem" value={newMsgBody} onChange={(e)=>setNewMsgBody(e.target.value)} className="md:col-span-2 rounded-md border px-3 py-2 text-sm" />
                  <div className="md:col-span-4 flex justify-end">
                    <button className="rounded-md bg-primary px-3 py-2 text-sm text-white">+ Nova interação</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ServicesGrid({ studentId, services, onChanged, onAdd }: { studentId: string; services: Service[]; onChanged: ()=>void; onAdd: (row: Partial<Service>)=>void }) {
  const toast = useToast()
  const [row, setRow] = useState<Partial<Service>>({ name: '', type: 'single', status: 'active', price_cents: 0, currency: 'BRL', purchase_status: 'pending', payment_method: null, installments: null, billing_cycle: null, start_date: '', delivery_date: '' , is_active: false })
  async function remove(id: string) {
    const res = await fetch(`/api/students/${studentId}/services/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Serviço removido.'); onChanged() } else toast.error('Falha ao remover.')
  }
  async function saveActive(s: Service, active: boolean) {
    const res = await fetch(`/api/students/${studentId}/services/${s.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: active }) })
    if (res.ok) { onChanged() } else toast.error('Falha ao atualizar ativo.')
  }
  return (
    <div>
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-2 py-1 text-left">Serviço</th>
            <th className="px-2 py-1 text-left">Tipo</th>
            <th className="px-2 py-1 text-left">Preço</th>
            <th className="px-2 py-1 text-left">Compra</th>
            <th className="px-2 py-1 text-left">Método</th>
            <th className="px-2 py-1 text-left">Parcelas</th>
            <th className="px-2 py-1 text-left">Ciclo</th>
            <th className="px-2 py-1 text-left">Início</th>
            <th className="px-2 py-1 text-left">Entrega</th>
            <th className="px-2 py-1 text-left">Ativo</th>
            <th className="px-2 py-1 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {services.map(s => (
            <tr key={s.id} className="border-t">
              <td className="px-2 py-1">{s.name}</td>
              <td className="px-2 py-1">{s.type}</td>
              <td className="px-2 py-1">{(s.price_cents/100).toFixed(2)} {s.currency}</td>
              <td className="px-2 py-1">{s.purchase_status}</td>
              <td className="px-2 py-1">{s.payment_method || '—'}</td>
              <td className="px-2 py-1">{s.installments || '—'}</td>
              <td className="px-2 py-1">{s.billing_cycle || '—'}</td>
              <td className="px-2 py-1">{s.start_date || '—'}</td>
              <td className="px-2 py-1">{s.delivery_date || '—'}</td>
              <td className="px-2 py-1"><input type="checkbox" checked={!!s.is_active} onChange={(e)=>saveActive(s, e.target.checked)} aria-label="Marcar ativo"/></td>
              <td className="px-2 py-1"><button className="rounded-md border px-2 py-1 text-xs" onClick={()=>remove(s.id)}>Excluir</button></td>
            </tr>
          ))}
          <tr className="border-t">
            <td className="px-2 py-1"><input value={row.name} onChange={(e)=>setRow({ ...row, name: e.target.value })} className="w-full rounded-md border px-2 py-1" placeholder="Nome" /></td>
            <td className="px-2 py-1">
              <select value={row.type} onChange={(e)=>setRow({ ...row, type: e.target.value as Service['type'] })} className="w-full rounded-md border px-2 py-1">
                <option value="single">single</option>
                <option value="plan">plan</option>
                <option value="package">package</option>
              </select>
            </td>
            <td className="px-2 py-1"><input inputMode="numeric" value={row.price_cents} onChange={(e)=>setRow({ ...row, price_cents: Number(e.target.value||0) })} className="w-full rounded-md border px-2 py-1" placeholder="centavos" /></td>
            <td className="px-2 py-1">
              <select value={row.purchase_status} onChange={(e)=>setRow({ ...row, purchase_status: e.target.value as Service['purchase_status'] })} className="w-full rounded-md border px-2 py-1">
                <option value="pending">pending</option>
                <option value="paid">paid</option>
                <option value="overdue">overdue</option>
                <option value="canceled">canceled</option>
              </select>
            </td>
            <td className="px-2 py-1">
              <select value={row.payment_method || ''} onChange={(e)=>setRow({ ...row, payment_method: (e.target.value || null) as Service['payment_method'] })} className="w-full rounded-md border px-2 py-1">
                <option value="">—</option>
                <option value="pix">pix</option>
                <option value="card">card</option>
                <option value="boleto">boleto</option>
                <option value="transfer">transfer</option>
                <option value="other">other</option>
              </select>
            </td>
            <td className="px-2 py-1"><input inputMode="numeric" value={row.installments || ''} onChange={(e)=>setRow({ ...row, installments: e.target.value? Number(e.target.value): null })} className="w-full rounded-md border px-2 py-1" placeholder="nº" /></td>
            <td className="px-2 py-1">
              <select value={row.billing_cycle || ''} onChange={(e)=>setRow({ ...row, billing_cycle: (e.target.value || null) as Service['billing_cycle'] })} className="w-full rounded-md border px-2 py-1">
                <option value="">—</option>
                <option value="monthly">monthly</option>
                <option value="quarterly">quarterly</option>
                <option value="semiannual">semiannual</option>
                <option value="annual">annual</option>
                <option value="one_off">one_off</option>
              </select>
            </td>
            <td className="px-2 py-1"><input type="date" value={row.start_date || ''} onChange={(e)=>setRow({ ...row, start_date: e.target.value })} className="w-full rounded-md border px-2 py-1" /></td>
            <td className="px-2 py-1"><input type="date" value={row.delivery_date || ''} onChange={(e)=>setRow({ ...row, delivery_date: e.target.value })} className="w-full rounded-md border px-2 py-1" /></td>
            <td className="px-2 py-1"><input type="checkbox" checked={!!row.is_active} onChange={(e)=>setRow({ ...row, is_active: e.target.checked })} /></td>
            <td className="px-2 py-1"><button type="button" className="rounded-md bg-primary px-2 py-1 text-xs text-white" onClick={()=>onAdd(row)}>Adicionar</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}




