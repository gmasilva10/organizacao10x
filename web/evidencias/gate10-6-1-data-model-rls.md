# GATE 10.6.1 - DATA MODEL & RLS

**Data:** 2025-01-10  
**Status:** ✅ CONCLUÍDO  
**Próximo:** GATE 10.6.2 - Motor

## 📊 TABELAS CRIADAS

### **1. relationship_templates_v2**
- **Propósito:** Templates de mensagens para relacionamento
- **Colunas:** id, code, anchor, touchpoint, suggested_offset, channel_default, message_v1, message_v2, active, priority, audience_filter, variables, created_at, updated_at
- **Índices:** code (unique), active, anchor, priority
- **RLS:** Habilitado com políticas para SELECT/INSERT/UPDATE

### **2. relationship_tasks**
- **Propósito:** Tarefas de relacionamento agendadas
- **Colunas:** id, student_id, template_code, anchor, scheduled_for, channel, status, payload, variables_used, created_by, sent_at, notes, occurrence_id, created_at, updated_at
- **Índices:** student_id+scheduled_for, status+scheduled_for, occurrence_id, anchor, template_code, created_by
- **RLS:** Habilitado com políticas baseadas em tenant_id

### **3. relationship_logs**
- **Propósito:** Log de ações do sistema de relacionamento
- **Colunas:** id, student_id, task_id, action, channel, template_code, meta, at
- **Índices:** student_id+at, task_id, action, template_code
- **RLS:** Habilitado com políticas baseadas em tenant_id

## 🔒 RLS (ROW LEVEL SECURITY)

### **Políticas Implementadas:**
- **Templates:** Globais (SELECT/INSERT/UPDATE permitidos, DELETE bloqueado)
- **Tasks:** Filtradas por tenant_id do usuário autenticado
- **Logs:** Filtradas por tenant_id do usuário autenticado

### **Segurança:**
- Todas as tabelas com RLS habilitado
- Políticas baseadas em `auth.uid()` e `tenant_id`
- Funções de serviço com `SECURITY DEFINER`

## ⚙️ FUNÇÕES DE SERVIÇO

### **1. create_occurrence_followup_task()**
- **Parâmetros:** student_id, occurrence_id, reminder_at, template_code
- **Retorno:** UUID da tarefa criada
- **Funcionalidade:** Cria tarefa de follow-up baseada em ocorrência

### **2. recalculate_relationship_tasks()**
- **Parâmetros:** dry_run (boolean)
- **Retorno:** JSONB com estatísticas
- **Funcionalidade:** Recalcula tarefas (modo dry-run implementado)

## 📋 SEEDS APLICADOS

### **Templates MSG1-MSG10:**
- ✅ MSG1 - Logo Após a Venda (sale_close)
- ✅ MSG2 - Dia Anterior ao Primeiro Treino (first_workout)
- ✅ MSG3 - Após o Primeiro Treino (first_workout)
- ✅ MSG4 - Final da Primeira Semana (weekly_followup)
- ✅ MSG5 - Acompanhamento Semanal (weekly_followup)
- ✅ MSG6 - Revisão Mensal (monthly_review)
- ✅ MSG7 - Acompanhamento Mensal Motivacional (monthly_review)
- ✅ MSG8 - Aniversário (birthday)
- ✅ MSG9 - Feedback Trimestral (monthly_review)
- ✅ MSG10 - Novos Serviços (weekly_followup)

## 🧪 TESTES REALIZADOS

### **1. Estrutura das Tabelas:**
```sql
-- Verificação de tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'relationship%';
-- Resultado: relationship_templates_v2, relationship_tasks, relationship_logs
```

### **2. Seeds dos Templates:**
```sql
-- Verificação de templates inseridos
SELECT code, anchor, touchpoint, active FROM relationship_templates_v2 ORDER BY priority;
-- Resultado: 10 templates inseridos com sucesso
```

### **3. Função de Dry-Run:**
```sql
-- Teste da função de recálculo
SELECT recalculate_relationship_tasks(true);
-- Resultado: {"dry_run": true, "templates_count": 10, "message": "Dry-run mode..."}
```

## ✅ CRITÉRIOS DE ACEITE ATENDIDOS

- ✅ **Migrations das 3 tabelas** criadas com sucesso
- ✅ **Índices otimizados** implementados para performance
- ✅ **RLS habilitado** com políticas de segurança
- ✅ **Roles aplicadas** com funções de serviço
- ✅ **Seeds validados** - 10 templates inseridos
- ✅ **Funções testadas** - dry-run funcionando

## 🔧 ARQUIVOS CRIADOS

- `web/supabase/migrations/20250110_relationship_tables_p1.sql` - Migration principal
- `web/evidencias/gate10-6-1-data-model-rls.md` - Esta documentação

## 🚀 PRÓXIMO PASSO

**GATE 10.6.2 - Motor (03:00) + Recalcular + Gatilho Ocorrência**
- Job diário 03:00
- Endpoint de recálculo
- Gatilho de ocorrência
- Rate limiting e dedup
