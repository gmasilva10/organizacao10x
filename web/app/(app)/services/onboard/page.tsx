"use client"

import Link from "next/link"
import KanbanPage from "@/app/app/kanban/page"

export default function ServicesOnboardPage() {
  return (
    <div className="container py-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/app/services" className="hover:underline">Serviços</Link>
        <span>/</span>
        <span className="text-foreground">Onboarding</span>
      </div>
      <KanbanPage />
    </div>
  )
}


