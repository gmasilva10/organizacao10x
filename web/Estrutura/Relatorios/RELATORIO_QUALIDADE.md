# Relat rio de Qualidade e Auditoria   Organizacao10x

Data: 2025-09-24
Escopo: Revis o geral de estrutura, qualidade de c digo, duplica  es, c digo morto, seguran a, pend ncias e plano de a  o.

---

## Resumo Executivo

- Principais riscos identificados:
  - Segredos e tokens versionados em `.env.local` (raiz e `web/.env.local`) e hardcoded em c digo (ex.: `web/app/api/wa/test-zapi/route.ts`, `web/check_tables.js`, `web/Estrutura/Credenciais_QA_Supabase.txt`).
  - Artefatos de build versionados (`web/.next`, `web/coverage`, `web/lighthouse-report.json`, `web/tsconfig.tsbuildinfo`).
  - Estrutura duplicada/inconsistente: `web/app/(app)` vs `web/app/app`, `relationship` vs `relacionamento`, `anamnese` vs `anamnesis`, `web/web/*` (aninhamento redundante), componentes duplicados (`EmptyState.tsx` e `empty-state.tsx`).
  - Endpoints de debug perigosos acess veis sem guarda adequada (ex.: `web/app/api/debug/execute-sql/route.ts`, `web/app/api/wa/test-zapi/route.ts`).
  - Uso excessivo de `any` e logs (`console.log`) em rotas e p ginas.
  - Testes unit rios desatualizados/apontando para fontes inexistentes (ex.: `presentational/confirm-dialog-view`).
  - Arquivos estranhos na raiz (prov vel lixo de shell) e planilhas/evid ncias misturadas ao produto.

- Recomenda  es priorit rias (P0/P1):
  1) Remover segredos do VCS e girar chaves no Supabase/Z-API imediatamente.
  2) Remover artefatos de build e configurar `.gitignore`/limpeza do hist rico.
  3) Consolidar estrutura de pastas (eliminar diret rios e nomes duplicados/inconsistentes).
  4) Desativar/guardar endpoints de debug e remover tokens hardcoded.
  5) Endurecer lint (no-console, no-explicit-any) e padronizar logs.
  6) Corrigir testes e refer ncias quebradas.

---

## Mapa da Estrutura (alto n vel)

- Raiz
  - `web/` Next.js App Router + TS + Tailwind + shadcn/ui
  - `supabase/migrations/`   scripts SQL (h duplica  es/varia  es p0/p1)
  - `__tests__/`   unit rios (vitest)   alguns desatualizados
  - `testsprite_tests/`   artefatos/planos de teste manuais e tempor rios
  - `Planilha/`   arquivos .xlsx (deveriam estar em `docs/` ou fora do repo)
  - Arquivos indevidos: `web/.next/`, `web/coverage/`, `web/lighthouse-report.json`, arquivos com nomes corruptos na raiz, `.env.local` (segredos)

- `web/app/`
  - `app/` (dashboard/aplica  o logada)
  - `(app)/` (grupo de rotas duplicado)
  - `api/` (v rias rotas   mistura de pt/en e debug)
  - `login`, `login-simple`, `signup`, `examples`, `test-app`, `p/anamnese/[token]`

- `web/components/`
  - `ui/` (base shadcn)   possui duplicatas conceituais (EmptyState)
  - `students/`, `relationship/`, `anamnese/`, `anamnesis/`, `providers/`, `shared/`

- `web/utils/` e `web/src/server/`   wrappers Supabase e Z-API

---

## Sinais de Risco e Problemas

1) Seguran a (Cr tico)
   - Segredos em VCS:
     - Raiz: `.env.local` com `SUPABASE_SERVICE_ROLE_KEY`, `ZAPI_*`.
     - `web/.env.local` idem.
     - `web/Estrutura/Credenciais_QA_Supabase.txt` com chaves reais.
     - C digo com tokens: `web/app/api/wa/test-zapi/route.ts` (tokens hardcoded), `web/check_tables.js` (URL/anon key p blicas).
   - Endpoints perigosos:
     - `web/app/api/debug/execute-sql/route.ts` executa SQL via RPC sem verifica  o robusta de role/ambiente.
     - `web/debug-migration.html` exp e opera  es administrativas via frontend.

2) Higiene de Reposit rio
   - Build/coverage versionados: `web/.next`, `web/coverage`, `web/lighthouse-report.json`, `web/tsconfig.tsbuildinfo`.
   - Arquivos  lixo”/corrompidos na raiz: ex. nomes iniciando com `o ? Select-String ...`, `tatus`, `u rios an nimos`.
   - Pastas com conte do operacional/externo dentro do produto: `Planilha/`, `evidencias/`, `web/web/evidencias/`.

3) Estrutura e Consist ncia
   - Duplicidade de grupos/rotas: `web/app/(app)` vs `web/app/app`.
   - Nomenclatura pt/en misturada para mesmas features: `relationship` vs `relacionamento`, `anamnese` vs `anamnesis`.
   - Diret rio redundante: `web/web/*`.
   - Componentes duplicados: `web/components/ui/EmptyState.tsx` (default) e `web/components/ui/empty-state.tsx` (named export). Em Windows/macOS isso conflita.
   - Multivers es n o usadas: `StudentEditTabsV2..V5` coexistem com `V6`.

4) Qualidade de C digo
   - Uso extensivo de `any` (ex.: `web/app/students/[id]/anamnese/[versionId]/page.tsx`, `web/app/p/anamnese/[token]/page.tsx`, rotas `api/occurrences/*`).
   - `console.log`/`console.warn` em c digo de produ  o (ex.: `web/middleware.ts`, `web/utils/supabase/server.ts`, diversas rotas `api`).
   - Valida  o inconsistente: parte das rotas usa `zod`, outras n o.
   - Testes unit rios referenciam fonte inexistente: `presentational/confirm-dialog-view` (somente coverage HTML existe).
   - P ginas/arquivos de debug: `web/app/app/students/test-simple.tsx`.

5) Migrations
   - Duplicidades/varia  es (`his01_audit_log.sql` e `his01_audit_log_p0.sql`), nomenclaturas mistas (com/sem prefixo data), falta de sum rio/ordena  o can nica.

---

## Notas por M dulo (0 10) e Recomenda  es

- App (logado)   `web/app/app`   Nota: 7/10
  - Pontos bons: organiza  o por  reas (students, services, team), UI consistente.
  - Melhorias: eliminar p ginas de teste (`test-simple.tsx`), remover logs, garantir tipagem forte (evitar `any`), padronizar imports de `EmptyState`.

- API Routes   `web/app/api`   Nota: 3/10
  - Pontos cr ticos: endpoints de debug sem guardas, tokens hardcoded (`wa/test-zapi`), valida  o parcial, logs verbosos, poss veis spoilers de infra.
  - Melhorias: exigir autentica  o/role para debug, remover rotas perigosas do deploy, validar entrada com `zod` em todas as rotas, sanitizar logs.

- UI Base   `web/components/ui`   Nota: 6/10
  - Pontos bons: ado  o shadcn/ui, boa cobertura de componentes.
  - Problemas: duplica  o `EmptyState.tsx` vs `empty-state.tsx` (quebra de consist ncia e risco cross-OS).
  - Melhorias: unificar em um  nico componente (lowercase), corrigir imports.

- Students (componentes)   `web/components/students`   Nota: 6.5/10
  - Pontos bons: evolu  o incremental (V2 V6), funcionalidades ricas.
  - Problemas: vers es antigas V2 V5 aparentam n o ser usadas.
  - Melhorias: remover vers es antigas ap s confirma  o, extrair l gicas pesadas para hooks/utilit rios tipados, garantir `no-explicit-any`.

- Anamnese/Anamnesis   `web/components/anamnese`, `web/components/anamnesis`, `web/app/p/anamnese`   Nota: 7/10
  - Pontos bons: feature completa (templates, preview, token p blico).
  - Problemas: nomenclatura inconsistente (pt/en), `any` em p ginas de token.
  - Melhorias: consolidar naming (uma l ngua), tipar modelos (Zod + TS types compartilhados).

- Relationship/Relacionamento   `web/app/app/(relationship|relacionamento)` e `web/app/api/(relationship|relacionamento)`   Nota: 6/10
  - Pontos bons: APIs diversas (mensagens, logs, tasks, analytics).
  - Problemas: duplicidade pt/en de rotas e p ginas; debug pages.
  - Melhorias: padronizar para um idioma, mover debug para ambiente isolado.

- Supabase Utils   `web/utils/supabase/*`   Nota: 5/10
  - Pontos bons: wrappers SSR/admin, cookies integrados.
  - Problemas: logs de vari veis de ambiente, poucas garantias de n o-vazamento em prod.
  - Melhorias: remover logs sens veis, encapsular logger, fallback seguro para env ausente.

- Z-API Server   `web/src/server/zapi.ts`   Nota: 5/10
  - Pontos bons: timeouts/retries, headers definidos.
  - Problemas: logs com payloads e URLs; depend ncia de env n o verificada em build.
  - Melhorias: mascarar dados, validar envs no startup, centralizar client.

- Middleware   `web/middleware.ts`   Nota: 4/10
  - Problemas:  TEMPORÁRIO” definindo cookie de organiza  o padr o em produ  o; logs no middleware; redire  es legadas.
  - Melhorias: remover tempor rios, garantir resolu  o de organiza  o server-side com fallback seguro, evitar side effects de debug.

- Migrations   `supabase/migrations`   Nota: 6/10
  - Pontos bons: cobertura de dom nios (kanban, services, occurrences, RBAC).
  - Problemas: arquivos duplicados/varia  es p0/p1; nomenclatura inconsistente.
  - Melhorias: padronizar `YYYYMMDD__descricao.sql`, consolidar duplicados, manter CHANGELOG de migrations.

- Testes e Qualidade   `__tests__`, `web/.github/workflows/*`, `web/coverage`   Nota: 4/10
  - Pontos bons: h vitest, playwright configurado, coverage produzido.
  - Problemas: testes unit rios referenciam fonte inexistente; coverage e .next versionados; lacunas de valida  o.
  - Melhorias: corrigir imports (ou restaurar componente), validar caminho `@/components/presentational/*`, retirar coverage do repo, ampliar testes para APIs com cen rios de erro.

- Governan a/Documentos   `web/Estrutura/*`   Nota: 8/10
  - Pontos bons: documenta  o rica (atividades, pend ncias, evid ncias, checklists, m tricas de performance).
  - Problemas: mistura de credenciais com documenta  o.
  - Melhorias: mover credenciais para cofre (1Password/Vault), separar `docs/` do produto, versionar apenas artefatos n o sens veis.

---

## Duplica  es, C digo Morto e Inconsist ncias

- Diret rios/arquivos duplicados/mal posicionados:
  - `web/app/(app)` e `web/app/app` coexistem. Decidir por UMA estrat gia (recomendado manter `(app)` como  grupo” padr o do App Router e migrar conte do de `app/` para l ).
  - `web/components/ui/EmptyState.tsx` e `web/components/ui/empty-state.tsx`   manter apenas `empty-state.tsx` e ajustar imports.
  - `web/app/app/relationship` vs `web/app/app/relacionamento`   escolher um idioma (pt-BR ou en) para o dom nio e refatorar.
  - `web/components/anamnese` vs `web/components/anamnesis`   mesmo ponto de padroniza  o.
  - `web/web/evidencias`   mover para `web/evidencias` ou `docs/`.
  - `web/components/students/StudentEditTabsV2..V5`   candidatas a remo  o se desreferenciadas (V6 em uso).

- Artefatos indevidos (versionados por engano):
  - `web/.next/`, `web/coverage/`, `web/lighthouse-report.json`, `web/tsconfig.tsbuildinfo`.
  - Arquivos  lixo” na raiz com nomes quebrados (ex.: `o ? Select-String ...`, `tatus`).

- C digo de debug/dev deixado no produto:
  - `web/app/api/wa/test-zapi/route.ts`, `web/app/app/students/test-simple.tsx`, `web/debug-migration.html`.

---

## Pend ncias e Atividades

- Dos arquivos de governan a (`web/Estrutura/Pendencias*.txt`, `Atividades.txt`):
  - Backlog vivo com itens P0 P3 (OAuth Google, SEO metadata,  cones/ilustra  es, ajustes RBAC, corre  es Onboarding/Kanban, MessageComposer, logs, dados reais Supabase etc.).
  - V rios hotfixes/marcos conclu dos registrados com evid ncias.

- Novas pend ncias obrigat rias (desta auditoria):
  - Rotacionar chaves Supabase e Z-API e remover segredos do reposit rio.
  - Despublicar rotas `debug/*` e `wa/test-zapi` em ambientes n o-dev.
  - Consolidar estrutura de pastas e nomes (pt/en) e remover duplica  es.
  - Corrigir testes quebrados e remover coverage/.next versionados.
  - Endurecer lint (sem `any`/`console`) e padronizar logs.

---

## Plano de A  o Priorit rio

P0   Seguran a e Higiene (imediato)
1. Remover do VCS: `.env.local` (raiz e `web/.env.local`), `web/.next/`, `web/coverage/`, `web/lighthouse-report.json`, `web/tsconfig.tsbuildinfo` e arquivos  lixo” da raiz.
2. Rotacionar chaves: Supabase (ANON + SERVICE_ROLE) e Z-API (INSTANCE_TOKEN + CLIENT_TOKEN).
3. Bloquear endpoints: desativar `api/wa/test-zapi`, colocar `api/debug/*` atr s de checagem de role/ambiente e feature flag.
4. Revisar logs: remover prints de envs e tokens; adotar logger com n veis e redaction.

P1   Consist ncia, Tipagem e Testes
5. Normalizar estrutura: migrar conte do de `web/app/app` para `web/app/(app)` (ou vice-versa), padronizar dom nio (`relationship` OU `relacionamento`), consolidar `anamnese`/`anamnesis`.
6. Unificar componentes: manter apenas `web/components/ui/empty-state.tsx` e ajustar imports.
7. Tipagem: substituir `any` por tipos expl citos; compartilhar schemas Zod para request/response.
8. ESLint: ativar `no-console` (exceto `warn`/`error`), `no-explicit-any`, `@typescript-eslint/no-floating-promises`.
9. Testes: corrigir refer ncias a `presentational/confirm-dialog-view` (restaurar componente ou atualizar testes); ampliar casos de erro para APIs cr ticas.

P2   Migrations e Docs
10. Padronizar migrations: `YYYYMMDD__descricao.sql`, consolidar duplicadas (`his01_*`), gerar CHANGELOG.
11. Mover planilhas/evid ncias para `docs/` e garantir que n o entram no bundle/deploy.

---

## Checklist de Saneamento (execu  o)

- [ ] Remo  o dos segredos do reposit rio e rota  o das chaves.
- [ ] Exclus o de `.next/`, `coverage/`, `lighthouse-report.json`, `tsconfig.tsbuildinfo` do VCS (git rm + commit).
- [ ] Desativa  o/guardas de rotas de debug e remo  o de tokens hardcoded.
- [ ] Migra  o/unifica  o de diret rios duplicados; revis o de imports.
- [ ] Remo  o de componentes e p ginas de teste/vers es obsoletas (StudentEditTabs V2 V5).
- [ ] Ajuste ESLint e remo  o de `console.log` em produ  o.
- [ ] Corre  o dos testes unit rios e verifica  o de CI verde.
- [ ] Padroniza  o de migrations e documenta  o de mudan as.

---

## Evid ncias e Refer ncias (arquivos relevantes)

- Segredos/credenciais: `.env.local`, `web/.env.local`, `web/Estrutura/Credenciais_QA_Supabase.txt`.
- Rotas perigosas: `web/app/api/debug/execute-sql/route.ts`, `web/app/api/wa/test-zapi/route.ts`.
- Duplica  es: `web/app/(app)` vs `web/app/app`; `relationship` vs `relacionamento`; `anamnese` vs `anamnesis`; `web/components/ui/EmptyState.tsx` vs `empty-state.tsx`; `web/web/evidencias`.
- Artefatos indevidos: `web/.next`, `web/coverage`, `web/lighthouse-report.json`, `web/tsconfig.tsbuildinfo`.
- Testes quebrados: `__tests__/unit/components/presentational/confirm-dialog-view-accessibility.test.tsx` (fonte ausente).

---

## Conclus o

O projeto avan a bem em funcionalidades e documenta  o operacional, mas requer saneamento urgente em seguran a e higiene de reposit rio. Ao executar o plano P0/P1 acima, o n vel de maturidade sobe significativamente, reduzindo riscos e acelerando a evolu  o com base mais s lida.

