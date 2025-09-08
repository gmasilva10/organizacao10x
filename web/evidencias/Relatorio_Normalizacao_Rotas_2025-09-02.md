## Auditoria de Rotas e Normalização (2025-09-02)

### Árvore (3 níveis) sob `web/app`

```
web/app/
  layout.tsx
  page.tsx
  api/**              ← APIs corretas sob app/api
  app/                ← DUPLICADO (deve ser removido após normalização)
    layout.tsx
    kanban/page.tsx
    onboarding/(history)/page.tsx
    services/page.tsx
    ...
  (app)/              ← Route group autenticado
    services/page.tsx
    onboarding/page.tsx
    team/page.tsx
    settings/(roles|users)/page.tsx
    profile/page.tsx
```

Observação: existe `app/` e `(app)/` coexistindo; isso cria ambiguidade. Manteremos um único app raiz com um único route group autenticado `(app)`.

### Mapa de Rotas (Atual → Canônico)

| Rota | Fonte atual | Fonte proposta |
|------|-------------|----------------|
| /app/services | `web/app/app/services/page.tsx` | `web/app/(app)/services/page.tsx` |
| /app/services/onboard | inexistente (404) | `web/app/(app)/services/onboard/page.tsx` |
| /app/services/plans | inexistente | `web/app/(app)/services/plans/page.tsx` (placeholder) |
| /app/services/relationship | inexistente | `web/app/(app)/services/relationship/page.tsx` (placeholder/redirect) |
| /app/onboarding | `web/app/app/onboarding/page.tsx` | `web/app/app/onboarding/page.tsx` (manter por ora; alvo futuro `(app)/onboarding`) |
| /app/kanban | `web/app/app/kanban/page.tsx` | `web/app/app/kanban/page.tsx` (mantido) |

### Duplicidades detectadas

- Diretórios `web/app/app/**` e `web/app/(app)/**` com páginas de nível semelhante (`services`, `onboarding`, `team`, `settings`).
- Um layout em `web/app/layout.tsx` e outro em `web/app/app/layout.tsx` (deve existir apenas um por nível).

### Layouts

- Layout raiz válido: `web/app/layout.tsx`.
- Layout duplicado: `web/app/app/layout.tsx` (remover na normalização final).

### APIs

- Confirmado: todas as rotas de API residem sob `web/app/api/**` (kanban, students, settings, relationship, services). Não há API dentro de outro `app` fora deste escopo.

### Conclusão e Estrutura Canônica

Adotar estrutura única:

```
web/app/
  (app)/
    services/
      page.tsx
      onboard/page.tsx
      plans/page.tsx
      relationship/page.tsx
    onboarding/page.tsx
    students/page.tsx
    profile/page.tsx
    team/**
    settings/**
  api/**
```

Passos de normalização (fase 1 - mínima, aplicada hoje):
1. Restaurar `services/page.tsx` como container de abas/links (feito).
2. Criar `services/onboard/page.tsx` consumindo os mesmos endpoints do Kanban (sem backend novo).

Passos de normalização (fase 2 - pós-aprovação GP/QA):
1. Mover fontes úteis de `web/app/app/**` para `web/app/(app)/**` e remover `web/app/app/**`.
2. Garantir único `layout.tsx` por nível.

Build alvo: sem conflitos de rota/duplicidade; sem `NextResponse` duplicado.


