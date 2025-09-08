# Fix Planos Errors - 28/01/2025 02:00

## 🚨 **Problemas Identificados:**

### **1. Erro 500 - "Erro ao carregar planos"**
- **Causa**: Tabela `plans` não existia no banco de dados
- **Localização**: API `/api/plans` 

### **2. TypeError - "toast is not a function"**
- **Causa**: Uso incorreto do hook `useToast`
- **Localização**: `web/app/app/services/plans/page.tsx` linha 37

### **3. Runtime Error - "A <Select.Item /> must have a value prop that is not an empty string"**
- **Causa**: SelectItem com `value=""` não é permitido
- **Localização**: `web/app/app/services/plans/page.tsx` linhas 458, 576

### **4. Erro de sintaxe - "liquemp"**
- **Causa**: Texto "liquemp" no final do arquivo
- **Localização**: `web/app/app/services/page.tsx` linha 25

### **5. Arquivo .env.local ausente**
- **Causa**: Configuração do Supabase não estava disponível
- **Localização**: `web/.env.local`

## ✅ **Correções Implementadas:**

### **1. Criação da tabela `plans`**
```sql
-- Executado via script create-plans-tables.ts
CREATE TABLE plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code text NOT NULL,
  nome text NOT NULL,
  descricao text,
  valor numeric(12,2) NOT NULL CHECK (valor > 0),
  moeda char(3) NOT NULL DEFAULT 'BRL',
  ciclo text CHECK (ciclo IN ('mensal','trimestral','semestral','anual')),
  duracao_em_ciclos int CHECK (duracao_em_ciclos > 0),
  ativo boolean NOT NULL DEFAULT true,
  tenant_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### **2. Correção do hook useToast**
```tsx
// ANTES
const { toast } = useToast()
toast({
  title: "Erro",
  description: "Erro ao carregar planos",
  variant: "destructive"
})

// DEPOIS
const { success, error } = useToast()
error("Erro ao carregar planos")
```

### **3. Correção do SelectItem**
```tsx
// ANTES
<SelectItem value="">Sem ciclo</SelectItem>

// DEPOIS
<SelectItem value="sem_ciclo">Sem ciclo</SelectItem>
```

### **4. Correção da sintaxe**
```tsx
// ANTES
    </div>liquemp
  );

// DEPOIS
    </div>
  );
```

### **5. Criação do .env.local**
```env
NEXT_PUBLIC_SUPABASE_URL=https://kkxlztopdmipldncduvj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://kkxlztopdmipldncduvj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🧪 **Testes Realizados:**

### **1. Build Test**
```bash
npm run build
# ✅ Resultado: Passed - 0 errors
```

### **2. Migração Test**
```bash
npx tsx scripts/create-plans-tables.ts
# ✅ Resultado: 
# 🔄 Criando tabelas para módulo de Planos...
# 📋 Criando tabela plans...
# ✅ Tabela plans criada com sucesso!
# ✅ Teste da tabela plans: OK
```

### **3. API Test**
```bash
curl http://localhost:3000/api/plans
# ✅ Resultado: 401 Unauthorized (esperado - precisa autenticação)
```

## 📋 **Arquivos Alterados:**

1. **`web/app/app/services/plans/page.tsx`**
   - Corrigido hook `useToast`
   - Corrigido SelectItem values
   - Ajustada lógica do ciclo

2. **`web/app/app/services/page.tsx`**
   - Removido texto "liquemp"

3. **`web/.env.local`** (criado)
   - Configurações do Supabase

4. **`web/scripts/create-plans-tables.ts`** (criado)
   - Script para criar tabela plans

## 🎯 **Status Final:**

- ✅ **Erro 500**: Resolvido (tabela criada)
- ✅ **Toast Error**: Resolvido (hook corrigido)
- ✅ **Select Error**: Resolvido (values corrigidos)
- ✅ **Sintaxe Error**: Resolvido (texto removido)
- ✅ **Config Error**: Resolvido (.env.local criado)

## 🚀 **Próximos Passos:**

1. Teste manual da página `/app/services/plans`
2. Criação de planos de teste
3. Verificação das validações
4. Continuação do Smoke E2E v0.1

---
**Data:** 28/01/2025 02:00  
**Status:** ✅ RESOLVIDO  
**Próximo:** Teste manual da funcionalidade
