"use client"

import { useEffect, useRef, useState } from "react"
import { useToast } from "@/components/ui/toast"

export default function TeamOrganizationPage() {
  const [loading, setLoading] = useState(false)
  const [org, setOrg] = useState<any>({ display_name:"", legal_name:"", cnpj:"", address:{}, timezone:"America/Sao_Paulo", currency:"BRL" })
  const [caps, setCaps] = useState<any>(null)
  const toast = useToast()
  const nameRef = useRef<HTMLInputElement|null>(null)

  useEffect(() => { (async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings/organization', { cache:'no-store' })
      const data = await res.json()
      if (data?.organization) setOrg((prev:any) => ({ ...prev, ...data.organization }))
      if (data?.capabilities) setCaps(data.capabilities)
    } finally { setLoading(false) }
  })() }, [])

  function onlyDigits(v: string) { return v.replace(/\D/g,'') }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      toast.info('Salvando organização...')
      const res = await fetch('/api/settings/organization', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(org) })
      if (res.status === 200) {
        toast.success('Organização salva.')
      } else if (res.status === 422) {
        const body = await res.json().catch(()=>({}))
        toast.error(body?.message || 'Erro de validação.')
      } else {
        toast.error(`Falha ao salvar (${res.status}).`)
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-semibold">Organização</h1>
      {caps && (
        <div className="mt-3 rounded-md border p-3 text-sm">
          <div className="flex flex-wrap gap-3">
            <div>Plano: <b className="capitalize">{caps.plan?.name || caps.plan?.code}</b></div>
            <div>Limites: membros={caps.limits?.members_total} | trainers={caps.limits?.trainers}</div>
            <div>Features: team_admin={String(caps.features?.team_admin)}, rbac_matrix={String(caps.features?.rbac_matrix)}</div>
          </div>
        </div>
      )}
      <form onSubmit={submit} onKeyDown={(e)=>{ if (e.ctrlKey && e.key==='Enter') submit(e as unknown as React.FormEvent); if (e.key==='Escape' && !loading) window.history.back() }} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="display_name" className="mb-1 block text-sm">Nome fantasia</label>
            <input id="display_name" ref={nameRef} value={org.display_name||''} onChange={(e)=>setOrg({...org, display_name:e.target.value})} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="legal_name" className="mb-1 block text-sm">Razão social</label>
            <input id="legal_name" value={org.legal_name||''} onChange={(e)=>setOrg({...org, legal_name:e.target.value})} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="cnpj" className="mb-1 block text-sm">CNPJ</label>
            <input id="cnpj" inputMode="numeric" value={org.cnpj||''} onChange={(e)=>setOrg({...org, cnpj: onlyDigits(e.target.value)})} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="__.___.___/____-__" />
          </div>
          <div>
            <label htmlFor="timezone" className="mb-1 block text-sm">Fuso horário</label>
            <select id="timezone" value={org.timezone||'America/Sao_Paulo'} onChange={(e)=>setOrg({...org, timezone:e.target.value})} className="w-full rounded-md border px-3 py-2 text-sm">
              <option value="America/Sao_Paulo">America/Sao_Paulo</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div>
            <label htmlFor="currency" className="mb-1 block text-sm">Moeda</label>
            <select id="currency" value={org.currency||'BRL'} onChange={(e)=>setOrg({...org, currency:e.target.value})} className="w-full rounded-md border px-3 py-2 text-sm">
              <option value="BRL">BRL</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">CEP</label>
            <input inputMode="numeric" value={org.address?.zip||''} onChange={(e)=>setOrg({...org, address:{...org.address, zip: onlyDigits(e.target.value).slice(0,8)}})} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="00000000" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Logradouro</label>
            <input value={org.address?.street||''} onChange={(e)=>setOrg({...org, address:{...org.address, street: e.target.value}})} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Número</label>
            <input value={org.address?.number||''} onChange={(e)=>setOrg({...org, address:{...org.address, number: e.target.value}})} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Complemento</label>
            <input value={org.address?.complement||''} onChange={(e)=>setOrg({...org, address:{...org.address, complement: e.target.value}})} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Bairro</label>
            <input value={org.address?.district||''} onChange={(e)=>setOrg({...org, address:{...org.address, district: e.target.value}})} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Cidade</label>
            <input value={org.address?.city||''} onChange={(e)=>setOrg({...org, address:{...org.address, city: e.target.value}})} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm">UF</label>
            <input value={org.address?.state||''} onChange={(e)=>setOrg({...org, address:{...org.address, state: e.target.value.toUpperCase().slice(0,2)}})} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="SP" />
          </div>
          <div>
            <label className="mb-1 block text-sm">País</label>
            <input value={org.address?.country||'BR'} onChange={(e)=>setOrg({...org, address:{...org.address, country: e.target.value}})} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={()=>window.history.back()} className="rounded-md border px-4 py-2 text-sm">Cancelar (Esc)</button>
          <button disabled={loading} className="rounded-md bg-primary px-4 py-2 text-sm text-white">Salvar (Ctrl+Enter)</button>
        </div>
      </form>
    </div>
  )
}


