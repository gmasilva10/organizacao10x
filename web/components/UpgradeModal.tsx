"use client"

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  primaryHref?: string
  secondaryHref?: string
}

export function UpgradeModal({ open, onClose, title, description, primaryHref, secondaryHref }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="upgrade-title" aria-describedby="upgrade-desc">
      <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg ring-1 ring-white/10" role="document">
        <h2 id="upgrade-title" className="text-xl font-semibold text-foreground">{title ?? "Limite do seu plano foi atingido"}</h2>
        <p id="upgrade-desc" className="mt-2 text-sm text-muted-foreground">
          {description ?? "Para adicionar mais treinadores, faça upgrade para o plano Enterprise."}
        </p>
        <div className="mt-6 flex items-center justify-between gap-3">
          <a href={secondaryHref ?? "/planos"} className="text-sm text-muted-foreground hover:underline">
            Ver planos
          </a>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-foreground/80 hover:bg-muted">
              Fechar
            </button>
            <a
              href={primaryHref ?? "/contact"}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:brightness-110"
            >
              Falar com o time
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}


