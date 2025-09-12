"use client"

import Link from "next/link";
import {
  CreditCard,
  Users,
  Heart,
  AlertTriangle,
  FileText
} from "lucide-react";

export default function ServicesPage() {
  // Hardcode para evitar delay na renderização
  const occurrencesEnabled = true
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
        <p className="text-muted-foreground mt-2">Estruture seus serviços como Planos, Onboarding e Relacionamento.</p>
      </div>

      {/* Linha 1: Planos, Onboarding, Relacionamento, Ocorrências */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/app/services/plans" className="block rounded-lg border bg-card p-6 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">Planos</h3>
          </div>
          <p className="text-sm text-muted-foreground">Gerencie serviços, planos e opções.</p>
        </Link>
        
        <Link href="/app/services/onboard" className="block rounded-lg border bg-card p-6 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">Onboarding</h3>
          </div>
          <p className="text-sm text-muted-foreground">Acesse o Kanban de onboarding dentro de Serviços.</p>
        </Link>
        
        <Link href="/app/services/relationship" className="block rounded-lg border bg-card p-6 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-pink-100 text-pink-600">
              <Heart className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">Relacionamento</h3>
          </div>
          <p className="text-sm text-muted-foreground">Templates e mensagens relacionadas a serviços.</p>
        </Link>
        
        {occurrencesEnabled && (
          <Link href="/app/services/occurrences" className="block rounded-lg border bg-card p-6 hover:bg-accent transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">Ocorrências</h3>
            </div>
            <p className="text-sm text-muted-foreground">Gerencie grupos e tipos de ocorrências dos alunos.</p>
          </Link>
        )}
      </div>

      {/* Linha 2: Anamnese */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/app/services/anamnesis" className="block rounded-lg border bg-card p-6 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">Anamnese</h3>
          </div>
          <p className="text-sm text-muted-foreground">Configure templates de perguntas e diretrizes de treino.</p>
        </Link>
      </div>
    </div>
  );
}
