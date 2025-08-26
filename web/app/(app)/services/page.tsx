"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toast"

type Service = { id: string; name: string; description?: string | null; price_cents: number; is_active: boolean; created_at: string }

export default function ServicesPage() {
  const { success, error } = useToast()
  const [items, setItems] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [price, setPrice] = useState("0")
  const [desc, setDesc] = useState("")
  const [editing, setEditing] = useState<Service | null>(null)

  const validName = useMemo(() => name.trim().length >= 2 && name.trim().length <= 80, [name])
  const validPrice = useMemo(() => {
    const v = Number(price)
    return Number.isFinite(v) && v >= 0
  }, [price])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const resp = await fetch(`/api/services?page=1&pageSize=20&is_active=true`, { cache: "no-store" })
        const json = await resp.json()
        if (!cancelled && resp.ok) setItems(json.items || [])
      } catch {}
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!validName || !validPrice) {
      error("Preencha os campos corretamente.")
      return
    }
    setCreating(true)
    const optimistic: Service = { id: `tmp-${Date.now()}`, name: name.trim(), description: desc || null, price_cents: Number(price), is_active: true, created_at: new Date().toISOString() }
    setItems((prev) => [optimistic, ...prev])
    try {
      const resp = await fetch(`/api/services`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: optimistic.name, description: optimistic.description, price_cents: optimistic.price_cents }) })
      const json = await resp.json()
      if (!resp.ok || !json?.ok) throw new Error("fail")
      success("Serviço criado.")
      // reload curto
      const list = await fetch(`/api/services?page=1&pageSize=20&is_active=true`, { cache: "no-store" })
      const j2 = await list.json()
      setItems(j2.items || [])
      setName("")
      setPrice("0")
      setDesc("")
    } catch {
      error("Falha ao criar serviço.")
      setItems((prev) => prev.filter((x) => !x.id.startsWith("tmp-")))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-sm text-muted-foreground" aria-label="Breadcrumb"><ol className="flex items-center gap-2"><li><a href="/app" className="underline">Início</a></li><li aria-hidden> / </li><li aria-current="page">Serviços</li></ol></nav>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Serviços</h1>

      <form onSubmit={onCreate} className="mb-6 grid gap-3 md:grid-cols-4" aria-describedby="new-help">
        <div className="md:col-span-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" value={name} onChange={(e)=>setName(e.target.value)} aria-invalid={!validName} />
        </div>
        <div>
          <Label htmlFor="price">Preço (centavos)</Label>
          <Input id="price" value={price} onChange={(e)=>setPrice(e.target.value)} inputMode="numeric" pattern="^[0-9]+$" aria-invalid={!validPrice} />
        </div>
        <div className="md:col-span-4">
          <Label htmlFor="desc">Descrição</Label>
          <Input id="desc" value={desc} onChange={(e)=>setDesc(e.target.value)} />
        </div>
        <div>
          <Button type="submit" disabled={creating || !validName || !validPrice} aria-label="Criar serviço">{creating ? "Criando..." : "Novo serviço"}</Button>
        </div>
        <p id="new-help" className="text-xs text-muted-foreground md:col-span-4">RBAC: somente administradores/gestores podem criar.</p>
      </form>

      {loading ? (
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado.</p>
      ) : (
        <ul className="divide-y">
          {items.map((s) => (
            <li key={s.id} className="py-3 grid grid-cols-6 gap-2 items-center">
              <div className="col-span-2">
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.description || "—"}</p>
              </div>
              <div className="text-sm tabular-nums">R$ {(s.price_cents/100).toFixed(2)}</div>
              <div className="text-xs">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" defaultChecked={s.is_active} onChange={async (e)=>{
                    const prev = items
                    setItems(prev=>prev.map(x=>x.id===s.id?{...x,is_active:e.target.checked}:x))
                    try {
                      const resp = await fetch(`/api/services/${s.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: e.target.checked }) })
                      if (!resp.ok) throw new Error('fail')
                    } catch {
                      setItems(prev)
                    }
                  }} /> Ativo
                </label>
              </div>
              <div className="text-right col-span-2">
                <Button size="sm" variant="outline" onClick={()=>{ setEditing(s); setName(s.name); setDesc(s.description||''); setPrice(String(s.price_cents)) }}>Editar</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <form className="fixed inset-0 bg-black/40 flex items-center justify-center" onSubmit={async (e)=>{
          e.preventDefault()
          if (!validName || !validPrice) return
          const optimistic = { ...editing, name: name.trim(), description: desc || null, price_cents: Number(price) }
          const prev = items
          setItems(prev=>prev.map(x=>x.id===editing.id?optimistic:x))
          try {
            const resp = await fetch(`/api/services/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: optimistic.name, description: optimistic.description, price_cents: optimistic.price_cents }) })
            if (!resp.ok) throw new Error('fail')
            success('Serviço atualizado.')
            setEditing(null)
          } catch {
            error('Falha ao atualizar serviço.')
            setItems(prev)
          }
        }}>
          <div className="bg-background rounded-md p-4 w-full max-w-md space-y-3">
            <h2 className="text-lg font-medium">Editar serviço</h2>
            <div>
              <label className="text-sm">Nome</label>
              <Input value={name} onChange={(e)=>setName(e.target.value)} aria-invalid={!validName} />
            </div>
            <div>
              <label className="text-sm">Preço (centavos)</label>
              <Input value={price} onChange={(e)=>setPrice(e.target.value)} inputMode="numeric" pattern="^[0-9]+$" aria-invalid={!validPrice} />
            </div>
            <div>
              <label className="text-sm">Descrição</label>
              <Input value={desc} onChange={(e)=>setDesc(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={()=>setEditing(null)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}


