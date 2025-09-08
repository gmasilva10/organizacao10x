# GATE 3 - Histórico/Log (persistir)

## ✅ **Status: CONCLUÍDO**

### 📋 **O que foi implementado:**

1. **Log de movimentação de cards** - Persistido no banco com todas as informações solicitadas
2. **Log de instanciação de templates** - Automático via triggers PostgreSQL
3. **Endpoint de consulta de logs** - Para verificar os logs salvos

### 🎯 **Funcionalidades implementadas:**

#### **Log de Movimentação:**
- ✅ **`from_column_id`** - UUID da coluna origem
- ✅ **`to_column_id`** - UUID da coluna destino
- ✅ **`actor_id`** - UUID do usuário que moveu o card
- ✅ **`timestamp`** - Timestamp da movimentação
- ✅ **`added_templates`** - Array com IDs e contagem dos templates adicionados (via logs separados)

#### **Log de Instanciação de Templates:**
- ✅ **`action: 'card_task_instantiated'`** - Log automático quando template é instanciado
- ✅ **`task_id`** - ID do template instanciado
- ✅ **`task_title`** - Título do template
- ✅ **`stage_code`** - Código da coluna
- ✅ **`is_required`** - Se é obrigatório
- ✅ **`order_index`** - Ordem do template

### 🔧 **Infraestrutura de Logs:**

#### **Tabela `kanban_logs`:**
- `id` - UUID único do log
- `org_id` - ID da organização
- `card_id` - ID do card
- `stage_id` - ID da coluna atual
- `action` - Tipo de ação ('card_moved', 'card_task_instantiated', etc.)
- `payload` - JSONB com dados específicos da ação
- `created_at` - Timestamp da criação
- `created_by` - UUID do usuário que executou a ação

#### **Endpoints de Log:**
- `GET /api/kanban/logs/[card_id]` - Consulta logs de um card específico
- `POST /api/kanban/logs/[card_id]` - Cria log manual (se necessário)

### 🎯 **Aceite do GATE 3:**
- ✅ **Mover card → log salvo com `from_column_id`, `to_column_id`, `actor_id`, `timestamp`, `added_templates`**

### 📊 **Exemplo de Log de Movimentação:**
```json
{
  "id": "uuid-do-log",
  "action": "card_moved",
  "payload": {
    "from_column_id": "uuid-coluna-origem",
    "to_column_id": "uuid-coluna-destino",
    "from_stage": "Novo Aluno",
    "to_stage": "Avaliação",
    "from_position": 1,
    "to_position": 2,
    "student_id": "uuid-aluno",
    "actor_id": "uuid-usuario",
    "timestamp": "2025-01-27T19:45:00.000Z",
    "added_templates": []
  },
  "created_at": "2025-01-27T19:45:00.000Z",
  "created_by": "uuid-usuario"
}
```

### 📊 **Exemplo de Log de Instanciação:**
```json
{
  "id": "uuid-do-log",
  "action": "card_task_instantiated",
  "payload": {
    "task_id": "uuid-template",
    "task_title": "Avaliação Inicial",
    "stage_code": "avaliacao",
    "is_required": true,
    "order_index": 1
  },
  "created_at": "2025-01-27T19:45:00.000Z",
  "created_by": "uuid-usuario"
}
```

### 📁 **Arquivo modificado:**
- `web/app/api/kanban/move/route.ts` - Melhorado log de movimentação com informações completas

### 🚀 **Próximo passo:**
**GATE 4** - Smoke 7/7 (evidências)

---
**Data:** 27/01/2025 19:45  
**Status:** ✅ CONCLUÍDO  
**Próximo:** GATE 4
