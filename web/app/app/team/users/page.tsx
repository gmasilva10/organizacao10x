"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/toast"

export default function TeamUsersPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("trainer")
  const toast = useToast()

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/settings/users', { cache:'no-store' })
      const data = await res.json()
      setItems(data?.items||[])
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  async function invite() {
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch('/api/settings/users/invite', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, role }) })
      if (res.status === 200) { toast.success('Convite enviado.'); setEmail(""); load() }
      else if (res.status === 422) {
        const body = await res.json().catch(()=>({}))
        if (body?.error === 'limit_reached') toast.error('Limite do plano atingido.')
        else toast.error(body?.message || 'Erro de validação.')
      } else { toast.error(`Falha ao convidar (${res.status}).`) }
    } finally { setLoading(false) }
  }

  async function toggleStatus(u:any) {
    const next = u.status === 'paused' ? 'active' : 'paused'
    const res = await fetch(`/api/settings/users/${u.user_id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status: next }) })
    if (res.ok) { toast.success('Status atualizado.'); load() } else toast.error('Falha ao atualizar status.')
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-semibold">Colaboradores</h1>
      <div className="mt-4 rounded-md border p-4">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-sm">E-mail</label>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-64 rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Papel inicial</label>
            <select value={role} onChange={(e)=>setRole(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
              <option value="trainer">trainer</option>
              <option value="seller">seller</option>
              <option value="support">support</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <button onClick={invite} className="rounded-md bg-primary px-4 py-2 text-sm text-white">Convidar</button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">E-mail</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Último acesso</th>
              <th className="px-3 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map(u => (
              <tr key={u.user_id} className="border-t">
                <td className="px-3 py-2">{u.email||u.user_id}</td>
                <td className="px-3 py-2 capitalize">{u.status}</td>
                <td className="px-3 py-2">{u.last_login_at ? new Date(u.last_login_at).toLocaleString(undefined,{hour12:false}) : '—'}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button onClick={()=>toggleStatus(u)} className="rounded-md border px-2 py-1 text-xs">{u.status==='paused'?'Ativar':'Pausar'}</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length===0 && (
              <tr><td className="px-3 py-6 text-center text-muted-foreground" colSpan={4}>{loading?'Carregando…':'Nenhum colaborador ainda.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


