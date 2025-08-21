"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"

export default function PersonalAccountPage() {
  const router = useRouter()
  const { success, error } = useToast()
  const supabase = useMemo(() => createClient(), [])

  const [email, setEmail] = useState<string>("")
  const [fullName, setFullName] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [errMsg, setErrMsg] = useState<string>("")

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (!mounted) return
      setEmail(data.user?.email ?? "")
    })()
    return () => {
      mounted = false
    }
  }, [supabase])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrMsg("")
    const name = fullName.trim()
    if (name.length < 2) {
      setErrMsg("Nome deve ter pelo menos 2 caracteres.")
      return
    }
    setSubmitting(true)
    try {
      const resp = await fetch("/api/account/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name }),
      })
      const json = await resp.json()
      if (!resp.ok || !json?.ok) {
        if (resp.status === 400) {
          setErrMsg("Nome deve ter pelo menos 2 caracteres.")
          return
        }
        throw new Error("unexpected")
      }
      success("Conta pessoal configurada.")
      router.replace("/app")
    } catch {
      error("Não foi possível salvar. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <a href="#form" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md">Pular para o conteúdo</a>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Conta Pessoal</h1>
        <p className="text-muted-foreground mt-1">Complete seu perfil para começar a usar o app.</p>
      </header>
      <form id="form" onSubmit={onSubmit} noValidate className="space-y-6" aria-describedby={errMsg ? "form-error" : undefined}>
        <div>
          <Label htmlFor="full_name">Nome completo</Label>
          <Input
            id="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ex.: Maria Souza"
            aria-invalid={!!errMsg}
            aria-describedby={errMsg ? "full_name-error" : "full_name-help"}
          />
          <p id="full_name-help" className="text-xs text-muted-foreground mt-1">Mínimo de 2 caracteres.</p>
          {errMsg ? (
            <p id="full_name-error" className="text-xs text-red-600 mt-1">{errMsg}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" value={email} readOnly aria-readonly className="bg-muted/50" />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={submitting} aria-label="Salvar e continuar">
            {submitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  )
}


