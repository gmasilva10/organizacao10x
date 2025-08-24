"use client"

import { useEffect, useMemo, useState } from "react"
import { useToast } from "@/components/ui/toast"

type Trainer = { id: string; name: string }
type Address = { zip?: string; street?: string; number?: string; complement?: string; district?: string; city?: string; state?: string; country?: string }
type StudentRow = { id: string; full_name: string; email?: string | null; phone?: string | null; cpf?: string | null; birth_date?: string | null; customer_stage?: string | null; address?: Address | null; status: string; trainer?: { id: string | null } | null }

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

  // Serviços
  const [services, setServices] = useState<any[]>([])

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && student) {
      setName(student.full_name || "")
      setEmail(student.email || "")
      setPhone(student.phone || "")
      setCpf(student.cpf || "")
      setBirthDate(student.birth_date || "")
      setStatus((student.status as any) || 'onboarding')
      setCustomerStage((student.customer_stage as any) || 'new')
      setTrainerId(student.trainer?.id || "")
      setAddress(student.address || {})
      setTab('general')
      // carregar serviços
      fetch(`/api/students/${student.id}/services`, { cache: 'no-store' }).then(r=>r.json()).then(d => setServices(d?.items || [])).catch(()=>setServices([]))
    } else if (mode === 'create') {
      setName(""); setEmail(""); setPhone(""); setCpf(""); setBirthDate(""); setStatus('onboarding'); setCustomerStage('new'); setTrainerId(""); setAddress({}); setServices([]); setTab('general')
    }
  }, [open, mode, student])

  if (!open) return null

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`
    if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
  }
  function onlyDigits(v: string) { return v.replace(/\D/g, "") }

  const canSubmit = useMemo(() => Boolean(name && /.+@.+\..+/.test(email)), [name, email])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    try {
      const payload: any = {
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
      toast.info(mode === 'create' ? 'Criando aluno...' : 'Salvando aluno...')
      const res = await fetch(mode === 'create' ? '/api/students' : `/api/students/${student!.id}`, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        toast.error(`Falha ao ${mode==='create'?'criar':'salvar'} (${res.status})`)
        return
      }
      toast.success(mode === 'create' ? 'Aluno criado.' : 'Aluno salvo.')
      onSaved()
      onClose()
    } catch {
      toast.error('Erro de rede.')
    } finally { setLoading(false) }
  }

  async function addService(row: any) {
    if (!student?.id) return
    if (row.discount_amount_cents != null && row.discount_pct != null) {
      toast.error('Informe apenas um tipo de desconto.')
      return
    }
    const res = await fetch(`/api/students/${student.id}/services`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row)
    })
    if (res.ok) { toast.success('Serviço adicionado.'); const d = await (await fetch(`/api/students/${student.id}/services`)).json(); setServices(d?.items||[]) }
    else toast.error('Falha ao adicionar serviço.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="student-full-title" onKeyDown={(e)=>{ if (e.key==='Escape' && !loading) onClose() }}>
      <div className="w-full max-w-3xl rounded-lg bg-background p-5 shadow-lg ring-1 ring-border">
        <h2 id="student-full-title" className="text-lg font-semibold">{mode==='create'?'Novo aluno (Cadastro Completo)':'Editar aluno (Cadastro Completo)'}</h2>
        <div className="mt-4 flex gap-2 text-sm" role="tablist" aria-label="Abas do cadastro">
          <button role="tab" aria-selected={tab==='general'} className={`rounded-md border px-3 py-1 ${tab==='general'?'bg-muted':''}`} onClick={()=>setTab('general')}>Dados Gerais</button>
          <button role="tab" aria-selected={tab==='address'} className={`rounded-md border px-3 py-1 ${tab==='address'?'bg-muted':''}`} onClick={()=>setTab('address')}>Endereço</button>
          <button role="tab" aria-selected={tab==='services'} className={`rounded-md border px-3 py-1 ${tab==='services'?'bg-muted':''}`} onClick={()=>setTab('services')} disabled={mode==='create'}>Financeiro → Serviços</button>
        </div>

        <form onSubmit={submit} onKeyDown={(e)=>{ if (e.ctrlKey && e.key==='Enter') submit(e as unknown as React.FormEvent) }} className="mt-4 space-y-4">
          {tab === 'general' && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="f-name" className="mb-1 block text-sm">Nome</label>
                <input id="f-name" value={name} onChange={(e)=>setName(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required aria-required="true" />
              </div>
              <div>
                <label htmlFor="f-email" className="mb-1 block text-sm">E-mail</label>
                <input id="f-email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required aria-required="true" />
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
                <select id="f-status" value={status} onChange={(e)=>setStatus(e.target.value as any)} className="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="onboarding">onboarding</option>
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                </select>
              </div>
              <div>
                <label htmlFor="f-cstage" className="mb-1 block text-sm">Tipo de Cliente</label>
                <select id="f-cstage" value={customerStage} onChange={(e)=>setCustomerStage(e.target.value as any)} className="w-full rounded-md border px-3 py-2 text-sm">
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
              <ServicesGrid studentId={student!.id} services={services} onChanged={async()=>{ const d = await (await fetch(`/api/students/${student!.id}/services`)).json(); setServices(d?.items||[]) }} onAdd={addService} />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm" aria-label="Cancelar (Esc)">Cancelar</button>
            <button disabled={loading || !canSubmit} className="rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60" aria-label="Salvar (Ctrl+Enter)">{mode==='create'?'Criar':'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ServicesGrid({ studentId, services, onChanged, onAdd }: { studentId: string; services: any[]; onChanged: ()=>void; onAdd: (row:any)=>void }) {
  const toast = useToast()
  const [row, setRow] = useState<any>({ name: '', type: 'single', status: 'active', price_cents: 0, currency: 'BRL', purchase_status: 'pending', payment_method: null, installments: null, billing_cycle: null, start_date: '', delivery_date: '' , is_active: false })
  async function remove(id: string) {
    const res = await fetch(`/api/students/${studentId}/services/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Serviço removido.'); onChanged() } else toast.error('Falha ao remover.')
  }
  async function saveActive(s: any, active: boolean) {
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
              <select value={row.type} onChange={(e)=>setRow({ ...row, type: e.target.value })} className="w-full rounded-md border px-2 py-1">
                <option value="single">single</option>
                <option value="plan">plan</option>
                <option value="package">package</option>
              </select>
            </td>
            <td className="px-2 py-1"><input inputMode="numeric" value={row.price_cents} onChange={(e)=>setRow({ ...row, price_cents: Number(e.target.value||0) })} className="w-full rounded-md border px-2 py-1" placeholder="centavos" /></td>
            <td className="px-2 py-1">
              <select value={row.purchase_status} onChange={(e)=>setRow({ ...row, purchase_status: e.target.value })} className="w-full rounded-md border px-2 py-1">
                <option value="pending">pending</option>
                <option value="paid">paid</option>
                <option value="overdue">overdue</option>
                <option value="canceled">canceled</option>
              </select>
            </td>
            <td className="px-2 py-1">
              <select value={row.payment_method || ''} onChange={(e)=>setRow({ ...row, payment_method: e.target.value || null })} className="w-full rounded-md border px-2 py-1">
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
              <select value={row.billing_cycle || ''} onChange={(e)=>setRow({ ...row, billing_cycle: e.target.value || null })} className="w-full rounded-md border px-2 py-1">
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


