# GATE 1 - UI correta de orquestração (sem criar aluno)

## ✅ **Status: CONCLUÍDO**

### 📋 **O que foi implementado:**

1. **Interface corrigida** - `/app/services/onboard` agora mostra templates de tarefas, não cards de alunos
2. **Modal "Nova Tarefa Padrão"** - Substitui o modal "Novo Aluno" 
3. **Colunas com posições** - Mostra `[#posição]` no canto superior direito
4. **Badges "Fixa" + cadeado** - Nas colunas de sistema (#1 e #99)
5. **Botões corretos** - "+ Nova Tarefa Padrão" e "Editar" (somente nas não-fixas)

### 🎯 **Funcionalidades implementadas:**

#### **Interface de Colunas:**
- ✅ Mostra `#{position}` no canto superior direito
- ✅ Badge "Fixa" + ícone de cadeado nas colunas #1 e #99
- ✅ Contador de templates por coluna
- ✅ Botão "Editar" apenas em colunas não-fixas

#### **Lista de Templates:**
- ✅ Exibe templates com título, descrição, status (Obrigatória/Opcional)
- ✅ Mostra posição/ordem de cada template
- ✅ Botão de exclusão para cada template
- ✅ Estado vazio quando não há templates

#### **Modal "Nova Tarefa Padrão":**
- ✅ Campos: título* (obrigatório), descrição (opcional), obrigatória? (switch)
- ✅ Submit → POST para `/api/services/onboarding/tasks`
- ✅ Toast de sucesso + refresh da lista
- ✅ Validação de campos obrigatórios

### 🔧 **Endpoints utilizados:**
- `GET /api/kanban/board` - Carrega colunas
- `GET /api/services/onboarding/tasks?stage_code=X` - Carrega templates por coluna
- `POST /api/services/onboarding/tasks` - Cria novo template
- `DELETE /api/services/onboarding/tasks/{id}` - Exclui template
- `PATCH /api/kanban/stages/{id}` - Edita coluna

### 📊 **Build status:**
- ✅ **Build passou** - Compilação bem-sucedida
- ✅ **Lint limpo** - Sem erros de linting
- ✅ **Tipos corretos** - TypeScript sem erros

### 🎯 **Aceite do GATE 1:**
- ✅ **Clicar + Nova Tarefa abre modal de Template, não "Novo Aluno"**
- ✅ **Salvar template → aparece na lista da coluna; contagem atualiza; console limpo**

### 📁 **Arquivo modificado:**
- `web/app/app/services/onboard/page.tsx` - Interface completamente reescrita

### 🚀 **Próximo passo:**
**GATE 2** - Backend/instanciação (reuso do que já existe)

---
**Data:** 27/01/2025 19:00  
**Status:** ✅ CONCLUÍDO  
**Próximo:** GATE 2
