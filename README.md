Organizacao10x — baseline

Visão
- Plataforma Personal Global (MVP): Students V2 + Onboarding/Kanban persistente, com governança em `web/Estrutura` e gate de qualidade via checklist.

Como rodar (Node 20+)
- Instalar deps (root, usando workspaces):
  - `npm install`
- Desenvolvimento (Next.js):
  - `npm run dev:web`
- Build de produção:
  - `npm run build:web`
- Lint:
  - `npm run lint:web`

Estrutura principal
- `web/` Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- `web/app/(app)/onboarding` Kanban oficial (board + sidebar árvore + histórico)
- `web/app/api/*` Rotas server-first (RBAC/limits/telemetria)
- `web/Estrutura/` Governança (Atividades, Pendências, Erros, Checklist, Planos)

Qualidade (gate)
- Build e Lint verdes antes de qualquer entrega
- Evidências em JSON/prints em `web/Estrutura/`
- Checklist obrigatório: `web/Estrutura/Checklist_Release_Validation.txt`

CI (GitHub Actions)
- Workflow em `.github/workflows/ci.yml` roda install + build + lint no push/PR para `main`.


