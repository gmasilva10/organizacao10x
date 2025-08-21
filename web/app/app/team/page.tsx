"use client"

import { useState, useRef } from "react"
import { UpgradeModal } from "@/components/UpgradeModal"
import { useLimit } from "@/lib/feature-flags"
import { useToast } from "@/components/ui/toast"

export default function TeamAdminPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { limit: trainersLimit } = useLimit("limits.trainers")
  const toast = useToast()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch("/api/users/trainers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 200) {
        console.log("[QA] create_trainer: success")
        toast.success("Treinador adicionado com sucesso.")
        setEmail("")
        inputRef.current?.focus()
      } else if (res.status === 422) {
        console.log("[QA] limit.hit details:", data?.details)
        setShowUpgrade(true)
        toast.info("Limite do plano atingido.")
      } else if (res.status === 403) {
        toast.error("Você não tem permissão para esta ação.")
      } else {
        toast.error(`Erro inesperado. Tente novamente. (${res.status})`)
      }
    } catch {
      toast.error("Erro inesperado. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title="Limite do seu plano foi atingido"
        description="Para adicionar mais treinadores, faça upgrade para o plano Enterprise."
        primaryHref="/contact"
        secondaryHref="/planos"
      />
      <div className="mx-auto max-w-lg rounded-xl border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Equipe</h1>
        <p className="mt-1 text-sm text-muted-foreground">Adicione treinadores à sua equipe. Limite do plano: {trainersLimit ?? "-"}.</p>
        <form onSubmit={onSubmit} className="mt-6 flex gap-3">
          <input
            ref={inputRef}
            type="email"
            required
            placeholder="email do treinador"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            aria-label="E-mail do treinador"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            aria-busy={loading}
          >
            {loading ? "Adicionando…" : "Adicionar"}
          </button>
        </form>
      </div>
    </div>
  )
}


