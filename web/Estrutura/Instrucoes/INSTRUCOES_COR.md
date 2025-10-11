# 🔧 Como Resolver o Erro 500 - Campo Color

## 🚨 Problema
O erro 500 acontece porque o campo `color` não existe na tabela `kanban_stages` do banco de dados.

## ✅ Solução Rápida

### Opção 1: Executar SQL Direto (Recomendado)
Execute este comando no seu banco de dados PostgreSQL:

```sql
ALTER TABLE kanban_stages ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT NULL;
```

### Opção 2: Via Supabase CLI (se disponível)
```bash
cd web
npx supabase start
npx supabase migration up
```

## 🎯 Resultado
Após executar o comando SQL:
- ✅ **Erro 500 será resolvido**
- ✅ **Campo de cor funcionará**
- ✅ **Cores serão salvas no banco**
- ✅ **Cabeçalhos coloridos aparecerão**

## 📋 Verificação
Para verificar se funcionou, execute:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'kanban_stages' 
AND column_name = 'color';
```

Deve retornar uma linha com `color` e `character varying`.

---
**Nota**: A API já está preparada com fallback, então mesmo sem o campo, a renomeação de colunas deve funcionar.
