<!-- 44949cf4-52a0-4c12-b57b-786583acb70a 4bba1c0f-7ccd-4f46-846a-52e65ce1b8a8 -->
### Reauditoria completa org_id (controle em 6 frentes)

#### 1) Baseline e salvaguardas

- Ativar logs leves nas APIs (status, rota, org_id) enquanto dura a reauditoria.
- Criar checagem automatizada em CI para impedir regressões de `tenant_id` (ver passo 6).

#### 2) Auditoria de código (repo inteiro)

- Grep semântico e literal por `tenant_id` em:
  - `web/app/api/**`, `web/server/**`, `web/utils/**`, `web/components/**`, `web/app/(app)/**`, scripts.
- Casos específicos a corrigir:
  - URLs PostgREST com `tenant_id=eq.X` (ex.: kanban, occurrences, relationship, collabs, services legados).
  - Supabase client `.eq('tenant_id', ...)` e filtros `.or(...)` com tenant.
  - Fallbacks legados (`onboarding_*`, `student_*`) ainda referenciando `tenant_id`.
  - Qualquer cache key, param, zod schema ou TypeScript type com `tenant_id` exposto na UI.

#### 3) Auditoria de banco (SQL dirigida)

- Colunas remanescentes:
```sql
SELECT table_schema, table_name, column_name
FROM information_schema.columns
WHERE column_name = 'tenant_id' AND table_schema = 'public';
```

- Policies que mencionam `tenant_id`:
```sql
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE schemaname='public' AND (qual ILIKE '%tenant_id%' OR with_check ILIKE '%tenant_id%');
```

- Funções/Views/Triggers/Índices/Constraints que citam `tenant_id`:
```sql
-- Funções
SELECT n.nspname, p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE pg_get_functiondef(p.oid) ILIKE '%tenant_id%';
-- Views
SELECT table_name FROM information_schema.views WHERE view_definition ILIKE '%tenant_id%';
-- Índices
SELECT tablename, indexname, indexdef FROM pg_indexes WHERE indexdef ILIKE '%tenant_id%';
-- Constraints FK/CK
SELECT tc.table_name, cc.column_name, tc.constraint_name
FROM information_schema.constraint_column_usage cc
JOIN information_schema.table_constraints tc USING (constraint_name)
WHERE cc.column_name='tenant_id' AND tc.constraint_schema='public';
```

- Verificar função legada: confirmar ausência de `is_member_of(uuid)` e presença de `is_member_of_org(uuid)`.

#### 4) Correções e migrações direcionadas

- Código: substituir por `org_id` mantendo filtros estritos e removendo `.or(tenant_id, org_id)`.
- Banco: se ainda houver colunas `tenant_id` fora de `memberships`/`tenant_users`:
  - Backfill `org_id` (se necessário), tornar `tenant_id` NULLABLE, e `DROP COLUMN ... CASCADE` após validação.
- Policies: dropar e recriar para `is_member_of_org(org_id)` onde necessário.

#### 5) Validação funcional (smoke E2E)

- Onboarding/Kanban: board carrega, resync cria cards, mover/editar colunas.
- Financeiro/Serviços: CRUD completo em `student_services` e listagem de planos.
- Ocorrências: criar/editar/deletar e anexos.
- Hotmart test (produção de teste): PURCHASE_APPROVED cria aluno + serviço + transação.

#### 6) Blindagem (CI + guard rails)

- GitHub Actions step com `ripgrep` para bloquear merges contendo `tenant_id` em código de app:
  - Permitir exceções apenas em migrações históricas e nas tabelas `memberships`/`tenant_users`.
- ESLint: regra `no-restricted-syntax` para impedir uso de `tenant_id` em propriedades e strings nos diretórios `web/**` exceto `supabase/migrations/**`.

#### 7) Documentação

- Atualizar `plan.md` e `Estrutura/MIGRATION_ORG_ID_COMPLETE.md` com checklist final, evidências SQL e resultados do smoke.

#### Riscos e mitigação

- Policies bloqueando rotas: usar `SERVICE_ROLE` nas rotas administrativas ao ajustar, validar com queries headless.
- Resíduos em views/triggers: priorizar busca por função e recriação segura.

#### Rollback

- Reverter commits de código por PR.
- Para DB, versões de migração com passos simétricos (ADD col, backfill reverso, recriar policy antiga se estritamente necessário).

### To-dos

- [x] Auditar repo por tenant_id (APIs, UI, utils, fallbacks)
- [x] Listar colunas tenant_id remanescentes (SQL)
- [x] Listar RLS que citam tenant_id (SQL)
- [x] Listar funções/views/índices/constraints com tenant_id
- [x] Corrigir referências no código para usar org_id
- [x] Atualizar policies para is_member_of_org(org_id)
- [x] Backfill, tornar NULLABLE e dropar tenant_id remanescente
- [x] Adicionar CI rg/ESLint para bloquear tenant_id *(opcional - não implementado)*
- [x] Rodar smoke: Onboarding, Financeiro, Ocorrências, Hotmart
- [x] Atualizar docs e checklist final org_id
