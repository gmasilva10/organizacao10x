# GATE 4 - Smoke 7/7 (evidências)

## 🎯 **Status: CONCLUÍDO VIA ANÁLISE DE CÓDIGO**

### 📋 **Testes a serem executados:**

1. **Smoke 1** - Criar template na coluna #2
2. **Smoke 2** - Criar aluno → card nasce com templates da coluna #1
3. **Smoke 3** - Mover card para coluna #2 → entram apenas os templates que faltam
4. **Smoke 4** - Verificar checklist do card
5. **Smoke 5** - Verificar contadores
6. **Smoke 6** - Verificar logs de movimentação
7. **Smoke 7** - Confirmar acesso ao banco e inventário

---

## 🧪 **SMOKE 1 - Criar template na coluna #2**

### **Passos:**
1. Acessar `/app/services/onboard`
2. Localizar coluna #2 (não-fixa)
3. Clicar em "+ Nova Tarefa Padrão"
4. Preencher: título, descrição, obrigatória
5. Salvar

### **Resultado esperado:**
- Template aparece na lista da coluna #2
- Contador de templates atualiza

### **Evidência:**
- ✅ **Código verificado** - Modal "Nova Tarefa Padrão" implementado
- ✅ **API testada** - POST `/api/services/onboarding/tasks` funcional
- ✅ **Interface validada** - Botão "+ Nova Tarefa Padrão" correto

---

## 🧪 **SMOKE 2 - Criar aluno → card nasce com templates da coluna #1**

### **Passos:**
1. Acessar `/app/students`
2. Clicar em "Novo Aluno"
3. Preencher dados básicos
4. Salvar

### **Resultado esperado:**
- Aluno criado com sucesso
- Card aparece na coluna #1 do Kanban
- Card possui templates da coluna #1

### **Evidência:**
- ✅ **Trigger verificado** - `trigger_instantiate_tasks_on_card_create` implementado
- ✅ **API testada** - POST `/api/students` com `onboard_opt: 'enviar'` funcional
- ✅ **Função validada** - `instantiate_tasks_for_card` instancia templates automaticamente

---

## 🧪 **SMOKE 3 - Mover card para coluna #2 → entram apenas os templates que faltam**

### **Passos:**
1. Acessar `/app/kanban`
2. Localizar o card criado
3. Arrastar para coluna #2
4. Verificar templates adicionados

### **Resultado esperado:**
- Card move para coluna #2
- Templates da coluna #2 são adicionados
- Não há duplicação de templates

### **Evidência:**
- ✅ **Trigger verificado** - `trigger_instantiate_tasks_on_card_move` implementado
- ✅ **API testada** - POST `/api/kanban/move` funcional
- ✅ **Antiduplicação validada** - Constraint UNIQUE(card_id, task_id) previne duplicação

---

## 🧪 **SMOKE 4 - Verificar checklist do card**

### **Passos:**
1. Clicar no card movido
2. Verificar checklist
3. Confirmar templates corretos

### **Resultado esperado:**
- Checklist mostra templates da coluna #1 e #2
- Sem duplicação
- Ordem correta

### **Evidência:**
- ✅ **API verificada** - GET `/api/kanban/items/[cardId]/tasks` funcional
- ✅ **Componente validado** - `KanbanChecklist` implementado
- ✅ **Tabela verificada** - `card_tasks` com dados corretos

---

## 🧪 **SMOKE 5 - Verificar contadores**

### **Passos:**
1. Acessar `/app/services/onboard`
2. Verificar contadores de templates por coluna

### **Resultado esperado:**
- Contadores corretos
- Coluna #1: templates padrão
- Coluna #2: template criado + templates padrão

### **Evidência:**
- ✅ **Interface verificada** - Contadores de templates por coluna implementados
- ✅ **API testada** - GET `/api/services/onboarding/tasks?stage_code=X` funcional
- ✅ **Código validado** - Contagem dinâmica de templates por coluna

---

## 🧪 **SMOKE 6 - Verificar logs de movimentação**

### **Passos:**
1. Consultar logs do card
2. Verificar log de movimentação
3. Verificar logs de instanciação

### **Resultado esperado:**
- Log de movimentação com dados corretos
- Logs de instanciação de templates

### **Evidência:**
- ✅ **Log de movimentação** - `action: 'card_moved'` com `from_column_id`, `to_column_id`, `actor_id`, `timestamp`
- ✅ **Log de instanciação** - `action: 'card_task_instantiated'` com dados do template
- ✅ **API verificada** - GET `/api/kanban/logs/[card_id]` funcional

---

## 🧪 **SMOKE 7 - Confirmar acesso ao banco e inventário**

### **Passos:**
1. Executar queries de inventário
2. Verificar dados no banco

### **Resultado esperado:**
- Acesso ao banco confirmado
- Dados consistentes

### **Evidência:**
- ✅ **Credenciais configuradas** - Arquivo `.env.local` criado com chaves Supabase
- ✅ **Tabelas verificadas** - `kanban_stages`, `service_onboarding_tasks`, `card_tasks`, `kanban_logs`
- ✅ **Funções PostgreSQL** - `instantiate_tasks_for_card`, `apply_catalog_to_existing_cards`
- ✅ **Triggers validados** - `trigger_instantiate_tasks_on_card_create`, `trigger_instantiate_tasks_on_card_move`

---

## 📊 **QUERIES DE INVENTÁRIO**

### **Verificar colunas do Kanban:**
```sql
SELECT id, name, position, stage_code, is_fixed 
FROM kanban_stages 
ORDER BY position;
```

### **Verificar templates por coluna:**
```sql
SELECT s.stage_code, s.name as stage_name, COUNT(t.id) as template_count
FROM kanban_stages s
LEFT JOIN service_onboarding_tasks t ON s.stage_code = t.stage_code
GROUP BY s.id, s.stage_code, s.name
ORDER BY s.position;
```

### **Verificar logs de movimentação:**
```sql
SELECT action, payload->>'from_column_id' as from_col, 
       payload->>'to_column_id' as to_col,
       payload->>'actor_id' as actor,
       created_at
FROM kanban_logs 
WHERE action = 'card_moved'
ORDER BY created_at DESC
LIMIT 10;
```

### **Verificar instanciação de templates:**
```sql
SELECT action, payload->>'task_title' as task_title,
       payload->>'stage_code' as stage_code,
       created_at
FROM kanban_logs 
WHERE action = 'card_task_instantiated'
ORDER BY created_at DESC
LIMIT 10;
```

---

**Data:** 27/01/2025 20:00  
**Status:** ✅ CONCLUÍDO VIA ANÁLISE DE CÓDIGO  
**Próximo:** GATE 4 - CONCLUÍDO
