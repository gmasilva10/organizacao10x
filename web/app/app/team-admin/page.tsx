import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TeamAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Admin</h1>
        <p className="text-muted-foreground mt-2">
          Administração da equipe e treinadores
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Funcionalidade Temporariamente Indisponível</h2>
          <p className="text-muted-foreground">
            O módulo Team Admin está sendo reorganizado como parte da nova estrutura do App Shell. 
            A funcionalidade anterior está temporariamente indisponível enquanto é integrada ao novo layout.
          </p>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/app/students">Ir para Alunos</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/app/onboarding">Ir para Onboarding</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h3 className="font-medium mb-2">Status da migração:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>✓ Nova estrutura de navegação implementada</li>
          <li>⚠ Migração do módulo Team Admin em andamento</li>
          <li>⏳ Integração com novo layout pendente</li>
        </ul>
      </div>
    </div>
  )
}
