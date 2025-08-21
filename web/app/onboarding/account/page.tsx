"use client"

import Link from "next/link"
import { Users, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useEffect } from "react"

export default function AccountWizardPage() {
  useEffect(() => {
    // Prefers reduced motion: handled via global styles
  }, [])

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <a href="#wizard" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md">Pular para o conteúdo</a>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configurar Conta</h1>
        <p className="text-muted-foreground mt-2">Escolha como deseja começar a usar a plataforma.</p>
      </header>

      <section id="wizard" role="region" aria-labelledby="wizard-title">
        <h2 id="wizard-title" className="sr-only">Escolha do tipo de conta</h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card: Conta Pessoal */}
          <article className="group relative rounded-xl border bg-card p-6 transition duration-200 will-change-transform hover:shadow-md focus-within:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Users className="h-6 w-6" aria-hidden="true" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Conta Pessoal</TooltipContent>
                </Tooltip>
                <h3 className="text-xl font-semibold">Conta Pessoal (Personal)</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Crie seu perfil para começar a usar o app. Você poderá criar sua organização depois.</p>
            <div className="flex justify-end">
              <Button asChild aria-label="Continuar como pessoal">
                <Link href="/onboarding/account/personal">Continuar como pessoal</Link>
              </Button>
            </div>
          </article>

          {/* Card: Organização (Player) */}
          <article className="group relative rounded-xl border bg-card p-6 transition duration-200 will-change-transform hover:shadow-md focus-within:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Building2 className="h-6 w-6" aria-hidden="true" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Organização</TooltipContent>
                </Tooltip>
                <h3 className="text-xl font-semibold">Organização (Player)</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Crie sua organização para convidar equipe, cadastrar alunos e usar o Kanban.</p>
            <div className="flex justify-end">
              <Button asChild aria-label="Criar organização agora">
                <Link href="/onboarding/account/player">Criar organização agora</Link>
              </Button>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}


