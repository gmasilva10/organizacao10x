"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/toast"

type Role = { id: string; code: string; name: string }
type Permission = { id: string; domain: string; action: string }

export default function TeamAccessPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [perms, setPerms] = useState<Permission[]>([])
  const [rp, setRp] = useState<Record<string, Record<string, boolean>>>({}) // role_id -> perm_id -> allowed
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/settings/roles', { cache: 'no-store' })
      const data = await res.json()
      setRoles(data.roles || [])
      setPerms(data.permissions || [])
      const map: Record<string, Record<string, boolean>> = {}
      for (const r of data.roles || []) map[r.id] = {}
      for (const link of data.role_permissions || []) {
        if (!map[link.role_id]) map[link.role_id] = {}
        map[link.role_id][link.permission_id] = !!link.allowed
      }
      setRp(map)
    } finally { setLoading(false) }
  }

  function toggle(roleId: string, permId: string) {
    setRp(prev => ({ ...prev, [roleId]: { ...(prev[roleId]||{}), [permId]: !prev[roleId]?.[permId] } }))
  }

  async function save() {
    setLoading(true)
    try {
      // salvar por role para simplificar
      for (const r of roles) {
        const rows = Object.entries(rp[r.id] || {}).map(([permission_id, allowed]) => ({ permission_id, allowed }))
        if (rows.length === 0) continue
        const res = await fetch(`/api/settings/roles/${r.id}/permissions`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rows) })
        if (!res.ok) { toast.error('Falha ao salvar matriz.'); return }
      }
      toast.success('Matriz salva.')
    } finally { setLoading(false) }
  }

  async function restoreDefault() {
    if (!confirm('Esta ação substituirá permissões atuais pelos padrões do sistema. Continuar?')) return
    setLoading(true)
    try {
      const before = await (await fetch('/api/settings/roles', { cache: 'no-store' })).json()
      const res = await fetch('/api/settings/roles/restore-default', { method: 'POST' })
      if (!res.ok) { toast.error('Falha ao restaurar padrão.'); return }
      const after = await (await fetch('/api/settings/roles', { cache: 'no-store' })).json()
      console.log('roles_get_before.json', before)
      console.log('roles_restore_default.json', await res.json())
      console.log('roles_get_after.json', after)
      toast.success('Permissões restauradas para o padrão.')
      await load()
    } finally { setLoading(false) }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-semibold">Papéis & Acessos</h1>
      <div className="mt-4 overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">Domínio/Action</th>
              {roles.map(r => (
                <th key={r.id} className="px-3 py-2 text-left capitalize">{r.code}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permGroups(perms).map(group => (
              <>
                <tr key={group.domain} className="border-t bg-muted/30">
                  <td colSpan={roles.length+1} className="px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">{group.domain}</td>
                </tr>
                {group.items.map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2">{p.action}</td>
                    {roles.map(r => (
                      <td key={r.id} className="px-3 py-2">
                        <input type="checkbox" checked={!!rp[r.id]?.[p.id]} onChange={()=>toggle(r.id, p.id)} aria-label={`Permitir ${p.domain}.${p.action} para ${r.code}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
            {perms.length===0 && (
              <tr><td className="px-3 py-6 text-center text-muted-foreground" colSpan={roles.length+1}>{loading?'Carregando…':'Sem permissões.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button onClick={restoreDefault} disabled={loading} className="rounded-md border px-4 py-2 text-sm">Restaurar padrão</button>
        <button onClick={save} disabled={loading} className="rounded-md bg-primary px-4 py-2 text-sm text-white">Salvar</button>
      </div>
    </div>
  )
}

function permGroups(perms: Permission[]) {
  const by: Record<string, Permission[]> = {}
  for (const p of perms) {
    if (!by[p.domain]) by[p.domain] = []
    by[p.domain].push(p)
  }
  return Object.entries(by).map(([domain, items]) => ({ domain, items }))
}


