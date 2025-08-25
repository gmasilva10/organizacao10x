"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"

type Membership = { organization_id: string; organization_name: string; role: string }

export default function ProfilePage() {
  const { success, error } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [errMsg, setErrMsg] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const resp = await fetch("/api/profile", { cache: "no-store" })
        const json = await resp.json()
        if (!cancelled && resp.ok && json?.ok) {
          setFullName(json.profile?.full_name || "")
          setEmail(json.profile?.email || "")
          setMemberships(Array.isArray(json.profile?.memberships) ? json.profile.memberships : [])
        }
      } catch {}
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrMsg("")
    const v = fullName.trim()
    if (v.length < 2) {
      setErrMsg("Nome deve ter pelo menos 2 caracteres.")
      return
    }
    setSaving(true)
    try {
      const resp = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: v }),
      })
      const json = await resp.json()
      if (!resp.ok || !json?.ok) {
        if (resp.status === 400) {
          setErrMsg("Nome deve ter pelo menos 2 caracteres.")
          return
        }
        throw new Error("unexpected")
      }
      success("Perfil atualizado.")
    } catch {
      error("Não foi possível atualizar o perfil. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <a href="#form" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md">Pular para o conteúdo</a>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie seu nome e visualize suas organizações.</p>
      </header>
      {loading ? (
        <div role="status" aria-live="polite" className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-10 bg-muted rounded" />
        </div>
      ) : (
        <form id="form" onSubmit={onSubmit} noValidate className="space-y-6">
          <div>
            <Label htmlFor="full_name">Nome completo</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              aria-invalid={!!errMsg}
              aria-describedby={errMsg ? "name-error" : "name-help"}
            />
            <p id="name-help" className="text-xs text-muted-foreground mt-1">Mínimo de 2 caracteres.</p>
            {errMsg ? <p id="name-error" className="text-xs text-red-600 mt-1">{errMsg}</p> : null}
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={email} readOnly aria-readonly className="bg-muted/50" />
          </div>
          <div>
            <Label>Organizações</Label>
            <ul className="mt-2 space-y-2">
              {memberships.length === 0 ? (
                <li className="text-sm text-muted-foreground">Nenhuma organização</li>
              ) : (
                memberships.map((m) => (
                  <li key={m.organization_id} className="text-sm">
                    {m.organization_name} — <span className="text-muted-foreground">{m.role}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="flex justify-end gap-2">
            <Link href="/" className="text-sm underline" aria-label="Alterar senha (fluxo do provedor)">Alterar senha</Link>
            <Button type="submit" disabled={saving} aria-label="Salvar alterações">{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      )}
    </div>
  )
}


