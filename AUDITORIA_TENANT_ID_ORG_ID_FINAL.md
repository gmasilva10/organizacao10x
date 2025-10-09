# Auditoria Completa: Migração tenant_id → org_id
**Data:** 2025-01-08  
**Status:** EM PROGRESSO  
**Objetivo:** Identificar e corrigir TODAS as referências ao campo `tenant_id` no sistema

---

## 📋 Resumo Executivo

A auditoria identificou que, apesar da migração anterior, ainda existem **múltiplas referências** ao campo `tenant_id` em:
- ✅ **Funções do banco de dados** (já corrigidas na migração 20250108_fix_functions_tenant_id_to_org_id.sql)
- ❌ **Políticas RLS** (ainda usam `tenant_id` em várias tabelas)
- ❌ **Tabelas** (ainda mantêm coluna `tenant_id` mesmo após migração)
- ✅ **Código TypeScript/JavaScript** (nenhuma referência encontrada)
- ⚠️ **Scripts e arquivos de teste** (algumas referências em scripts de teste)

---

## 🔍 Problemas Identificados

### 1. Funções do Banco de Dados ✅ CORRIGIDO

As seguintes funções foram identificadas e **JÁ FORAM CORRIGIDAS** na migração `20250108_fix_functions_tenant_id_to_org_id.sql`:

- `has_role(tenant uuid, roles text[])` - Usa `m.org_id = tenant` internamente ✅
- `has_role_org(org uuid, roles text[])` - Usa `m.org_id = org` internamente ✅
- `seed_occurrences_taxonomy(target_tenant_id uuid)` - Parâmetro ainda se chama `target_tenant_id` mas usa `org_id` internamente ✅
- `check_single_default_guideline()` - Usa `org_id` internamente ✅

**Observação:** Embora as funções estejam corrigidas internamente, o nome do parâmetro `target_tenant_id` em `seed_occurrences_taxonomy` pode causar confusão.

---

### 2. Políticas RLS ❌ PENDENTE

As seguintes políticas RLS ainda usam `tenant_id` e **PRECISAM SER CORRIGIDAS**:

#### 2.1 Tabela: `relationship_logs`
**Arquivo:** `supabase/migrations/20250129_relationship_logs_table.sql`

```sql
-- PROBLEMA: Usa tenant_id da tabela memberships
WHERE tenant_id IN (
    SELECT tenant_id FROM public.memberships 
    WHERE user_id = auth.uid()
)
```

**Correção Necessária:** Substituir por `org_id`

#### 2.2 Tabela: `professionals`
**Arquivo:** `supabase/migrations/20250130_add_professionals_status.sql`

```sql
-- PROBLEMA: Usa auth.jwt() ->> 'tenant_id'
tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
```

**Correção Necessária:** Substituir por `org_id = (SELECT org_id FROM memberships WHERE user_id = auth.uid() LIMIT 1)`

#### 2.3 Tabela: `anamnese_invites`
**Arquivo:** `supabase/migrations/20250920_anamnese_invites.sql`

```sql
-- PROBLEMA: Usa auth.jwt() ->> 'tenant_id'
USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

**Correção Necessária:** Substituir por `org_id`

#### 2.4 Tabela: `anamnese_responses`
**Arquivo:** `supabase/migrations/20250920_anamnese_invites.sql`

```sql
-- PROBLEMA: Usa auth.jwt() ->> 'tenant_id'
USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

**Correção Necessária:** Substituir por `org_id`

#### 2.5 Tabela: `collaborators`
**Arquivo:** `supabase/migrations/cfg-team-p1.sql`

```sql
-- PROBLEMA: Usa tenant_id da tabela memberships
org_id IN (
    SELECT tenant_id FROM public.memberships 
    WHERE user_id = auth.uid()
)
```

**Correção Necessária:** Substituir por `org_id`

#### 2.6 Tabela: `professional_profiles`
**Arquivo:** `supabase/migrations/20250128_equipe_p1.sql`

```sql
-- PROBLEMA: Usa tenant_id da tabela memberships
FOR ALL USING (tenant_id = (SELECT tenant_id FROM memberships WHERE user_id = auth.uid() AND status = 'active'));
```

**Correção Necessária:** Substituir por `org_id`

#### 2.7 Tabela: `professionals`
**Arquivo:** `supabase/migrations/20250128_equipe_p1.sql`

```sql
-- PROBLEMA: Usa tenant_id da tabela memberships
FOR ALL USING (tenant_id = (SELECT tenant_id FROM memberships WHERE user_id = auth.uid() AND status = 'active'));
```

**Correção Necessária:** Substituir por `org_id`

#### 2.8 Tabela: `occurrence_groups`
**Arquivo:** `supabase/migrations/20250128_occurrences_tables.sql`

```sql
-- PROBLEMA: Usa tenant_id da tabela memberships
tenant_id IN (
    SELECT tenant_id FROM memberships 
    WHERE user_id = auth.uid()
)
```

**Correção Necessária:** Substituir por `org_id`

#### 2.9 Tabela: `occurrence_types`
**Arquivo:** `supabase/migrations/20250128_occurrences_tables.sql`

```sql
-- PROBLEMA: Usa tenant_id da tabela memberships
tenant_id IN (
    SELECT tenant_id FROM memberships 
    WHERE user_id = auth.uid()
)
```

**Correção Necessária:** Substituir por `org_id`

#### 2.10 Tabela: `student_occurrences`
**Arquivo:** `supabase/migrations/20250128_occurrences_tables.sql`

```sql
-- PROBLEMA: Usa tenant_id da tabela memberships
tenant_id IN (
    SELECT tenant_id FROM memberships 
    WHERE user_id = auth.uid()
)
```

**Correção Necessária:** Substituir por `org_id`

#### 2.11 Tabela: `student_occurrence_attachments`
**Arquivo:** `supabase/migrations/20250128_student_occurrence_attachments.sql`

```sql
-- PROBLEMA: Usa tenant_id da tabela memberships
tenant_id IN (
    SELECT tenant_id FROM memberships 
    WHERE user_id = auth.uid()
)
```

**Correção Necessária:** Substituir por `org_id`

#### 2.12 Tabela: `student_occurrence_attachments` (Storage)
**Arquivo:** `supabase/migrations/20250904_occurrence_attachments_p3.sql`

```sql
-- PROBLEMA: Usa tenant_id da tabela memberships
WHERE tenant_id IN (
    SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
)
```

**Correção Necessária:** Substituir por `org_id`

#### 2.13 Tabela: `plans`
**Arquivo:** `supabase/migrations/20250127_plans_financial_v01.sql`

```sql
-- PROBLEMA: Usa tenant_id em vez de org_id
FOR SELECT USING (tenant_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

**Correção Necessária:** Substituir `tenant_id` por `org_id`

#### 2.14 Tabela: `student_plan_contracts`
**Arquivo:** `supabase/migrations/20250127_plans_financial_v01.sql`

```sql
-- PROBLEMA: Usa tenant_id em vez de org_id
FOR SELECT USING (tenant_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

**Correção Necessária:** Substituir `tenant_id` por `org_id`

#### 2.15 Tabela: `students`
**Arquivo:** `web/supabase/migrations/20250110000000_create_students_table.sql`

```sql
-- PROBLEMA: Usa tenant_id da tabela memberships
tenant_id IN (
    SELECT tenant_id FROM memberships 
    WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
)
```

**Correção Necessária:** Substituir por `org_id`

#### 2.16 Tabela: `relationship_tasks`
**Arquivo:** `web/supabase/migrations/20250110_relationship_tables_p1.sql`

```sql
-- PROBLEMA: Usa tenant_id da tabela students
SELECT id FROM students WHERE tenant_id = (
    SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
)
```

**Correção Necessária:** Substituir por `org_id`

#### 2.17 Tabela: `relationship_messages`
**Arquivo:** `web/supabase/migrations/20250110_relationship_tables_p1.sql`

```sql
-- PROBLEMA: Usa tenant_id da tabela students
SELECT id FROM students WHERE tenant_id = (
    SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
)
```

**Correção Necessária:** Substituir por `org_id`

#### 2.18 Tabela: `relationship_templates_v2`
**Arquivo:** `web/supabase/migrations/20250929_relationship_templates_v2.sql`

```sql
-- PROBLEMA: Usa tenant_id da tabela memberships
tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid())
```

**Correção Necessária:** Substituir por `org_id`

#### 2.19 Tabela: `student_anamnesis_versions`
**Arquivo:** `web/supabase/migrations/20250910180000_student_anamnesis_tables.sql`

```sql
-- PROBLEMA: Usa tenant_id da tabela memberships
tenant_id IN (
    SELECT tenant_id FROM memberships 
    WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
)
```

**Correção Necessária:** Substituir por `org_id`

#### 2.20 Tabela: `student_anamnesis_latest`
**Arquivo:** `web/supabase/migrations/20250910180000_student_anamnesis_tables.sql`

```sql
-- PROBLEMA: Usa tenant_id da tabela memberships
tenant_id IN (
    SELECT tenant_id FROM memberships 
    WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
)
```

**Correção Necessária:** Substituir por `org_id`

---

### 3. Tabelas com Coluna tenant_id ❌ PENDENTE

As seguintes tabelas ainda mantêm a coluna `tenant_id` mesmo após a migração:

#### 3.1 Tabela: `relationship_templates`
**Arquivo:** `supabase/migrations/relationship-mvp.sql`

```sql
CREATE TABLE IF NOT EXISTS public.relationship_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,  -- ❌ DEVE SER org_id
  ...
);
```

**Correção Necessária:** 
1. Adicionar coluna `org_id`
2. Backfill: `UPDATE relationship_templates SET org_id = tenant_id WHERE org_id IS NULL`
3. Tornar `org_id` NOT NULL
4. Remover coluna `tenant_id`

#### 3.2 Tabela: `relationship_messages`
**Arquivo:** `supabase/migrations/relationship-mvp.sql`

```sql
CREATE TABLE IF NOT EXISTS public.relationship_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,  -- ❌ DEVE SER org_id
  ...
);
```

**Correção Necessária:** 
1. Adicionar coluna `org_id`
2. Backfill: `UPDATE relationship_messages SET org_id = tenant_id WHERE org_id IS NULL`
3. Tornar `org_id` NOT NULL
4. Remover coluna `tenant_id`

#### 3.3 Tabela: `student_services`
**Arquivo:** `supabase/migrations/stu-b.sql`

```sql
CREATE TABLE IF NOT EXISTS public.student_services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,  -- ❌ DEVE SER org_id
  ...
);
```

**Correção Necessária:** 
1. Adicionar coluna `org_id`
2. Backfill: `UPDATE student_services SET org_id = tenant_id WHERE org_id IS NULL`
3. Tornar `org_id` NOT NULL
4. Remover coluna `tenant_id`

#### 3.4 Tabela: `relationship_templates_v2`
**Arquivo:** `web/supabase/migrations/20250929_relationship_templates_v2.sql`

```sql
CREATE TABLE IF NOT EXISTS public.relationship_templates_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,  -- ❌ DEVE SER org_id
  ...
  UNIQUE (tenant_id, code)
);
```

**Correção Necessária:** 
1. Adicionar coluna `org_id`
2. Backfill: `UPDATE relationship_templates_v2 SET org_id = tenant_id WHERE org_id IS NULL`
3. Tornar `org_id` NOT NULL
4. Atualizar constraint UNIQUE para usar `org_id`
5. Remover coluna `tenant_id`

#### 3.5 Tabela: `students`
**Arquivo:** `web/supabase/migrations/20250110000000_create_students_table.sql`

```sql
CREATE TABLE IF NOT EXISTS students (
  ...
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,  -- ❌ DEVE SER org_id
  ...
);
```

**Correção Necessária:** 
1. Adicionar coluna `org_id`
2. Backfill: `UPDATE students SET org_id = tenant_id WHERE org_id IS NULL`
3. Tornar `org_id` NOT NULL
4. Remover coluna `tenant_id`

#### 3.6 Tabela: `student_anamnesis_versions`
**Arquivo:** `web/supabase/migrations/20250910180000_student_anamnesis_tables.sql`

```sql
CREATE TABLE IF NOT EXISTS student_anamnesis_versions (
  ...
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,  -- ❌ DEVE SER org_id
  ...
  UNIQUE(student_id, version_n, tenant_id),
);
```

**Correção Necessária:** 
1. Adicionar coluna `org_id`
2. Backfill: `UPDATE student_anamnesis_versions SET org_id = tenant_id WHERE org_id IS NULL`
3. Tornar `org_id` NOT NULL
4. Atualizar constraint UNIQUE para usar `org_id`
5. Remover coluna `tenant_id`

#### 3.7 Tabela: `student_anamnesis_latest`
**Arquivo:** `web/supabase/migrations/20250910180000_student_anamnesis_tables.sql`

```sql
CREATE TABLE IF NOT EXISTS student_anamnesis_latest (
  ...
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,  -- ❌ DEVE SER org_id
  ...
  PRIMARY KEY(student_id, tenant_id)
);
```

**Correção Necessária:** 
1. Adicionar coluna `org_id`
2. Backfill: `UPDATE student_anamnesis_latest SET org_id = tenant_id WHERE org_id IS NULL`
3. Tornar `org_id` NOT NULL
4. Atualizar PRIMARY KEY para usar `org_id`
5. Remover coluna `tenant_id`

---

### 4. Índices ❌ PENDENTE

Os seguintes índices ainda usam `tenant_id` e **PRECISAM SER ATUALIZADOS**:

```sql
-- PROBLEMA: Índices baseados em tenant_id
CREATE INDEX idx_relationship_templates_tenant ON public.relationship_templates(tenant_id);
CREATE INDEX idx_relationship_messages_tenant ON public.relationship_messages(tenant_id);
CREATE INDEX idx_student_services_tenant ON public.student_services(tenant_id);
CREATE INDEX idx_students_tenant_id ON students(tenant_id);
CREATE INDEX idx_student_anamnesis_versions_student_id ON student_anamnesis_versions(student_id, tenant_id);
CREATE INDEX idx_rt_v2_tenant ON public.relationship_templates_v2(tenant_id);
```

**Correção Necessária:**
1. Remover índices antigos
2. Criar novos índices baseados em `org_id`

---

### 5. Scripts e Arquivos de Teste ⚠️ ATENÇÃO

Os seguintes scripts ainda usam `tenant_id` em chamadas de API:

#### 5.1 Script: `web/scripts/smoke_relationship_curl.md`
```bash
--data "{\"tenant_id\":\"$TENANT_ID\"}"
```

#### 5.2 Script: `web/scripts/smoke_relationship.sh`
```bash
--data "{\"tenant_id\":\"$TENANT_ID\"}"
```

#### 5.3 Script: `web/scripts/create-plans-tables.ts`
```sql
tenant_id = (SELECT org_id FROM users WHERE id = auth.uid())
```

#### 5.4 Script: `web/scripts/create-user-tables.ts`
```sql
tenant_id = (SELECT org_id FROM users WHERE id = auth.uid())
```

**Correção Necessária:** Atualizar scripts para usar `org_id`

---

### 6. Código TypeScript/JavaScript ✅ LIMPO

**Resultado:** Nenhuma referência a `tenant_id` encontrada no código TypeScript/JavaScript dos diretórios:
- `web/app`
- `web/components`
- `web/lib`

---

## 📝 Plano de Ação

### Fase 1: Correção de Políticas RLS ✅ MIGRAÇÃO CRIADA
**Arquivo:** `supabase/migrations/20250108_complete_tenant_id_cleanup.sql`

1. ✅ Criar migração para corrigir todas as políticas RLS
2. ✅ Atualizar políticas de `relationship_logs`
3. ✅ Atualizar políticas de `professionals`
4. ✅ Atualizar políticas de `anamnese_invites` e `anamnese_responses`
5. ✅ Atualizar políticas de `collaborators`
6. ✅ Atualizar políticas de `professional_profiles`
7. ✅ Atualizar políticas de `occurrence_groups`, `occurrence_types`, `student_occurrences`
8. ✅ Atualizar políticas de `student_occurrence_attachments`
9. ✅ Atualizar políticas de `relationship_templates_v2`
10. ✅ Atualizar políticas de `student_anamnesis_versions` e `student_anamnesis_latest`
11. ✅ Atualizar políticas de `students`
12. ✅ Atualizar políticas de `relationship_tasks` e `relationship_messages`
13. ✅ Atualizar políticas de `plans` e `student_plan_contracts`
14. ✅ Atualizar políticas de `memberships`
15. ✅ Atualizar políticas de Storage

### Fase 2: Migração de Tabelas ✅ MIGRAÇÃO CRIADA
**Arquivo:** `supabase/migrations/20250108_complete_tenant_id_cleanup.sql`

1. ✅ Adicionar coluna `org_id` em todas as tabelas que ainda usam `tenant_id`
2. ✅ Backfill `org_id = tenant_id`
3. ✅ Tornar `org_id` NOT NULL
4. ✅ Atualizar constraints UNIQUE e PRIMARY KEY
5. ✅ Remover coluna `tenant_id`

### Fase 3: Atualização de Índices ✅ MIGRAÇÃO CRIADA
**Arquivo:** `supabase/migrations/20250108_complete_tenant_id_cleanup.sql`

1. ✅ Remover índices antigos baseados em `tenant_id`
2. ✅ Criar novos índices baseados em `org_id`

### Fase 4: Atualização de Scripts ⏳ PENDENTE

1. ⏳ Atualizar `web/scripts/smoke_relationship_curl.md`
2. ⏳ Atualizar `web/scripts/smoke_relationship.sh`
3. ⏳ Atualizar `web/scripts/create-plans-tables.ts`
4. ⏳ Atualizar `web/scripts/create-user-tables.ts`

### Fase 5: Validação e Testes ⏳ PENDENTE

1. ⏳ Executar migração `20250108_complete_tenant_id_cleanup.sql`
2. ⏳ Verificar se todas as políticas RLS foram atualizadas
3. ⏳ Verificar se todas as tabelas foram migradas
4. ⏳ Verificar se todos os índices foram atualizados
5. ⏳ Testar funcionalidades críticas
6. ⏳ Validar logs de erro

---

## 🚀 Próximos Passos

### Imediato (Hoje)
1. ✅ Criar migração `20250108_complete_tenant_id_cleanup.sql`
2. ⏳ Executar migração no banco de dados de desenvolvimento
3. ⏳ Validar que todas as políticas RLS foram atualizadas
4. ⏳ Validar que todas as tabelas foram migradas

### Curto Prazo (Esta Semana)
1. ⏳ Atualizar scripts de teste
2. ⏳ Executar testes de integração
3. ⏳ Validar funcionalidades críticas
4. ⏳ Documentar mudanças

### Médio Prazo (Próxima Semana)
1. ⏳ Executar migração no banco de dados de staging
2. ⏳ Executar testes de regressão
3. ⏳ Preparar rollback plan
4. ⏳ Executar migração no banco de dados de produção

---

## 📊 Métricas

### Referências Identificadas
- **Políticas RLS:** 20 políticas com referências a `tenant_id`
- **Tabelas:** 7 tabelas com coluna `tenant_id`
- **Índices:** 6 índices baseados em `tenant_id`
- **Scripts:** 4 scripts com referências a `tenant_id`
- **Código TypeScript:** 0 referências encontradas ✅

### Status de Correção
- **Funções:** 100% corrigidas ✅
- **Políticas RLS:** 0% corrigidas (migração criada) ⏳
- **Tabelas:** 0% migradas (migração criada) ⏳
- **Índices:** 0% atualizados (migração criada) ⏳
- **Scripts:** 0% atualizados ⏳
- **Código TypeScript:** 100% limpo ✅

---

## ⚠️ Riscos e Mitigações

### Risco 1: Downtime durante migração
**Mitigação:** 
- Executar migração em horário de baixo tráfego
- Preparar rollback plan
- Testar migração em ambiente de staging primeiro

### Risco 2: Políticas RLS incorretas
**Mitigação:**
- Validar políticas RLS após migração
- Testar acesso de diferentes roles
- Monitorar logs de erro

### Risco 3: Dados inconsistentes
**Mitigação:**
- Fazer backup completo antes da migração
- Validar integridade dos dados após migração
- Preparar scripts de correção se necessário

---

## 📞 Contato

Para dúvidas ou problemas relacionados a esta migração, entre em contato com a equipe de desenvolvimento.

---

**Última Atualização:** 2025-01-08  
**Responsável:** Equipe de Desenvolvimento  
**Status:** EM PROGRESSO
