Organizacao10x — baseline

[![Node CI](https://github.com/gmasilva10/organizacao10x/actions/workflows/ci.yml/badge.svg)](https://github.com/gmasilva10/organizacao10x/actions/workflows/ci.yml)

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
- `web/Estrutura/` Governança e documentação técnica (organizada por categoria)
  - `Padrao/` Padrões de desenvolvimento e UI/UX
  - `Pendencias/` Tarefas e atividades
  - `Relatorios/` Auditorias, migrações e validações
  - `Checklists/` Checklists de validação
  - Ver `web/Estrutura/README.md` para estrutura completa

Qualidade (gate)
- Build e Lint verdes antes de qualquer entrega
- Evidências em JSON/prints em `web/Estrutura/`
- Checklist obrigatório: `web/Estrutura/Checklists/Checklist_Release_Validation.txt`

CI (GitHub Actions)
- Workflow em `.github/workflows/ci.yml` roda install + build + lint no push/PR para `main`.




