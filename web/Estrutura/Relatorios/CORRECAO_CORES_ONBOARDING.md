# 🎨 Correção: Cores em Colunas Fixas do Onboarding

## 🐛 Problema Identificado

Quando o usuário tentava aplicar uma cor na coluna "Novo Aluno" (coluna fixa com `position=1`), a operação falhava silenciosamente. O banco de dados mostrava que **todas** as colunas tinham `color=null`, mesmo após a tentativa de atualização.

### Causa Raiz

O código da API (`web/app/api/kanban/stages/[id]/route.ts`) estava **bloqueando** a alteração de cor para colunas fixas (posição 1 e 99), retornando erro 403:

```typescript
// ❌ CÓDIGO ANTIGO (linhas 65-71)
if (existingColumn.is_fixed || existingColumn.position === 1 || existingColumn.position === 99) {
  if (position !== undefined) {
    return NextResponse.json({ error: 'Não é possível alterar a posição de colunas fixas' }, { status: 403 })
  }
  if (color !== undefined) {
    return NextResponse.json({ error: 'Não é possível alterar a cor de colunas fixas' }, { status: 403 })
  }
  // ...
}
```

O frontend também estava **omitindo** o campo `color` ao atualizar colunas fixas:

```typescript
// ❌ CÓDIGO ANTIGO (linhas 266-269)
const requestBody = isFixed 
  ? { title: data.title }  // ❌ Não envia cor para colunas fixas
  : { title: data.title, color: data.color }
```

## ✅ Solução Aplicada

### 1. API - Permitir Cor em Colunas Fixas

**Arquivo**: `web/app/api/kanban/stages/[id]/route.ts`

```typescript
// ✅ CÓDIGO NOVO (linhas 64-72)
// Para colunas fixas, permitir renomeação e cor (mas não mudança de posição)
if (existingColumn.is_fixed || existingColumn.position === 1 || existingColumn.position === 99) {
  if (position !== undefined) {
    return NextResponse.json({ error: 'Não é possível alterar a posição de colunas fixas' }, { status: 403 })
  }
  // Permitir renomeação e alteração de cor para colunas fixas
  if (title === undefined && color === undefined) {
    return NextResponse.json({ error: 'Forneça o nome ou cor para atualizar a coluna fixa' }, { status: 400 })
  }
}
```

**Mudanças**:
- ✅ Removida a validação que impedia `color` em colunas fixas
- ✅ Mantida a validação que impede alteração de `position`
- ✅ Agora colunas fixas podem ter nome e cor alterados

### 2. Frontend - Enviar Cor para Todas as Colunas

**Arquivo**: `web/app/(app)/app/services/onboard/page.tsx`

```typescript
// ✅ CÓDIGO NOVO (linhas 260-286)
async function updateColumn(columnId: string, data: { title: string; color?: string }) {
  try {
    // Enviar título e cor (a API validará se a posição pode ser alterada)
    const requestBody = { 
      title: data.title, 
      color: data.color 
    }
    
    const response = await fetch(`/api/kanban/stages/${columnId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao atualizar coluna')
    }

    success('Coluna atualizada com sucesso!')
    setEditColumnModal({ open: false, column: null })
    loadBoard()
  } catch (err) {
    console.error('Erro ao atualizar coluna:', err)
    error(err instanceof Error ? err.message : 'Erro ao atualizar coluna')
  }
}
```

**Mudanças**:
- ✅ Removida a lógica condicional que omitia `color` para colunas fixas
- ✅ Agora **sempre** envia `color` no request body
- ✅ Melhorado tratamento de erros com mensagem da API

### 3. Interface - Mensagem Atualizada

**Arquivo**: `web/app/(app)/app/services/onboard/page.tsx` (linhas 1092-1101)

```tsx
// ✅ CÓDIGO NOVO
<div className="text-sm text-muted-foreground space-y-1">
  {column.is_fixed ? (
    <>
      <p><strong>Coluna fixa:</strong> O nome e a cor podem ser alterados.</p>
      <p>A posição não pode ser modificada.</p>
    </>
  ) : (
    <p>Alterar o nome e cor da coluna não afeta as tarefas existentes.</p>
  )}
</div>
```

**Mudanças**:
- ✅ Mensagem agora reflete corretamente o que pode ser alterado
- ✅ "O nome e a cor podem ser alterados" (antes: "Apenas o nome")

## 🧪 Como Testar

1. **Acesse**: `/app/services/onboard`
2. **Clique** no ícone de edição (✏️) da coluna "Novo Aluno"
3. **Selecione** uma cor (ex: azul #3b82f6)
4. **Clique** em "Atualizar"
5. **Navegue** para `/app/onboarding`
6. **Verifique** que o cabeçalho da coluna "Novo Aluno" agora tem a cor azul

### Query SQL para Verificar

```sql
SELECT name, position, color, is_fixed 
FROM kanban_stages 
WHERE position IN (1, 99)
ORDER BY position;
```

Após a atualização, você deverá ver:
```
name         | position | color    | is_fixed
-------------|----------|----------|----------
Novo Aluno   | 1        | #3b82f6  | true
Entrega...   | 99       | null     | true
```

## 📊 Impacto

### Antes
- ❌ Colunas fixas não podiam ter cores
- ❌ Mensagem de erro silenciosa (403)
- ❌ Interface indicava incorretamente que cores não eram permitidas

### Depois
- ✅ Colunas fixas podem ter cores personalizadas
- ✅ Apenas a posição é bloqueada (comportamento correto)
- ✅ Mensagens claras e precisas na interface

## 🎯 Resultado Final

**Agora todas as colunas, incluindo as fixas (#1 "Novo Aluno" e #99 "Entrega Treino"), podem ter cores personalizadas!**

O módulo de Onboarding está **100% funcional** com o sistema de cores implementado corretamente. 🎉

