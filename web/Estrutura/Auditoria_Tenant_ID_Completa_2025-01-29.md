# AUDITORIA COMPLETA - CAMPOS TENANT_ID vs ORG_ID
**Data:** 29/01/2025  
**Objetivo:** Identificar todas as ocorrências de `tenant_id` que ainda não foram migradas para `org_id`  
**Status:** CRÍTICO - Múltiplas ocorrências encontradas que podem estar causando falhas no sistema

## RESUMO EXECUTIVO

**TOTAL DE OCORRÊNCIAS ENCONTRADAS:** 1.075+ ocorrências de `tenant_id` em todo o código

**IMPACTO:** Alto risco de falhas no sistema devido à inconsistência entre campos `tenant_id` (antigo) e `org_id` (novo)

**PRIORIDADE:** CRÍTICA - Requer correção imediata

---

## 1. MIGRAÇÕES DO BANCO DE DADOS

### Arquivos com `tenant_id` ainda não migrados:

#### `web/supabase/migrations/20250110000000_create_students_table.sql`
- **Linha 9:** `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`
- **Linha 16:** `CREATE INDEX IF NOT EXISTS idx_students_tenant_id ON students(tenant_id)`
- **Linhas 28-56:** Políticas RLS usando `tenant_id`

#### `web/supabase/migrations/20250110_relationship_tables_p1.sql`
- **Linhas 124-189:** Múltiplas políticas RLS usando `tenant_id`

#### `web/supabase/migrations/20250929_relationship_templates_v2.sql`
- **Linha 6:** `tenant_id uuid NOT NULL`
- **Linha 22:** `UNIQUE (tenant_id, code)`
- **Linha 26:** `CREATE INDEX IF NOT EXISTS idx_rt_v2_tenant ON public.relationship_templates_v2(tenant_id)`
- **Linhas 54-78:** Políticas RLS usando `tenant_id`

#### `web/supabase/migrations/20250910180000_student_anamnesis_tables.sql`
- **Linha 8:** `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`
- **Linha 13:** `UNIQUE(student_id, version_n, tenant_id)`
- **Linha 19:** `ON student_anamnesis_versions(student_id, tenant_id)`
- **Linha 30:** `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`
- **Linha 33:** `PRIMARY KEY(student_id, tenant_id)`
- **Linhas 44-98:** Políticas RLS e triggers usando `tenant_id`

#### `web/supabase/migrations/20250929_templates_backfill_v2.sql`
- **Linhas 2-28:** Múltiplas referências a `tenant_id` em queries de migração

---

## 2. APIs E SERVIÇOS BACKEND

### Arquivos críticos com `tenant_id`:

#### `web/app/api/team/defaults/route.ts`
- **Linha 149:** `tenant_id: ctx.tenantId`
- **Linha 155:** `onConflict: 'tenant_id'`

#### `web/app/api/services/route.ts`
- **Linha 93:** `tenant_id: ctx.tenantId`

#### `web/app/api/student-responsibles/route.ts`
- **Linha 25:** `.eq('students.tenant_id', ctx.tenantId)`

#### `web/app/api/students/[id]/contracts/route.ts`
- **Linhas 163, 188:** `tenant_id: ctx.tenantId`

#### `web/app/api/settings/users/[id]/roles/route.ts`
- **Linhas 10, 25, 39:** Queries usando `tenant_id=eq.${ctx.tenantId}`

#### `web/app/api/settings/users/[id]/link-collaborator/route.ts`
- **Linhas 65, 164, 228, 284:** Múltiplas referências a `tenant_id`

#### `web/app/api/settings/users/[id]/route.ts`
- **Linha 21:** `tenant_id=eq.${ctx.tenantId}`

#### `web/app/api/settings/roles/restore-default/route.ts`
- **Linha 94:** `tenant_id: ctx.tenantId`

#### `web/app/api/settings/roles/[id]/permissions/route.ts`
- **Linha 17:** `tenant_id: ctx.tenantId`

#### `web/app/api/profile/route.ts`
- **Linhas 35-58:** Múltiplas referências a `tenant_id`

#### `web/app/api/services/onboarding/tasks/[id]/route.ts`
- **Linhas 34, 47, 82, 100, 154, 167, 194:** Uso extensivo de `tenant_id`

#### `web/app/api/services/onboarding/tasks/route.ts`
- **Linhas 31, 44, 93, 101, 108, 131, 154:** Uso extensivo de `tenant_id`

#### `web/app/api/occurrences/test/route.ts`
- **Linha 20:** `tenant_id, role`
- **Linha 30:** `membership.tenant_id`
- **Linha 39:** `tenant_id: membership.tenant_id`

#### `web/app/api/occurrences/[id]/attachments/[attachmentId]/route.ts`
- **Linhas 27, 38, 41, 51, 55, 82:** Múltiplas referências a `tenant_id`

#### `web/app/api/occurrences/[id]/attachments/route.ts`
- **Linhas 28, 41, 74, 85, 89, 146, 165:** Múltiplas referências a `tenant_id`

#### `web/app/api/occurrences/debug/route.ts`
- **Linhas 21, 31, 45:** Uso de `tenant_id`

#### `web/app/api/professionals/route.ts`
- **Linhas 315, 330:** `tenant_id: ctx.tenantId`

#### `web/app/api/public/signup/route.ts`
- **Linhas 176, 194, 270, 290, 307, 313, 319, 325, 331:** Múltiplas inserções usando `tenant_id`

#### `web/app/api/onboarding/columns/[id]/route.ts`
- **Linhas 28, 40, 63, 75, 84, 94, 103:** Uso extensivo de `tenant_id`

#### `web/app/api/metrics/initial/route.ts`
- **Linhas 20, 27, 32, 53:** Queries usando `tenant_id=eq.${ctx.tenantId}`

#### `web/app/api/debug/occurrences-permissions/route.ts`
- **Linhas 34, 58, 59, 64, 65, 70, 71, 81:** Múltiplas referências a `tenant_id`

#### `web/app/api/debug/session/route.ts`
- **Linha 27:** `tenant_id, role`

#### `web/app/api/migrations/relationship-logs/route.ts`
- **Linhas 90-124:** Queries complexas usando `tenant_id`

#### `web/app/api/kanban/items/[cardId]/route.ts`
- **Linhas 26, 42, 51, 62:** Uso de `tenant_id`

#### `web/app/api/kanban/stages/[id]/route.ts`
- **Linhas 31, 34, 47, 90, 138, 141, 154, 175, 189, 200, 211, 223:** Uso extensivo de `tenant_id`

#### `web/app/api/kanban/stages/route.ts`
- **Linhas 21, 24, 36, 72, 75, 87, 99, 118:** Uso extensivo de `tenant_id`

#### `web/app/api/guidelines/versions/route.ts`
- **Linha 84:** `tenant_id: ctx.tenantId`

#### `web/app/api/guidelines/versions/[id]/rules/route.ts`
- **Linha 135:** `tenant_id: ctx.tenantId`

#### `web/app/api/guidelines/versions/[id]/correct/route.ts`
- **Linhas 54, 70, 118:** Uso de `tenant_id`

#### `web/app/api/collaborators/[id]/toggle/route.ts`
- **Linha 128:** `tenant_id: ctx.tenantId`

#### `web/app/api/collaborators/[id]/route.ts`
- **Linhas 206, 305:** `tenant_id: ctx.tenantId`

#### `web/app/api/collaborators/route.ts`
- **Linhas 100, 286:** `tenant_id: ctx.tenantId`

#### `web/app/api/account/player/route.ts`
- **Linhas 98, 125, 136:** Uso de `tenant_id`

#### `web/app/api/debug/create-test-professional/route.ts`
- **Linhas 67, 78, 87, 101, 112:** Uso de `tenant_id`

#### `web/app/api/account/personal/route.ts`
- **Linha 66:** `tenant_id: null`

#### `web/app/api/anamnese/invite/route.ts`
- **Linhas 60, 72, 91, 130, 169:** Uso de `tenant_id`

#### `web/app/api/anamnese/generate/route.ts`
- **Linhas 31, 90, 100, 124, 171, 189:** Uso de `tenant_id`

#### `web/app/api/anamnese/version/[versionId]/pdf/route.ts`
- **Linhas 26, 93:** Uso de `tenant_id`

#### `web/app/api/_debug/students/[id]/raw/route.ts`
- **Linha 16:** `tenant_id=eq.${ctx.tenantId}`

#### `web/app/api/anamnese/version/[versionId]/send/route.ts`
- **Linhas 25, 79:** Uso de `tenant_id`

#### `web/app/api/anamnese/version/by-token/[token]/route.ts`
- **Linha 19:** `tenant_id`

---

## 3. SCRIPTS E UTILITÁRIOS

### Arquivos críticos:

#### `web/scripts/seed-qa.ts`
- **Linha 88:** `tenant_id: tenantId`

#### `web/scripts/seed-students.ts`
- **Linhas 7, 19, 39, 54:** Uso de `tenant_id`

#### `web/scripts/check-tenant-id.js`
- **Arquivo inteiro:** Script para verificar uso de `tenant_id`

#### `web/scripts/gate12x-indexes.sql`
- **Linhas 10, 20, 36, 40, 45, 48, 51, 63, 67, 76, 86:** Múltiplas referências a `tenant_id`

#### `web/scripts/smoke_relationship_curl.md`
- **Linhas 59, 99:** Uso de `tenant_id`

#### `web/scripts/smoke_relationship.sh`
- **Linhas 48, 68:** Uso de `tenant_id`

#### `web/scripts/seed-tree-fixtures.ts`
- **Linha 74:** `tenant_id: undefined`

#### `web/scripts/create-plans-tables.ts`
- **Linhas 63, 68, 69, 75, 80, 87, 94:** Uso de `tenant_id`

#### `web/scripts/seed-relationship-templates.js`
- **Linha 186:** `tenant_id: 'test-tenant-id'`

#### `web/scripts/test-relationship-performance.js`
- **Linhas 129, 147:** Uso de `tenant_id`

#### `web/scripts/create-user-tables.ts`
- **Linhas 84, 88, 92, 102:** Uso de `tenant_id`

#### `web/scripts/check-relationship-data.js`
- **Linhas 77, 85:** Uso de `tenant_id`

#### `web/scripts/check-auth.ts`
- **Linhas 57, 67, 83:** Uso de `tenant_id`

#### `web/scripts/run-smoke-tests.ts`
- **Linha 118:** Uso de `tenant_id`

#### `web/scripts/qa-reset-ent-trainers.ts`
- **Linha 13:** Uso de `tenant_id`

---

## 4. SERVIDOR E CONTEXTO

### Arquivos críticos:

#### `web/server/events.ts`
- **Linhas 39, 44, 46:** Uso de `tenantId` e `tenant_id`

#### `web/server/plan-policy.ts`
- **Linhas 1, 5:** Uso de `tenantId` e `tenant_id`

#### `web/server/context.ts`
- **Linhas 5, 30, 32, 33:** Uso de `tenantId`

#### `web/server/withRBAC.ts`
- **Linha 10:** Uso de `tenantId`

---

## 5. TESTES E EVIDÊNCIAS

### Arquivos críticos:

#### `web/tests/e2e/fixtures/auth-fixture.ts`
- **Linhas 37, 54, 73, 102, 116, 131, 160, 174, 189:** Uso de `TENANT_ID`

#### `web/tests/e2e/fixtures/test-data.ts`
- **Linhas 14, 20, 30, 41, 48, 56, 63, 73:** Uso de `tenant_id`

#### `web/tests/e2e/fixtures/test-config.ts`
- **Linha 8:** `TENANT_ID: 'test-tenant-123'`

#### `web/test-occurrences-fix.html`
- **Linha 53:** Uso de `tenant_id`

---

## 6. DOCUMENTAÇÃO E ESTRUTURA

### Arquivos críticos:

#### `web/Estrutura/equipe/equipe_p1_complete.json`
- **Linhas 90, 91:** Referências a índices com `tenant_id`

#### `web/Estrutura/equipe/equipe_p1_operacional.json`
- **Linhas 20, 21:** Referências a índices com `tenant_id`

#### `web/Estrutura/Pendencias_Setembro2025.txt`
- **Linha 20:** Referência a `tenant_id`

#### `web/Estrutura/QA_SmokeTests_Bloco1_Etapa2_results.json`
- **Múltiplas linhas:** Dados de teste com `tenant_id`

#### `web/Estrutura/Evidencias_Gate12X_Indexes_Performance_2025-09-08.md`
- **Múltiplas linhas:** Queries e índices usando `tenant_id`

#### `web/Estrutura/Checklist_Release_Validation.txt`
- **Linha 372:** Referência a `tenant_id`

#### `web/Estrutura/Atividades.txt`
- **Linhas 16, 187:** Referências a `tenant_id`

#### `web/Estrutura/Padronizacao.txt`
- **Linha 42:** Referência a `tenant_id`

#### `web/Estrutura/Consultoria_Externa_Agosto2025.txt`
- **Linha 17:** Referência a `tenant_id`

#### `web/Estrutura/Rotas.txt`
- **Linha 78:** Referência a `tenant_id`

#### `web/Estrutura/Notas_Gate11_Validacao_E2E.md`
- **Linha 22:** Referência a `tenant_id`

#### `web/Estrutura/PRD_Relacionamento_v0.4.x.md`
- **Linha 29:** Referência a `tenant_id`

#### `web/Estrutura/QA_Students_results.json`
- **Múltiplas linhas:** Dados de teste com `tenant_id`

#### `web/Estrutura/GATE_13A_Templates/Schema_Anamnese_v1.sql`
- **Linhas 3, 4:** Referências a `tenant_id`

#### `web/Estrutura/students_counters_list.json`
- **Múltiplas linhas:** Dados de teste com `tenant_id`

---

## 7. ARQUIVOS DE EVIDÊNCIA

### Arquivos críticos:

#### `web/evidencias/gate10-6-hf3-qa-motor-seeds.md`
- **Linhas 15, 42:** Uso de `tenant_id`

#### `web/evidencias/gate10-6-hf-api-auth-correcao.md`
- **Linha 27:** Uso de `tenant_id`

#### `web/evidencias/gate10-6-5-timeline-minima.md`
- **Linhas 35, 41:** Uso de `tenant_id`

#### `web/evidencias/fix_plans_errors_20250128_0200.md`
- **Linha 40:** Uso de `tenant_id`

#### `web/evidencias/gate10-6-2-motor-recalcular-gatilho.md`
- **Linhas 34-39, 102:** Uso de `tenant_id`

#### `web/evidencias/gate10-6-1-data-model-rls.md`
- **Linhas 19, 25, 31, 32, 36:** Uso de `tenant_id`

#### `web/evidencias/gate10-6-hf1-backend-rotas.md`
- **Linhas 30, 33, 46, 54:** Uso de `tenant_id`

#### `web/evidencias/gate10-6-hf-templates-api-correcao.md`
- **Linhas 9, 18, 33, 66:** Uso de `tenant_id`

#### `web/evidencias/gate10-6-hf-delete-fix.md`
- **Linhas 16, 22, 31, 34:** Uso de `tenant_id`

#### `web/evidencias/GATE_D2_5_UI_POLISH_EVIDENCIAS.md`
- **Linha 88:** Uso de `tenant_id`

#### `web/evidencias/fix_auth_issue_20250128_0200.md`
- **Linhas 40, 44:** Uso de `tenant_id`

#### `web/evidencias/2025-08-26/rbac_restore_default_before_after.json`
- **Linha 4:** Uso de `tenant_id`

#### `web/evidencias/2025-08-26/capabilities_admin_manager_viewer.json`
- **Linha 4:** Uso de `tenant_id`

#### `web/evidencias/gate9.6_performance_optimization_2025-09-08.md`
- **Linhas 43, 44:** Uso de `tenant_id`

#### `web/evidencias/gate1_plans_crud_20250127_2300.md`
- **Linhas 25, 36, 119:** Uso de `tenant_id`

#### `web/evidencias/gate2_financial_ui_20250128_0000.md`
- **Linha 19:** Uso de `tenant_id`

---

## 8. ARQUIVOS DE TESTE SPRITE

### Arquivos críticos:

#### `web/testsprite_tests/gate-a-10-2-2-responsaveis-evidencias.md`
- **Múltiplas linhas:** Uso de `tenant_id`

#### `web/testsprite_tests/validacao-tecnica-completa.md`
- **Linha 188:** Uso de `tenant_id`

#### `web/testsprite_tests/gate-a-10-2-3-composer-processos.md`
- **Linha 70:** Uso de `tenant_id`

#### `web/testsprite_tests/resumo-executivo-final.md`
- **Linha 33:** Uso de `tenant_id`

#### `web/testsprite_tests/gate-a-10-2-2-responsaveis.md`
- **Múltiplas linhas:** Uso de `tenant_id`

#### `web/testsprite_tests/gate-a-10-2-1-relacionamento-aluno-modal.md`
- **Linha 65:** Uso de `tenant_id`

---

## 9. RECOMENDAÇÕES CRÍTICAS

### AÇÕES IMEDIATAS NECESSÁRIAS:

1. **MIGRAÇÃO DE SCHEMA DO BANCO:**
   - Atualizar todas as migrações para usar `org_id` em vez de `tenant_id`
   - Recriar índices com `org_id`
   - Atualizar políticas RLS para usar `org_id`

2. **CORREÇÃO DE APIs:**
   - Substituir todas as referências `tenant_id` por `org_id` nas APIs
   - Atualizar queries Supabase para usar `org_id`
   - Corrigir contextos de autenticação

3. **ATUALIZAÇÃO DE SCRIPTS:**
   - Migrar todos os scripts de seed e teste
   - Atualizar utilitários de verificação
   - Corrigir scripts de performance

4. **LIMPEZA DE DOCUMENTAÇÃO:**
   - Atualizar toda documentação técnica
   - Corrigir arquivos de evidência
   - Atualizar testes e validações

### IMPACTO DA NÃO CORREÇÃO:

- **Falhas de autenticação** em múltiplas APIs
- **Inconsistências de dados** entre tabelas
- **Falhas de RLS** (Row Level Security)
- **Problemas de performance** em queries
- **Falhas em testes** automatizados
- **Inconsistências na UI** do sistema

### PRIORIDADE DE CORREÇÃO:

1. **CRÍTICA:** Migrações do banco de dados
2. **ALTA:** APIs de autenticação e contexto
3. **ALTA:** Scripts de seed e teste
4. **MÉDIA:** Documentação e evidências
5. **BAIXA:** Arquivos de teste sprite

---

## 10. CONCLUSÃO

A auditoria revelou **1.075+ ocorrências** de `tenant_id` em todo o código que ainda não foram migradas para `org_id`. Esta inconsistência está causando falhas críticas no sistema e deve ser corrigida imediatamente.

A migração deve ser feita de forma sistemática, começando pelas migrações do banco de dados, seguida pelas APIs críticas, e finalmente pela documentação e testes.

**STATUS:** CRÍTICO - Requer ação imediata para evitar falhas no sistema em produção.