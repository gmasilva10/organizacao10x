# Status da Migração org_id - 2025-10-02

## Resumo Executivo

Migração de `tenant_id` → `org_id` executada em 4 fases para padronizar identificação de organizações e eliminar duplicidade de campos.

## ✅ FASE 0 COMPLETA - Auditoria

**Data:** 2025-10-02 10:41

### Resultados
- **58 tabelas auditadas:**
  - 4 tabelas com AMBOS (tenant_id + org_id): `students`, `student_services`, `student_billing`, `student_plan_contracts`
  - 48 tabelas só com tenant_id
  - 10 tabelas só com org_id (novas)
- **100+ políticas RLS** identificadas usando `tenant_id`
- **Helpers RLS:** `is_member_of(tenant_id)`, `has_role(tenant_id, roles[])`

### Artefatos
- `Estrutura/MIGRATION_ORG_ID_AUDIT.md` - documento completo de auditoria

## ✅ FASE 1 COMPLETA - APIs com Filtro Dual

**Data:** 2025-10-02 10:42

### Mudanças
Atualizado filtros nas APIs críticas para aceitar `org_id` OU `tenant_id`:

```typescript
// Antes:
.eq('tenant_id', ctx.tenantId)

// Depois (compatibilidade):
.or(`org_id.eq.${ctx.tenantId},tenant_id.eq.${ctx.tenantId}`)
```

### Arquivos Modificados
- `web/app/api/students/route.ts` - GET/POST
- `web/app/api/students/[id]/route.ts` - GET/PATCH/DELETE
- `web/app/api/students/[id]/services/route.ts` - GET/POST
- `web/app/api/students/[id]/services/[serviceId]/route.ts` - GET/PATCH/DELETE
- `web/app/api/students/[id]/billing/route.ts` - GET
- `web/app/api/students/[id]/contracts/route.ts` - GET/POST
- `web/app/api/students/[id]/contracts/[contractId]/route.ts` - GET/PATCH/DELETE

## ✅ FASE 2 COMPLETA - Backfill e Índices

**Data:** 2025-10-02 10:42  
**Migration:** `202510021041_org_id_phase_1_backfill_indexes.sql`

### Ações
1. **Backfill:** `UPDATE students/student_services/student_billing/student_plan_contracts SET tenant_id=org_id WHERE tenant_id IS NULL`
2. **Índices únicos:**
   - `students_org_id_email_unique` (org_id, email) WHERE deleted_at IS NULL
3. **Índices de performance:**
   - `idx_students_org_id`
   - `idx_student_services_org_id`, `idx_student_services_student_org`
   - `idx_student_billing_org_id`, `idx_student_billing_student_org`
   - `idx_student_plan_contracts_org_id`, `idx_student_plan_contracts_student_org`

### Validações
- Contagem de registros com `org_id IS NULL` nas tabelas críticas
- Detecção de duplicados em (org_id, email)

## ✅ FASE 3 COMPLETA - RLS para org_id

**Data:** 2025-10-02 10:43  
**Migration:** `202510021042_org_id_phase_2_rls_helpers_and_policies.sql`

### Novos Helpers RLS
```sql
CREATE FUNCTION is_member_of_org(org uuid) RETURNS boolean
CREATE FUNCTION has_role_org(org uuid, roles text[]) RETURNS boolean
```

### Políticas Migradas
Substituído todas as políticas RLS de `students`, `student_services`, `student_billing`, `student_plan_contracts`:

**Antes:**
```sql
CREATE POLICY students_select ON students
  USING (deleted_at IS NULL AND is_member_of(tenant_id) ...)
```

**Depois:**
```sql
CREATE POLICY students_select ON students
  USING (deleted_at IS NULL AND is_member_of_org(org_id) ...)
```

### Tabelas com RLS 100% org_id
- ✅ students
- ✅ student_services
- ✅ student_billing
- ✅ student_plan_contracts

## ✅ FASE 4 COMPLETA - Validação E2E e Remoção de Fallbacks

**Data:** 2025-10-02 13:54  
**Deploy ID:** `dpl_ABpB4CHPUihnKp7H9yXuF3uCuphe` (READY)  
**Commit:** `53ea06f` - "Fase 4 - Remover fallbacks tenant_id das APIs"

### Validações E2E Executadas ✅
- ✅ **Teste 1: Webhook Hotmart**
  - Aluno criado: Carlos Eduardo E2E Test (carlos.e2e@teste.com)
  - Serviço vinculado: Plano Mensal E2E Test (R$ 199,90)
  - org_id e tenant_id sincronizados
  - Relacionamento student ← student_services funcionando

- ✅ **Teste 2: Módulo Financeiro CRUD**
  - READ: Listou serviço via filtro org_id ✅
  - UPDATE: Atualizou preço R$ 199,90 → R$ 299,90 ✅
  - CREATE: Criou Plano Trimestral Upgrade (R$ 499,00) ✅
  - DELETE: Removeu serviço anterior ✅

### Remoção de Fallbacks Completada ✅
- ✅ Removido `.or(org_id|tenant_id)` → `.eq('org_id')` em:
  - `web/app/api/students/route.ts` (GET)
  - `web/app/api/students/[id]/route.ts` (GET/PATCH/DELETE)
  - `web/app/api/students/[id]/services/route.ts` (GET/POST)
  - `web/app/api/students/[id]/services/[serviceId]/route.ts` (GET/PATCH/DELETE)
  - `web/app/api/students/[id]/billing/route.ts` (GET)
  - `web/app/api/students/[id]/contracts/route.ts` (GET/POST)
  - `web/app/api/students/[id]/contracts/[contractId]/route.ts` (GET/PATCH/DELETE)

- ✅ Removido writes de `tenant_id`:
  - `web/app/api/students/route.ts` (POST)
  - `web/app/api/students/[id]/services/route.ts` (POST)
  - `web/app/api/webhooks/hotmart/route.ts` (student_services insert)

## ⏳ FASE 5 FUTURA - Limpeza tenant_id

**Estimativa:** Após 2 ciclos de deploy estáveis (1 semana)

### Etapas Restantes
1. **Remover writes de tenant_id:**
   - Remover `tenant_id: ctx.tenantId` de todos os inserts/updates
2. **Remover fallbacks de APIs:**
   - Trocar `.or(org_id|tenant_id)` → `.eq('org_id')`
3. **Migrar tabelas restantes (48):**
   - Adicionar `org_id` NOT NULL
   - Backfill `org_id = tenant_id`
   - Atualizar RLS para usar `org_id`
4. **Tornar tenant_id NULLABLE:**
   - `ALTER TABLE <tabela> ALTER COLUMN tenant_id DROP NOT NULL`
5. **DROP tenant_id:**
   - Após validação completa: `ALTER TABLE <tabela> DROP COLUMN tenant_id`

## Métricas de Sucesso

- ✅ Zero downtime durante migração
- ✅ Backfill sem duplicados
- ✅ Índices únicos criados com sucesso
- ✅ Políticas RLS substituídas sem erros
- ✅ Validações E2E passando (webhook + CRUD)
- ✅ APIs usando org_id exclusivamente
- ✅ Writes de tenant_id removidos

## Próximos Passos

**Concluído até Fase 4!** Sistema estável com org_id nas tabelas críticas.

### Fase 5 Opcional (Limpeza Completa)
1. Migrar 48 tabelas restantes para org_id (gradual, conforme necessidade)
2. Monitorar produção por 1-2 semanas
3. Tornar tenant_id NULLABLE em todas as tabelas
4. Após estabilidade: DROP COLUMN tenant_id

### Recomendação
Manter tenant_id nas 48 tabelas não-críticas por enquanto. Migrar gradualmente conforme demanda de cada módulo.

## Rollback (se necessário)

### Reverter RLS (Fase 3)
```sql
-- Reverter para is_member_of(tenant_id)
-- Migrations de reversão disponíveis
```

### Reverter APIs (Fase 1)
```typescript
// Remover .or() e voltar para .eq('tenant_id')
git revert <commit-hash>
```

### Reverter Backfill (Fase 2)
Não é necessário: backfill `tenant_id=org_id` é seguro e mantém compatibilidade.

## Observações

- **Compatibilidade preservada:** APIs aceitam ambos os campos durante transição
- **RLS atualizado:** Políticas novas usam `org_id` mas continuam consultando `memberships.tenant_id`
- **Sem regressões:** Sistema continua funcionando normalmente durante migração
- **Incremental:** Migração pode ser pausada a qualquer momento sem impacto

