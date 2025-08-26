"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type UserRow = { user_id: string; email: string | null; status: string; last_login_at: string | null; roles?: string[] }

export default function SettingsUsersPage() {
  const [items, setItems] = useState<UserRow[]>([])
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const resp = await fetch(`/api/settings/users`, { cache: "no-store" })
        const json = await resp.json()
        if (!cancelled && resp.ok) setItems(json.items || [])
      } catch {}
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filtered = items.filter((x) => !q || (x.email || '').toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-sm text-muted-foreground" aria-label="Breadcrumb"><ol className="flex items-center gap-2"><li><a href="/app" className="underline">Início</a></li><li aria-hidden> / </li><li><a href="/app/settings" className="underline">Configurações</a></li><li aria-hidden> / </li><li aria-current="page">Usuários</li></ol></nav>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Usuários</h1>

      <div className="mb-4">
        <Input placeholder="Buscar e-mail" value={q} onChange={(e)=>setQ(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum usuário.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-2">E-mail</th>
              <th>Status</th>
              <th>Último login</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u)=> (
              <tr key={u.user_id} className="border-t">
                <td className="py-2">{u.email || '—'}</td>
                <td>{u.status}</td>
                <td>{u.last_login_at || '—'}</td>
                <td className="text-right">
                  <Button size="sm" variant="outline" disabled aria-disabled="true">Atribuir Perfil</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}


