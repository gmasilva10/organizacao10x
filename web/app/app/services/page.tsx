export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seu catálogo de serviços oferecidos
        </p>
      </div>

      <div className="bg-card border rounded-lg p-8 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Em breve</h3>
            <p className="text-muted-foreground">
              O módulo de Serviços está em desenvolvimento e será disponibilizado em breve.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="font-medium mb-2">Funcionalidades planejadas:</p>
            <ul className="text-left space-y-1 list-disc list-inside">
              <li>Catálogo de serviços</li>
              <li>Gestão de preços</li>
              <li>Integração com onboarding</li>
              <li>Histórico de vendas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
