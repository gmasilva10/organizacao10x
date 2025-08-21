export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Configure suas preferências do sistema
        </p>
      </div>

      <div className="bg-card border rounded-lg p-8 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Em breve</h3>
            <p className="text-muted-foreground">
              O módulo de Configurações está em desenvolvimento e será disponibilizado em breve.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="font-medium mb-2">Funcionalidades planejadas:</p>
            <ul className="text-left space-y-1 list-disc list-inside">
              <li>Configurações de conta</li>
              <li>Preferências de notificação</li>
              <li>Configurações de segurança</li>
              <li>Personalização da interface</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
