"use client"

export default function RelationshipPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-semibold">Relacionamento</h1>
      <p className="mt-2 text-sm text-muted-foreground">Módulo placeholder para histórico de mensagens e templates.</p>
      <div className="mt-6 rounded-md border p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Histórico de mensagens</h2>
          <a href="/app/relationship/templates" className="rounded-md border px-3 py-1 text-sm">Gerenciar templates</a>
        </div>
        <div className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</div>
      </div>
    </div>
  )
}


