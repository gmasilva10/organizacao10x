"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type MatrixRow = { role: string; permissions: string[] }

export default function SettingsRolesPage() {
  const [rows, setRows] = useState<MatrixRow[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const resp = await fetch('/api/settings/roles')
        const json = await resp.json()
        if (!cancelled && resp.ok) setRows(json.items || [])
      } catch {}
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function onRestore() {
    setRestoring(true)
    try {
      const resp = await fetch('/api/settings/rbac/restore_default', { method: 'POST' })
      if (!resp.ok) throw new Error('fail')
    } catch {} finally { setRestoring(false) }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-sm text-muted-foreground" aria-label="Breadcrumb"><ol className="flex items-center gap-2"><li><a href="/app" className="underline">Início</a></li><li aria-hidden> / </li><li><a href="/app/settings" className="underline">Configurações</a></li><li aria-hidden> / </li><li aria-current="page">Papéis</li></ol></nav>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Papéis</h1>
      <div className="mb-4">
        <Button onClick={onRestore} disabled={restoring}>{restoring ? 'Restaurando...' : 'Restaurar Padrão'}</Button>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Matriz de permissões (somente leitura neste corte).</div>
      )}
    </div>
  )
}


