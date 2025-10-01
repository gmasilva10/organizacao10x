# Relatório de Qualidade e Auditoria – Organizacao10x

Data: 2025-09-24
Escopo: Revisão geral de estrutura, qualidade de código, duplicações, código morto, segurança, pendências e plano de ação.

---

## Resumo Executivo

- Principais riscos identificados:
  - Segredos e tokens versionados em `.env.local` (raiz e `web/.env.local`) e hardcoded em código (ex.: `web/app/api/wa/test-zapi/route.ts`, `web/check_tables.js`, `web/Estrutura/Credenciais_QA_Supabase.txt`).
  - Artefatos de build versionados (`web/.next`, `web/coverage`, `web/lighthouse-report.json`, `web/tsconfig.tsbuildinfo`).
  - Estrutura duplicada/inconsistente: `web/app/(app)` vs `web/app/app`, `relationship` vs `relacionamento`, `anamnese` vs `anamnesis`, `web/web/*` (aninhamento redundante), componentes duplicados (`EmptyState.tsx` e `empty-state.tsx`).
  - Endpoints de debug perigosos acessíveis sem guarda adequada (ex.: `web/app/api/debug/execute-sql/route.ts`, `web/app/api/wa/test-zapi/route.ts`).
  - Uso excessivo de `any` e logs (`console.log`) em rotas e páginas.
  - Testes unitários desatualizados/apontando para fontes inexistentes (ex.: `presentational/confirm-dialog-view`).
  - Arquivos estranhos na raiz (provável lixo de shell) e planilhas/evidências misturadas ao produto.

- Recomendações prioritárias (P0/P1):
  1) Remover segredos do VCS e girar chaves no Supabase/Z-API imediatamente.
  2) Remover artefatos de build e configurar `.gitignore`/limpeza do histórico.
  3) Consolidar estrutura de pastas (eliminar diretórios e nomes duplicados/inconsistentes).
  4) Desativar/guardar endpoints de debug e remover tokens hardcoded.
  5) Endurecer lint (no-console, no-explicit-any) e padronizar logs.
  6) Corrigir testes e referências quebradas.

---

## Mapa da Estrutura (alto nível)

- Raiz
  - `web/` Next.js App Router + TS + Tailwind + shadcn/ui
  - `supabase/migrations/` – scripts SQL (há duplicações/variações p0/p1)
  - `__tests__/` – unitários (vitest) – alguns desatualizados
  - `testsprite_tests/` – artefatos/planos de teste manuais e temporários
  - `Planilha/` – arquivos .xlsx (deveriam estar em `docs/` ou fora do repo)
  - Arquivos indevidos: `web/.next/`, `web/coverage/`, `web/lighthouse-report.json`, arquivos com nomes corruptos na raiz, `.env.local` (segredos)

- `web/app/`
  - `app/` (dashboard/aplicação logada)
  - `(app)/` (grupo de rotas duplicado)
  - `api/` (várias rotas – mistura de pt/en e debug)
  - `login`, `login-simple`, `signup`, `examples`, `test-app`, `p/anamnese/[token]`

- `web/components/`
  - `ui/` (base shadcn) – possui duplicatas conceituais (EmptyState)
  - `students/`, `relationship/`, `anamnese/`, `anamnesis/`, `providers/`, `shared/`

- `web/utils/` e `web/src/server/` – wrappers Supabase e Z-API

---

## Sinais de Risco e Problemas

1) Segurança (Crítico)
   - Segredos em VCS:
     - Raiz: `.env.local` com `SUPABASE_SERVICE_ROLE_KEY`, `ZAPI_*`.
     - `web/.env.local` idem.
     - `web/Estrutura/Credenciais_QA_Supabase.txt` com chaves reais.
     - Código com tokens: `web/app/api/wa/test-zapi/route.ts` (tokens hardcoded), `web/check_tables.js` (URL/anon key públicas).
   - Endpoints perigosos:
     - `web/app/api/debug/execute-sql/route.ts` executa SQL via RPC sem verificação robusta de role/ambiente.
     - `web/debug-migration.html` expõe operações administrativas via frontend.

2) Higiene de Repositório
   - Build/coverage versionados: `web/.next`, `web/coverage`, `web/lighthouse-report.json`, `web/tsconfig.tsbuildinfo`.
   - Arquivos “lixo”/corrompidos na raiz: ex. nomes iniciando com `o ? Select-String ...`, `tatus`, `u�rios an�nimos`.
   - Pastas com conteúdo operacional/externo dentro do produto: `Planilha/`, `evidencias/`, `web/web/evidencias/`.

3) Estrutura e Consistência
   - Duplicidade de grupos/rotas: `web/app/(app)` vs `web/app/app`.
   - Nomenclatura pt/en misturada para mesmas features: `relationship` vs `relacionamento`, `anamnese` vs `anamnesis`.
   - Diretório redundante: `web/web/*`.
   - Componentes duplicados: `web/components/ui/EmptyState.tsx` (default) e `web/components/ui/empty-state.tsx` (named export). Em Windows/macOS isso conflita.
   - Multiversões não usadas: `StudentEditTabsV2..V5` coexistem com `V6`.

4) Qualidade de Código
   - Uso extensivo de `any` (ex.: `web/app/students/[id]/anamnese/[versionId]/page.tsx`, `web/app/p/anamnese/[token]/page.tsx`, rotas `api/occurrences/*`).
   - `console.log`/`console.warn` em código de produção (ex.: `web/middleware.ts`, `web/utils/supabase/server.ts`, diversas rotas `api`).
   - Validação inconsistente: parte das rotas usa `zod`, outras não.
   - Testes unitários referenciam fonte inexistente: `presentational/confirm-dialog-view` (somente coverage HTML existe).
   - Páginas/arquivos de debug: `web/app/app/students/test-simple.tsx`.

5) Migrations
   - Duplicidades/variações (`his01_audit_log.sql` e `his01_audit_log_p0.sql`), nomenclaturas mistas (com/sem prefixo data), falta de sumário/ordenação canônica.

---

## Notas por Módulo (0–10) e Recomendações

- App (logado) – `web/app/app` – Nota: 7/10
  - Pontos bons: organização por áreas (students, services, team), UI consistente.
  - Melhorias: eliminar páginas de teste (`test-simple.tsx`), remover logs, garantir tipagem forte (evitar `any`), padronizar imports de `EmptyState`.

- API Routes – `web/app/api` – Nota: 3/10
  - Pontos críticos: endpoints de debug sem guardas, tokens hardcoded (`wa/test-zapi`), validação parcial, logs verbosos, possíveis spoilers de infra.
  - Melhorias: exigir autenticação/role para debug, remover rotas perigosas do deploy, validar entrada com `zod` em todas as rotas, sanitizar logs.

- UI Base – `web/components/ui` – Nota: 6/10
  - Pontos bons: adoção shadcn/ui, boa cobertura de componentes.
  - Problemas: duplicação `EmptyState.tsx` vs `empty-state.tsx` (quebra de consistência e risco cross-OS).
  - Melhorias: unificar em um único componente (lowercase), corrigir imports.

- Students (componentes) – `web/components/students` – Nota: 6.5/10
  - Pontos bons: evolução incremental (V2…V6), funcionalidades ricas.
  - Problemas: versões antigas V2–V5 aparentam não ser usadas.
  - Melhorias: remover versões antigas após confirmação, extrair lógicas pesadas para hooks/utilitários tipados, garantir `no-explicit-any`.

- Anamnese/Anamnesis – `web/components/anamnese`, `web/components/anamnesis`, `web/app/p/anamnese` – Nota: 7/10
  - Pontos bons: feature completa (templates, preview, token público).
  - Problemas: nomenclatura inconsistente (pt/en), `any` em páginas de token.
  - Melhorias: consolidar naming (uma língua), tipar modelos (Zod + TS types compartilhados).

- Relationship/Relacionamento – `web/app/app/(relationship|relacionamento)` e `web/app/api/(relationship|relacionamento)` – Nota: 6/10
  - Pontos bons: APIs diversas (mensagens, logs, tasks, analytics).
  - Problemas: duplicidade pt/en de rotas e páginas; debug pages.
  - Melhorias: padronizar para um idioma, mover debug para ambiente isolado.

- Supabase Utils – `web/utils/supabase/*` – Nota: 5/10
  - Pontos bons: wrappers SSR/admin, cookies integrados.
  - Problemas: logs de variáveis de ambiente, poucas garantias de não-vazamento em prod.
  - Melhorias: remover logs sensíveis, encapsular logger, fallback seguro para env ausente.

- Z-API Server – `web/src/server/zapi.ts` – Nota: 5/10
  - Pontos bons: timeouts/retries, headers definidos.
  - Problemas: logs com payloads e URLs; dependência de env não verificada em build.
  - Melhorias: mascarar dados, validar envs no startup, centralizar client.

- Middleware – `web/middleware.ts` – Nota: 4/10
  - Problemas: “TEMPORÁRIO” definindo cookie de organização padrão em produção; logs no middleware; redireções legadas.
  - Melhorias: remover temporários, garantir resolução de organização server-side com fallback seguro, evitar side effects de debug.

- Migrations – `supabase/migrations` – Nota: 6/10
  - Pontos bons: cobertura de domínios (kanban, services, occurrences, RBAC).
  - Problemas: arquivos duplicados/variações p0/p1; nomenclatura inconsistente.
  - Melhorias: padronizar `YYYYMMDD__descricao.sql`, consolidar duplicados, manter CHANGELOG de migrations.

- Testes e Qualidade – `__tests__`, `web/.github/workflows/*`, `web/coverage` – Nota: 4/10
  - Pontos bons: há vitest, playwright configurado, coverage produzido.
  - Problemas: testes unitários referenciam fonte inexistente; coverage e .next versionados; lacunas de validação.
  - Melhorias: corrigir imports (ou restaurar componente), validar caminho `@/components/presentational/*`, retirar coverage do repo, ampliar testes para APIs com cenários de erro.

- Governança/Documentos – `web/Estrutura/*` – Nota: 8/10
  - Pontos bons: documentação rica (atividades, pendências, evidências, checklists, métricas de performance).
  - Problemas: mistura de credenciais com documentação.
  - Melhorias: mover credenciais para cofre (1Password/Vault), separar `docs/` do produto, versionar apenas artefatos não sensíveis.

---

## Duplicações, Código Morto e Inconsistências

- Diretórios/arquivos duplicados/mal posicionados:
  - `web/app/(app)` e `web/app/app` coexistem. Decidir por UMA estratégia (recomendado manter `(app)` como “grupo” padrão do App Router e migrar conteúdo de `app/` para lá).
  - `web/components/ui/EmptyState.tsx` e `web/components/ui/empty-state.tsx` – manter apenas `empty-state.tsx` e ajustar imports.
  - `web/app/app/relationship` vs `web/app/app/relacionamento` – escolher um idioma (pt-BR ou en) para o domínio e refatorar.
  - `web/components/anamnese` vs `web/components/anamnesis` – mesmo ponto de padronização.
  - `web/web/evidencias` – mover para `web/evidencias` ou `docs/`.
  - `web/components/students/StudentEditTabsV2..V5` – candidatas a remoção se desreferenciadas (V6 em uso).

- Artefatos indevidos (versionados por engano):
  - `web/.next/`, `web/coverage/`, `web/lighthouse-report.json`, `web/tsconfig.tsbuildinfo`.
  - Arquivos “lixo” na raiz com nomes quebrados (ex.: `o ? Select-String ...`, `tatus`).

- Código de debug/dev deixado no produto:
  - `web/app/api/wa/test-zapi/route.ts`, `web/app/app/students/test-simple.tsx`, `web/debug-migration.html`.

---

## Pendências e Atividades

- Dos arquivos de governança (`web/Estrutura/Pendencias*.txt`, `Atividades.txt`):
  - Backlog vivo com itens P0–P3 (OAuth Google, SEO metadata, ícones/ilustrações, ajustes RBAC, correções Onboarding/Kanban, MessageComposer, logs, dados reais Supabase etc.).
  - Vários hotfixes/marcos concluídos registrados com evidências.

- Novas pendências obrigatórias (desta auditoria):
  - Rotacionar chaves Supabase e Z-API e remover segredos do repositório.
  - Despublicar rotas `debug/*` e `wa/test-zapi` em ambientes não-dev.
  - Consolidar estrutura de pastas e nomes (pt/en) e remover duplicações.
  - Corrigir testes quebrados e remover coverage/.next versionados.
  - Endurecer lint (sem `any`/`console`) e padronizar logs.

---

## Plano de Ação Prioritário

P0 – Segurança e Higiene (imediato)
1. Remover do VCS: `.env.local` (raiz e `web/.env.local`), `web/.next/`, `web/coverage/`, `web/lighthouse-report.json`, `web/tsconfig.tsbuildinfo` e arquivos “lixo” da raiz.
2. Rotacionar chaves: Supabase (ANON + SERVICE_ROLE) e Z-API (INSTANCE_TOKEN + CLIENT_TOKEN).
3. Bloquear endpoints: desativar `api/wa/test-zapi`, colocar `api/debug/*` atrás de checagem de role/ambiente e feature flag.
4. Revisar logs: remover prints de envs e tokens; adotar logger com níveis e redaction.

P1 – Consistência, Tipagem e Testes
5. Normalizar estrutura: migrar conteúdo de `web/app/app` para `web/app/(app)` (ou vice-versa), padronizar domínio (`relationship` OU `relacionamento`), consolidar `anamnese`/`anamnesis`.
6. Unificar componentes: manter apenas `web/components/ui/empty-state.tsx` e ajustar imports.
7. Tipagem: substituir `any` por tipos explícitos; compartilhar schemas Zod para request/response.
8. ESLint: ativar `no-console` (exceto `warn`/`error`), `no-explicit-any`, `@typescript-eslint/no-floating-promises`.
9. Testes: corrigir referências a `presentational/confirm-dialog-view` (restaurar componente ou atualizar testes); ampliar casos de erro para APIs críticas.

P2 – Migrations e Docs
10. Padronizar migrations: `YYYYMMDD__descricao.sql`, consolidar duplicadas (`his01_*`), gerar CHANGELOG.
11. Mover planilhas/evidências para `docs/` e garantir que não entram no bundle/deploy.

---

## Checklist de Saneamento (execução)

- [ ] Remoção dos segredos do repositório e rotação das chaves.
- [ ] Exclusão de `.next/`, `coverage/`, `lighthouse-report.json`, `tsconfig.tsbuildinfo` do VCS (git rm + commit).
- [ ] Desativação/guardas de rotas de debug e remoção de tokens hardcoded.
- [ ] Migração/unificação de diretórios duplicados; revisão de imports.
- [ ] Remoção de componentes e páginas de teste/versões obsoletas (StudentEditTabs V2–V5).
- [ ] Ajuste ESLint e remoção de `console.log` em produção.
- [ ] Correção dos testes unitários e verificação de CI verde.
- [ ] Padronização de migrations e documentação de mudanças.

---

## Evidências e Referências (arquivos relevantes)

- Segredos/credenciais: `.env.local`, `web/.env.local`, `web/Estrutura/Credenciais_QA_Supabase.txt`.
- Rotas perigosas: `web/app/api/debug/execute-sql/route.ts`, `web/app/api/wa/test-zapi/route.ts`.
- Duplicações: `web/app/(app)` vs `web/app/app`; `relationship` vs `relacionamento`; `anamnese` vs `anamnesis`; `web/components/ui/EmptyState.tsx` vs `empty-state.tsx`; `web/web/evidencias`.
- Artefatos indevidos: `web/.next`, `web/coverage`, `web/lighthouse-report.json`, `web/tsconfig.tsbuildinfo`.
- Testes quebrados: `__tests__/unit/components/presentational/confirm-dialog-view-accessibility.test.tsx` (fonte ausente).

---

## Conclusão

O projeto avança bem em funcionalidades e documentação operacional, mas requer saneamento urgente em segurança e higiene de repositório. Ao executar o plano P0/P1 acima, o nível de maturidade sobe significativamente, reduzindo riscos e acelerando a evolução com base mais sólida.

