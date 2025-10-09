# ✅ Solução: Colunas Obrigatórias #1 e #99 no Kanban

**Data:** 08/10/2025  
**Objetivo:** Garantir que todas as organizações tenham as colunas #1 (Novo Aluno) e #99 (Entrega do Treino) criadas automaticamente

---

## 📋 **Resumo da Solução**

### **Lógica Implementada:**

1. **Colunas Obrigatórias:**
   - **#1 - Novo Aluno** (is_fixed: true, stage_code: 'novo_aluno')
   - **#99 - Entrega do Treino** (is_fixed: true, stage_code: 'entrega_treino')

2. **Independência por Organização:**
   - Cada organização tem suas próprias colunas (isoladas por `org_id`)
   - Nomes podem ser personalizados por organização
   - Posições #1 e #99 são fixas e obrigatórias

3. **Criação Automática:**
   - Ao acessar o onboarding pela primeira vez, as colunas são criadas automaticamente
   - Colunas intermediárias (#2, #3, etc.) são criadas como exemplo para novas organizações

---

## 🔧 **Arquivos Modificados**

### 1. **`web/app/api/kanban/board/init/route.ts`**

**Alterações:**
- ✅ Lógica melhorada para criar colunas obrigatórias
- ✅ Verificação de duplicatas antes de criar
- ✅ Uso de `Prefer: resolution=ignore-duplicates` para evitar erros
- ✅ Criação de colunas intermediárias apenas para organizações novas

**Código Principal:**
```typescript
// Sempre garantir que as colunas obrigatórias #1 e #99 existam
const hasPos1 = Array.isArray(rows) && rows.some((r: any) => Number(r.position) === 1)
const hasPos99 = Array.isArray(rows) && rows.some((r: any) => Number(r.position) === 99)

const columnsToCreate = []

// Coluna #1 obrigatória
if (!hasPos1) {
  columnsToCreate.push({ 
    org_id: ctx.tenantId, 
    name: 'Novo Aluno', 
    position: 1, 
    is_fixed: true, 
    stage_code: 'novo_aluno' 
  })
}

// Coluna #99 obrigatória
if (!hasPos99) {
  columnsToCreate.push({ 
    org_id: ctx.tenantId, 
    name: 'Entrega do Treino', 
    position: 99, 
    is_fixed: true, 
    stage_code: 'entrega_treino' 
  })
}
```

### 2. **`web/app/api/kanban/board/route.ts`**

**Alterações:**
- ✅ Inicialização automática quando não há colunas
- ✅ Recarregamento automático após inicialização

**Código Principal:**
```typescript
// Se não houver colunas, inicializar automaticamente
if (columns.length === 0) {
  try {
    const initUrl = new URL('/api/kanban/board/init', request.url)
    await fetch(initUrl.toString(), { 
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || ''
      }
    })
    // Recarregar colunas após inicialização
    // ...
  } catch (initError) {
    console.error('Erro ao inicializar board automaticamente:', initError)
  }
}
```

---

## 🗄️ **Migração do Banco de Dados**

### **Arquivo:** `web/supabase/migrations/20251008200000_kanban_stages_unique_constraint.sql`

**Objetivos:**
1. ✅ Remover duplicatas existentes
2. ✅ Adicionar constraint de unicidade `(org_id, position)`
3. ✅ Criar índice para performance
4. ✅ Garantir colunas #1 e #99 para organizações existentes

### **Como Aplicar:**

#### **Opção 1: Via Supabase Dashboard**
1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o conteúdo do arquivo `web/supabase/migrations/20251008200000_kanban_stages_unique_constraint.sql`

#### **Opção 2: Via Script Simplificado**
1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o conteúdo do arquivo `web/scripts/fix-kanban-duplicates.sql`

#### **Opção 3: Via CLI (se configurado)**
```bash
cd web
npx supabase db push
```

---

## 🧪 **Como Testar**

### **Teste 1: Nova Organização**
1. Criar uma nova organização
2. Acessar `/app/onboarding`
3. Verificar que as colunas #1 e #99 foram criadas automaticamente
4. Verificar que há colunas intermediárias (#2, #3) como exemplo

### **Teste 2: Organização Existente**
1. Acessar `/app/onboarding` com organização existente
2. Verificar que as colunas #1 e #99 existem
3. Se não existirem, devem ser criadas automaticamente

### **Teste 3: Personalização**
1. Ir em **Serviços** → **Onboarding**
2. Editar o nome da coluna #1 ou #99
3. Verificar que a alteração afeta apenas a organização atual
4. Verificar que outras organizações não são afetadas

---

## 📊 **Verificação no Banco**

### **Consulta SQL para verificar colunas:**
```sql
SELECT org_id, position, name, is_fixed, stage_code, created_at
FROM kanban_stages
ORDER BY org_id, position;
```

### **Consulta SQL para verificar duplicatas:**
```sql
SELECT org_id, position, COUNT(*) as count
FROM kanban_stages
GROUP BY org_id, position
HAVING COUNT(*) > 1;
```

### **Consulta SQL para verificar constraint:**
```sql
SELECT conname, contype, conrelid::regclass
FROM pg_constraint
WHERE conname = 'kanban_stages_org_position_unique';
```

---

## ⚠️ **Problema Identificado e Resolvido**

### **Problema:**
- Colunas duplicadas sendo criadas para a mesma organização
- 15 colunas com nomes repetidos na interface

### **Causa:**
- Múltiplas chamadas de inicialização sem verificação de duplicatas
- Falta de constraint de unicidade no banco
- Função RPC `seed_kanban_stages_canonical` criando duplicatas

### **Solução:**
1. ✅ Migração para remover duplicatas existentes
2. ✅ Constraint de unicidade `(org_id, position)`
3. ✅ Lógica melhorada na API com verificação antes de criar
4. ✅ Uso de `Prefer: resolution=ignore-duplicates`

---

## 🎯 **Próximos Passos**

1. **Aplicar a migração no banco de dados** (escolher uma das opções acima)
2. **Reiniciar o servidor Next.js** para aplicar as alterações
3. **Testar com a organização "Edir Macedo"** para verificar se as duplicatas foram removidas
4. **Criar nova organização de teste** para verificar a criação automática
5. **Monitorar logs** para garantir que não há mais erros de duplicatas

---

## 📝 **Notas Importantes**

- ✅ As colunas #1 e #99 são **obrigatórias** e **fixas** para todas as organizações
- ✅ Cada organização pode **personalizar os nomes** das colunas
- ✅ As posições #1 e #99 **não podem ser alteradas** (são fixas)
- ✅ Colunas intermediárias (#2-#98) podem ser **criadas, editadas e deletadas** livremente
- ✅ A constraint garante que **não haverá duplicatas** de posição por organização

---

## 🔍 **Validação Final**

Após aplicar todas as alterações, verificar:

- [ ] Migração aplicada com sucesso no banco
- [ ] Constraint de unicidade criada
- [ ] Duplicatas removidas
- [ ] Nova organização cria colunas #1 e #99 automaticamente
- [ ] Organização existente tem colunas #1 e #99
- [ ] Interface do onboarding exibe colunas corretamente
- [ ] Não há mais colunas duplicadas

---

**Status:** ✅ Implementação Completa  
**Requer:** Aplicação da migração no banco de dados
