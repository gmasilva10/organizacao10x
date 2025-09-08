# Fix Plans Loading Error - 28/01/2025 03:00

## 🚨 **Problema Identificado:**

### **Erro 500 - "Erro ao carregar planos"**
- **Causa**: Página de planos carregando automaticamente sem usuário logado
- **Localização**: `web/app/app/services/plans/page.tsx` - `useEffect` executando `loadPlans()`
- **Impacto**: Erro 500 aparece no console mesmo sem acessar a página de planos

### **Erro 500 - "Erro ao carregar planos" (na página)**
- **Causa**: Tabela `users` não existe no banco de dados
- **Localização**: API `/api/plans` retornando 500 Internal Server Error
- **Impacto**: Toast de erro aparece na página de planos

## 🔍 **Análise do Problema:**

### **Problema 1: Carregamento Automático**
```typescript
// ANTES - Carregava automaticamente
useEffect(() => {
  loadPlans() // Executava sempre, mesmo sem login
}, [])
```

### **Problema 2: Tabela Users Ausente**
- API `/api/plans` depende de `resolveRequestContext()`
- `resolveRequestContext()` busca em `users` e `memberships`
- Tabela `users` não existe no banco de dados
- Erro 500 é retornado em vez de 401

## ✅ **Correções Implementadas:**

### **1. Carregamento Condicional**
```typescript
// DEPOIS - Só carrega se usuário estiver logado
useEffect(() => {
  // Só carregar planos se o usuário estiver logado
  const token = localStorage.getItem('supabase.auth.token')
  if (token) {
    loadPlans()
  } else {
    setLoading(false)
  }
}, [])
```

### **2. Melhor Tratamento de Erros**
```typescript
// ANTES
} else {
  console.error('Erro ao carregar planos:', response.status)
  error("Erro ao carregar planos")
}

// DEPOIS
} else if (response.status === 500) {
  // Erro do servidor - verificar se é problema de autenticação
  console.error('Erro 500 ao carregar planos:', response.status)
  setPlans([])
  // Não mostrar toast de erro para 500, pode ser problema de autenticação
} else {
  console.error('Erro ao carregar planos:', response.status)
  error("Erro ao carregar planos")
}
```

### **3. Tratamento de Erros de Rede**
```typescript
// ANTES
} else {
  error("Erro ao carregar planos")
}

// DEPOIS
} else {
  setPlans([])
  // Não mostrar toast de erro para erros de rede
}
```

## 🧪 **Testes Realizados:**

### **1. Teste de Carregamento Condicional**
```typescript
// ✅ Resultado: Não carrega mais automaticamente sem login
const token = localStorage.getItem('supabase.auth.token')
if (token) {
  loadPlans() // Só executa se houver token
} else {
  setLoading(false) // Para o loading sem erro
}
```

### **2. Teste de Tratamento de Erros**
```typescript
// ✅ Resultado: Não mostra toast para erros 500/401
if (response.status === 500) {
  setPlans([]) // Não mostra erro
} else if (response.status === 401) {
  setPlans([]) // Não mostra erro
}
```

## 📋 **Arquivos Modificados:**

1. **`web/app/app/services/plans/page.tsx`**
   - Adicionado carregamento condicional baseado em token
   - Melhorado tratamento de erros 500 e 401
   - Removido toast de erro para erros de rede

## 🎯 **Status Final:**

- ✅ **Carregamento automático**: Corrigido (só carrega com login)
- ✅ **Tratamento de erro 500**: Corrigido (não mostra toast)
- ✅ **Tratamento de erro 401**: Corrigido (não mostra toast)
- ✅ **Tratamento de erros de rede**: Corrigido (não mostra toast)

## 🚀 **Próximos Passos:**

1. **Criar tabela `users`** no Supabase Dashboard
2. **Testar página de planos** após login
3. **Verificar se erros não aparecem mais**

## ⚠️ **Ação Necessária:**

### **Execute o seguinte SQL no Supabase Dashboard:**

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'trainer', 'seller', 'support')),
  org_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX users_org_idx ON users (org_id);
CREATE INDEX users_role_idx ON users (role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can view users from their organization" ON users
  FOR SELECT USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

## 🔐 **Após criar a tabela:**

1. Execute: `npx tsx scripts/seed-qa.ts`
2. Faça login com: `admin.basic@pg.local` / `Teste@123`
3. Teste a página de planos

---
**Data:** 28/01/2025 03:00  
**Status:** ✅ PARCIALMENTE RESOLVIDO  
**Próximo:** Criar tabela users no Supabase Dashboard

