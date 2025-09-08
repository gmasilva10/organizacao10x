"use client"

import Link from "next/link";
import { useFeature } from "@/lib/feature-flags";

export default function ServicesPage() {
  const { enabled: occurrencesEnabled } = useFeature("features.occurrences")
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
        <p className="text-muted-foreground mt-2">Estruture seus serviços como Planos, Onboarding e Relacionamento.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/app/services/plans" className="block rounded-lg border bg-card p-6 hover:bg-accent">
          <h3 className="font-semibold mb-1">Planos</h3>
          <p className="text-sm text-muted-foreground">Gerencie serviços, planos e opções.</p>
        </Link>
        <Link href="/app/services/onboard" className="block rounded-lg border bg-card p-6 hover:bg-accent">
          <h3 className="font-semibold mb-1">Onboarding</h3>
          <p className="text-sm text-muted-foreground">Acesse o Kanban de onboarding dentro de Serviços.</p>
        </Link>
        <Link href="/app/services/relationship" className="block rounded-lg border bg-card p-6 hover:bg-accent">
          <h3 className="font-semibold mb-1">Relacionamento</h3>
          <p className="text-sm text-muted-foreground">Templates e mensagens relacionadas a serviços.</p>
        </Link>
        {occurrencesEnabled && (
          <Link href="/app/services/occurrences" className="block rounded-lg border bg-card p-6 hover:bg-accent">
            <h3 className="font-semibold mb-1">Ocorrências</h3>
            <p className="text-sm text-muted-foreground">Gerencie grupos e tipos de ocorrências dos alunos.</p>
          </Link>
        )}
      </div>
    </div>
  );
}
