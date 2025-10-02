# Auditoria: Migração tenant_id → org_id

**Data:** 2025-10-02  
**Objetivo:** Eliminar duplicidade tenant_id/org_id e padronizar em org_id único

## Resumo Executivo

### Tabelas com AMBOS (tenant_id + org_id)
- `students` ⚠️ CRÍTICO
- `student_services` ⚠️ CRÍTICO  
- `student_billing`
- `student_plan_contracts`

### Tabelas só com tenant_id (48 tabelas)
anamnese_answers, anamnese_invites, anamnese_questions_snapshot, anamnese_responses, anamnese_versions, anthro_protocols, audit_log, campaigns, client_messages, clients, events, guideline_rules, guidelines_versions, kanban_cards, kanban_columns, memberships, messages, occurrence_groups, occurrence_types, onboarding_cards, onboarding_columns, organization_settings, plan_policies, professional_profiles, professionals, profiles, readiness_types, relacionamento_messages, relationship_messages, relationship_templates, relationship_whatsapp_entities, relationship_whatsapp_history, sales_scripts, service_catalog, settings_audit, student_defaults, student_occurrence_attachments, student_occurrences, student_responsibles, student_whatsapp_groups, team_defaults, tenant_users, whatsapp_groups

### Tabelas só com org_id (10 tabelas)
audit_log_degraded, card_tasks, collaborators, hotmart_integrations, hotmart_product_mappings, hotmart_transactions, kanban_items, kanban_logs, kanban_stages, plans, service_onboarding_tasks

## Políticas RLS Críticas

### students (tabela mais crítica)
```sql
-- SELECT: usa tenant_id
is_member_of(tenant_id) AND has_role(tenant_id, [...])

-- UPDATE admin/manager: usa tenant_id
is_member_of(tenant_id) AND has_role(tenant_id, ['admin','manager'])

-- UPDATE trainer: usa tenant_id
is_member_of(tenant_id) AND has_role(tenant_id, ['trainer']) AND trainer_id=auth.uid()
```

### Padrão de RLS detectado
- Maioria usa `is_member_of(tenant_id)` e `has_role(tenant_id, [roles])`
- Algumas usam `profiles.tenant_id` para resolver org do usuário
- Algumas usam `memberships.tenant_id` diretamente

## Helpers RLS (functions)
- `is_member_of(tenant_id UUID)` → verifica se user pertence ao tenant
- `has_role(tenant_id UUID, roles TEXT[])` → verifica role do user no tenant

## Estratégia de Migração

### Fase 1: Preparação (compatibilidade dupla)
1. ✅ Backfill tenant_id=org_id onde null (JÁ FEITO)
2. Atualizar helpers RLS para aceitar org_id OR tenant_id
3. APIs: manter filtro `or=(org_id,tenant_id)` temporariamente
4. Garantir writes setam ambos

### Fase 2: Convergência
1. Índices: criar unique (org_id, email) em students
2. Backfill geral: todas as tabelas SET tenant_id=org_id WHERE tenant_id IS NULL
3. Smoke tests E2E

### Fase 3: Cutover para org_id
1. RLS: substituir is_member_of(tenant_id) → is_member_of(org_id)
2. APIs: remover filtros com tenant_id, usar só org_id
3. Remover writes de tenant_id

### Fase 4: Cleanup
1. Tornar tenant_id NULLABLE
2. Após 2 deploys estáveis, DROP COLUMN tenant_id

## Tabelas Prioritárias (ordem de execução)
1. `students` - base de tudo
2. `student_services` - financeiro crítico
3. `student_billing` - financeiro
4. `student_plan_contracts` - financeiro
5. `memberships` - controle de acesso
6. Demais tabelas de domínio

## Riscos e Mitigações

### Alto Risco
- **students**: RLS incorreta = vazamento de dados entre orgs
- **Mitigação**: smoke tests após cada fase; rollback rápido

### Médio Risco
- Queries hardcoded com tenant_id em views/functions
- **Mitigação**: auditoria de functions antes do cutover

### Baixo Risco
- Tabelas novas (hotmart_*, card_tasks) já usam org_id

