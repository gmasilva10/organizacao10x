"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"

export default function PlayerAccountPage() {
  const router = useRouter()
  const { success, error } = useToast()
  const [organizationName, setOrganizationName] = useState("")
  const [docId, setDocId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errMsg, setErrMsg] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrMsg("")
    const name = organizationName.trim()
    if (name.length < 2) {
      setErrMsg("Nome deve ter pelo menos 2 caracteres.")
      return
    }
    setSubmitting(true)
    try {
      const resp = await fetch("/api/account/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_name: name, doc_id: docId || null, plan: "basic" }),
      })
      const json = await resp.json()
      if (!resp.ok || !json?.ok) {
        if (resp.status === 409) {
          setErrMsg("Já existe uma organização com esse nome.")
          return
        }
        if (resp.status === 400) {
          setErrMsg("Nome deve ter pelo menos 2 caracteres.")
          return
        }
        throw new Error("unexpected")
      }
      success("Organização criada.")
      router.replace("/app")
    } catch {
      error("Não foi possível criar a organização. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <a href="#form" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md">Pular para o conteúdo</a>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Organização (Player)</h1>
        <p className="text-muted-foreground mt-1">Crie sua organização para convidar equipe, cadastrar alunos e usar o Kanban.</p>
      </header>
      <form id="form" onSubmit={onSubmit} noValidate className="space-y-6">
        <div>
          <Label htmlFor="organization_name">Nome da organização</Label>
          <Input
            id="organization_name"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="Ex.: Academia Exemplo"
            aria-invalid={!!errMsg}
            aria-describedby={errMsg ? "org-error" : "org-help"}
          />
          <p id="org-help" className="text-xs text-muted-foreground mt-1">Mínimo de 2 caracteres.</p>
          {errMsg ? (
            <p id="org-error" className="text-xs text-red-600 mt-1">{errMsg}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="doc_id">Documento (opcional)</Label>
          <Input id="doc_id" value={docId} onChange={(e) => setDocId(e.target.value)} placeholder="CNPJ ou ID interno (opcional)" />
        </div>
        <div>
          <Label htmlFor="plan">Plano</Label>
          <Input id="plan" value="basic" readOnly aria-readonly className="bg-muted/50" />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={submitting} aria-label="Criar organização">
            {submitting ? "Criando..." : "Criar organização"}
          </Button>
        </div>
      </form>
    </div>
  )
}


