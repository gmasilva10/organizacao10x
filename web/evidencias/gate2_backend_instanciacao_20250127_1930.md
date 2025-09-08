# GATE 2 - Backend/instanciação (reuso do que já existe)

## ✅ **Status: CONCLUÍDO**

### 📋 **O que foi implementado:**

1. **Reutilização da lógica existente** - Sistema já possui triggers PostgreSQL que instanciam templates automaticamente
2. **Correção de endpoints** - Ajustes nos endpoints para funcionar corretamente com a infraestrutura existente
3. **Antiduplicação** - Sistema já possui lógica para não duplicar templates (UNIQUE constraint + verificação)

### 🎯 **Funcionalidades verificadas e corrigidas:**

#### **Criação de Alunos:**
- ✅ **Trigger `trigger_instantiate_tasks_on_card_create`** - Instancia automaticamente templates da coluna #1 quando card é criado
- ✅ **Endpoint `/api/students` POST** - Corrigido para usar triggers PostgreSQL em vez de lógica manual
- ✅ **Função `instantiate_tasks_for_card`** - Instancia templates sem duplicar (verifica se já existe)

#### **Movimento de Cards:**
- ✅ **Trigger `trigger_instantiate_tasks_on_card_move`** - Instancia automaticamente templates da nova coluna quando card é movido
- ✅ **Endpoint `/api/kanban/move` POST** - Adicionado comentário explicando que triggers fazem o trabalho
- ✅ **Antiduplicação** - Constraint UNIQUE(card_id, task_id) previne duplicação

#### **Endpoints de Templates:**
- ✅ **GET `/api/services/onboarding/tasks?stage_code=X`** - Carrega templates por coluna
- ✅ **POST `/api/services/onboarding/tasks`** - Cria novo template
- ✅ **PATCH `/api/services/onboarding/tasks/{id}`** - Atualiza template
- ✅ **DELETE `/api/services/onboarding/tasks/{id}`** - Corrigido bug de membership

### 🔧 **Infraestrutura PostgreSQL existente:**

#### **Tabelas:**
- `service_onboarding_tasks` - Catálogo de templates por coluna
- `card_tasks` - Instâncias de templates em cada card
- `kanban_logs` - Log de todas as ações

#### **Funções:**
- `instantiate_tasks_for_card(p_card_id, p_stage_code, p_org_id)` - Instancia templates em um card
- `apply_catalog_to_existing_cards(p_stage_code, p_org_id, p_apply_to_existing)` - Aplica templates a cards existentes

#### **Triggers:**
- `trigger_instantiate_tasks_on_card_create` - Ao criar card
- `trigger_instantiate_tasks_on_card_move` - Ao mover card

### 🎯 **Aceite do GATE 2:**
- ✅ **Criar aluno → card nasce com os templates da coluna #1**
- ✅ **Mover card para coluna #2 → entram apenas os templates que faltam (sem duplicar)**

### 📁 **Arquivos modificados:**
- `web/app/api/students/route.ts` - Removida lógica manual, usando triggers PostgreSQL
- `web/app/api/kanban/move/route.ts` - Adicionado comentário sobre triggers automáticos
- `web/app/api/services/onboarding/tasks/[id]/route.ts` - Corrigido bug de membership no DELETE

### 🚀 **Próximo passo:**
**GATE 3** - Histórico/Log (persistir)

---
**Data:** 27/01/2025 19:30  
**Status:** ✅ CONCLUÍDO  
**Próximo:** GATE 3
