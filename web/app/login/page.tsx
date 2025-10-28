"use client"

import { useEffect, Suspense } from "react"
import { useLoginUI } from "@/components/LoginUIContext"
import { LoginDrawer } from "@/components/LoginDrawer"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function LoginContent() {
  const { open, setOpen } = useLoginUI()

  useEffect(() => {
    // Abre automaticamente o drawer ao acessar /login
    if (!open) setOpen(true)
  }, [open, setOpen])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-muted-foreground">Acesse sua conta para continuar</p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/">Voltar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup?plan=basic">Criar conta</Link>
          </Button>
        </div>
      </div>
      {/* O LoginDrawer gerencia seu próprio portal/conteúdo */}
      <LoginDrawer />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginContent />
    </Suspense>
  )
}
