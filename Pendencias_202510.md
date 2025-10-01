# 📋 PENDÊNCIAS OUTUBRO 2025
**Data de Criação:** 30/09/2025  
**Válido para:** Outubro/2025  
**Responsável:** Dev Team  

---

## 🎯 RESUMO EXECUTIVO

Este documento consolida TODAS as pendências identificadas no projeto Organizacao10x para serem atacadas em outubro/2025. Itens organizados por prioridade (P0-P3) e categoria.

**Total de Itens:** 47 pendências  
**Críticas (P0):** 8 itens  
**Altas (P1):** 15 itens  
**Médias (P2):** 14 itens  
**Baixas (P3):** 10 itens  

---

## 🔥 P0 - CRÍTICO (SEGURANÇA E BLOCKERS)

### 🔒 SEGURANÇA

- [ ] **P0.1** - Remover segredos do VCS (`.env.local` raiz e `web/.env.local`)
  - **Impacto:** Crítico - Chaves expostas publicamente
  - **Arquivos:** `.env.local`, `web/.env.local`, `web/Estrutura/Credenciais_QA_Supabase.txt`
  - **Ação:** `git rm --cached`, adicionar ao `.gitignore`, rotacionar chaves

- [ ] **P0.2** - Rotacionar chaves Supabase (ANON + SERVICE_ROLE)
  - **Impacto:** Crítico - Prevenir acesso não autorizado
  - **Local:** Supabase Dashboard → Settings → API
  - **Ação:** Gerar novas chaves, atualizar variáveis de ambiente

- [ ] **P0.3** - Rotacionar tokens Z-API (INSTANCE_TOKEN + CLIENT_TOKEN)
  - **Impacto:** Crítico - Prevenir uso indevido da API WhatsApp
  - **Local:** Z-API Dashboard
  - **Ação:** Gerar novos tokens, atualizar env

- [ ] **P0.4** - Bloquear/Remover endpoint `api/debug/execute-sql`
  - **Impacto:** Crítico - Execução arbitrária de SQL
  - **Arquivo:** `web/app/api/debug/execute-sql/route.ts`
  - **Ação:** Deletar OU colocar atrás de role check + feature flag

- [ ] **P0.5** - Remover tokens hardcoded em `api/wa/test-zapi`
  - **Impacto:** Crítico - Tokens em código-fonte
  - **Arquivo:** `web/app/api/wa/test-zapi/route.ts`
  - **Ação:** Deletar arquivo OU usar env vars

- [ ] **P0.6** - Remover `debug-migration.html` do frontend
  - **Impacto:** Alto - Operações admin expostas
  - **Arquivo:** `web/debug-migration.html`
  - **Ação:** `git rm web/debug-migration.html`

### 🧹 HIGIENE CRÍTICA

- [ ] **P0.7** - Remover artefatos de build do VCS
  - **Impacto:** Alto - Repositório poluído, builds lentos
  - **Arquivos:** `web/.next/`, `web/coverage/`, `web/lighthouse-report.json`, `web/tsconfig.tsbuildinfo`
  - **Ação:** `git rm -r --cached`, adicionar ao `.gitignore`

- [ ] **P0.8** - Limpar arquivos "lixo" da raiz
  - **Impacto:** Médio - Poluição do repo
  - **Arquivos:** `o  Select-String...`, `tatus`, `uários anônimos`, etc.
  - **Ação:** Deletar arquivos corrompidos/temporários

---

## ⚠️ P1 - ALTA PRIORIDADE (QUALIDADE E FUNCIONALIDADE)

### 🎨 MÓDULO RELACIONAMENTO

- [ ] **P1.1** - Validar Checklist de Relacionamento (9 critérios)
  - **Impacto:** Alto - Gate 10.7 pendente de validação
  - **Documento:** `Checklist_Release_Validation.txt`
  - **Critérios:**
    - CA-01: Filtro Padrão "Hoje"
    - CA-02: Filtro Futuro (100% Futuro)
    - CA-03: Filtro Passado
    - CA-04: Intervalo Cruzando Passado/Hoje/Futuro
    - CA-05: Adiar Tarefa (1/3/7 dias)
    - CA-06: Marcar como Enviada
    - CA-07: Pular Tarefa com Undo
    - CA-08: Excluir Tarefa com Undo
    - CA-09: Ordenação e Contadores

- [ ] **P1.2** - Corrigir bugs do Drawer de Filtros (Relacionamento)
  - **Impacto:** Alto - Filtros não funcionam corretamente
  - **Problemas:**
    - Calendário transparente dentro do Drawer
    - Filtros não aplicam ao clicar "Aplicar"
    - Encoding de caracteres especiais (Período → PerÃ­odo)
  - **Arquivo:** `web/components/relationship/RelationshipKanban.tsx`

- [ ] **P1.3** - Corrigir calendário transparente em modais
  - **Impacto:** Alto - UX quebrada
  - **Componente:** `StandardizedCalendar` dentro de `Dialog/Drawer`
  - **Arquivos:** `web/components/ui/popover.tsx`, `web/components/ui/standardized-calendar.tsx`

- [ ] **P1.4** - Implementar autenticação real nas APIs de Relacionamento
  - **Impacto:** Alto - Segurança
  - **TODOs encontrados:**
    - `web/app/api/relationship/tasks/route.ts` (linhas 26, 205)
    - `web/app/api/relationship/tasks/[id]/route.ts` (linha 119)
    - `web/app/api/relationship/tasks/[id]/undo/route.ts` (linha 120)
  - **Ação:** Substituir `'dev-user-id'` por `ctx.userId` real

### 💰 MÓDULO FINANCEIRO

- [ ] **P1.5** - Implementar CRUD de Categorias Financeiras
  - **Impacto:** Médio - Submódulo incompleto
  - **Arquivo:** `web/components/services/CategoryManager.tsx` (atualmente mock)
  - **Funcionalidades:**
    - Criar categoria
    - Editar categoria (nome, cor, status)
    - Deletar categoria
    - Listar categorias
  - **API:** Criar endpoints `/api/financial/categories`

- [ ] **P1.6** - Migração: Tabela `financial_categories`
  - **Impacto:** Médio - Suporte ao CRUD de categorias
  - **Arquivo:** `supabase/migrations/YYYYMMDD_financial_categories.sql`
  - **Colunas:** `id`, `name`, `color`, `active`, `org_id`, `created_at`, `updated_at`

### 🏗️ ESTRUTURA E CONSISTÊNCIA

- [ ] **P1.7** - Consolidar estrutura de rotas: `app/(app)` vs `app/app`
  - **Impacto:** Alto - Duplicação e confusão
  - **Decisão:** Manter `app/(app)` como padrão
  - **Ação:** Migrar conteúdo de `app/app` para `app/(app)` e deletar `app/app`

- [ ] **P1.8** - Padronizar nomenclatura: `relationship` vs `relacionamento`
  - **Impacto:** Alto - Inconsistência crítica
  - **Decisão:** Escolher um idioma (pt-BR OU en)
  - **Arquivos afetados:** `web/app/(app)/app/relationship` vs `web/app/(app)/app/relacionamento`
  - **Recomendação:** Manter `relationship` (inglês, padrão de código)

- [ ] **P1.9** - Padronizar nomenclatura: `anamnese` vs `anamnesis`
  - **Impacto:** Alto - Inconsistência crítica
  - **Arquivos afetados:** `web/components/anamnese/` vs `web/components/anamnesis/`
  - **Recomendação:** Manter `anamnesis` (inglês)

- [ ] **P1.10** - Unificar componente `EmptyState`
  - **Impacto:** Médio - Duplicação, risco de conflito cross-OS
  - **Arquivos:** `web/components/ui/EmptyState.tsx` vs `web/components/ui/empty-state.tsx`
  - **Ação:** Manter apenas `empty-state.tsx`, ajustar imports

- [ ] **P1.11** - Remover `web/web/` redundante
  - **Impacto:** Médio - Aninhamento desnecessário
  - **Ação:** Mover conteúdo de `web/web/evidencias/` para `web/evidencias/`, deletar `web/web/`

### ✅ TIPAGEM E QUALIDADE

- [ ] **P1.12** - Substituir `any` por tipos explícitos
  - **Impacto:** Alto - Type safety
  - **Arquivos com `any` excessivo (109 ocorrências em 55 arquivos):**
    - `web/app/students/[id]/anamnese/[versionId]/page.tsx`
    - `web/app/p/anamnese/[token]/page.tsx`
    - Rotas `api/occurrences/*`
  - **Ação:** Criar types compartilhados, usar Zod schemas

- [ ] **P1.13** - Configurar ESLint: `no-console`, `no-explicit-any`
  - **Impacto:** Alto - Padrão de código
  - **Arquivo:** `web/.eslintrc.json`
  - **Regras:**
    ```json
    {
      "rules": {
        "no-console": ["warn", { "allow": ["warn", "error"] }],
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-floating-promises": "error"
      }
    }
    ```

- [ ] **P1.14** - Remover `console.log` em produção
  - **Impacto:** Médio - Performance, segurança
  - **Arquivos afetados:** `web/middleware.ts`, `web/utils/supabase/server.ts`, várias rotas `api/*`
  - **Ação:** Substituir por logger com níveis (debug/info/warn/error)

- [ ] **P1.15** - Corrigir testes unitários quebrados
  - **Impacto:** Médio - CI/CD
  - **Arquivo:** `__tests__/unit/components/presentational/confirm-dialog-view-accessibility.test.tsx`
  - **Problema:** Referência a fonte inexistente
  - **Ação:** Restaurar componente OU atualizar caminho do teste

---

## 📊 P2 - MÉDIA PRIORIDADE (MELHORIAS E REFINAMENTO)

### 🗃️ MIGRATIONS E BANCO

- [ ] **P2.1** - Padronizar migrations: `YYYYMMDD__descricao.sql`
  - **Impacto:** Médio - Organização
  - **Problema:** Nomenclaturas mistas, duplicações (`his01_audit_log.sql` vs `his01_audit_log_p0.sql`)
  - **Ação:** Renomear migrations antigas, criar CHANGELOG

- [ ] **P2.2** - Consolidar migrations duplicadas
  - **Impacto:** Médio - Evitar conflitos
  - **Arquivos:** `his01_*` com variações p0/p1
  - **Ação:** Mesclar em uma única versão canônica

### 🧪 TESTES E QA

- [ ] **P2.3** - Ampliar cobertura de testes para APIs
  - **Impacto:** Médio - Qualidade
  - **Foco:** Cenários de erro (4xx, 5xx) para APIs críticas
  - **Módulos:** `api/relationship/*`, `api/students/*`, `api/occurrences/*`

- [ ] **P2.4** - Testes E2E do módulo Financeiro
  - **Impacto:** Médio - Validação de novo módulo
  - **Casos:** CRUD de Planos, CRUD de Categorias, Filtros

- [ ] **P2.5** - Smoke tests do módulo Relacionamento
  - **Impacto:** Médio - Validação pós-refatoração
  - **Casos:** Colunas dinâmicas, Filtros, Ações (adiar/pular/excluir/undo)

### 📚 DOCUMENTAÇÃO

- [ ] **P2.6** - Atualizar README com módulo Financeiro
  - **Impacto:** Baixo - Documentação
  - **Arquivo:** `README.md`
  - **Conteúdo:** Estrutura de submódulos (Planos + Categoria)

- [ ] **P2.7** - Criar evidências de mudanças (GATE 10.8)
  - **Impacto:** Baixo - Governança
  - **Arquivo:** `web/evidencias/GATE_10.8_FINANCEIRO.md`
  - **Conteúdo:** Cards compactos, submódulos, screenshots

- [ ] **P2.8** - Mover planilhas para `docs/`
  - **Impacto:** Baixo - Organização
  - **Pasta:** `Planilha/` → `docs/planilhas/`
  - **Ação:** Garantir que não entram no bundle/deploy

### 🔧 REFATORAÇÃO

- [ ] **P2.9** - Remover versões antigas de `StudentEditTabs` (V2-V5)
  - **Impacto:** Baixo - Limpeza de código
  - **Arquivos:** `web/components/students/StudentEditTabsV2..V5`
  - **Ação:** Confirmar que V6 está em uso, deletar V2-V5

- [ ] **P2.10** - Centralizar client Z-API
  - **Impacto:** Médio - Manutenibilidade
  - **Arquivo:** `web/src/server/zapi.ts`
  - **Ação:** Validar envs no startup, mascarar dados em logs

- [ ] **P2.11** - Extrair lógicas pesadas para hooks/utilities
  - **Impacto:** Médio - Reusabilidade
  - **Foco:** Componentes `students/*` com lógica complexa
  - **Ação:** Criar hooks personalizados tipados

### 🎨 UX E DESIGN

- [ ] **P2.12** - Empty states customizados por módulo
  - **Impacto:** Baixo - UX
  - **Módulos:** Relacionamento (colunas vazias), Financeiro (sem categorias)
  - **Ação:** Mensagens específicas e ilustrações

- [ ] **P2.13** - Loading states padronizados
  - **Impacto:** Baixo - UX
  - **Componente:** Criar `LoadingSpinner` e `SkeletonCard` reutilizáveis
  - **Uso:** Substituir spinners inline

- [ ] **P2.14** - Toasts padronizados (success/error/info/warning)
  - **Impacto:** Baixo - Consistência
  - **Biblioteca:** Sonner (já em uso)
  - **Ação:** Criar wrapper com templates padrão

---

## 🌟 P3 - BAIXA PRIORIDADE (NICE TO HAVE)

### 🚀 PERFORMANCE

- [ ] **P3.1** - Bundle analysis e code splitting
  - **Impacto:** Baixo - Performance
  - **Ferramenta:** `@next/bundle-analyzer`
  - **Ação:** Identificar chunks grandes, fazer lazy loading

- [ ] **P3.2** - Implementar caching de queries (React Query)
  - **Impacto:** Baixo - Performance
  - **Biblioteca:** `@tanstack/react-query` (já configurado?)
  - **Foco:** Listas de alunos, tarefas, planos

### 🔐 AUTENTICAÇÃO E RBAC

- [ ] **P3.3** - OAuth Google
  - **Impacto:** Baixo - Feature adicional
  - **Provider:** Supabase Auth + Google
  - **Ação:** Configurar callback, UI de login

- [ ] **P3.4** - Ajustes finos em RBAC
  - **Impacto:** Baixo - Segurança adicional
  - **Foco:** Permissions granulares por módulo
  - **Ação:** Review de policies RLS

### 📱 INTEGRAÇÕES

- [ ] **P3.5** - Logs centralizados (Sentry/LogRocket)
  - **Impacto:** Baixo - Observabilidade
  - **Ferramenta:** Sentry para erros, LogRocket para sessões
  - **Ação:** Configurar SDK, mascarar dados sensíveis

- [ ] **P3.6** - Analytics e métricas de uso
  - **Impacto:** Baixo - Insights
  - **Ferramenta:** Plausible/PostHog (privacy-friendly)
  - **Ação:** Track eventos críticos (envio mensagens, criação planos)

### 🎨 DESIGN SYSTEM

- [ ] **P3.7** - Ícones e ilustrações customizadas
  - **Impacto:** Baixo - Branding
  - **Ferramenta:** Figma + Lucide Icons
  - **Ação:** Substituir ícones genéricos

- [ ] **P3.8** - SEO metadata por página
  - **Impacto:** Baixo - Discoverability (se for público)
  - **Componente:** `<Head>` com title, description, og:image
  - **Ação:** Adicionar metadata em `layout.tsx` de cada rota

### 🌍 ACESSIBILIDADE

- [ ] **P3.9** - Suporte a teclado (navegação completa)
  - **Impacto:** Baixo - A11y
  - **Foco:** Kanban, Dropdowns, Modais
  - **Ação:** Testar com Tab, Enter, Esc, Arrow keys

- [ ] **P3.10** - Leitores de tela (ARIA completo)
  - **Impacto:** Baixo - A11y
  - **Ferramenta:** NVDA/VoiceOver
  - **Ação:** Validar `aria-*` attributes em todos os componentes

---

## 📝 NOTAS ADICIONAIS

### TODOs Encontrados no Código (Alta Prioridade)

```typescript
// web/app/api/relationship/tasks/[id]/undo/route.ts:120
undo_performed_by: 'dev-user-id', // TODO: pegar do contexto de autenticação

// web/app/api/relationship/tasks/route.ts:26, 205
// TODO: Implementar autenticação real em produção

// web/app/api/relationship/tasks/[id]/route.ts:119
deleted_by: 'dev-user-id' // TODO: usar userId real
```

### Dependências de GATE 10.7 (Relacionamento)

- Validação do Checklist é **bloqueador** para considerar o módulo concluído
- Bugs de filtros/calendário afetam UX crítica
- Sem autenticação real, as APIs são inseguras

### Dependências de GATE 10.8 (Financeiro)

- Category Manager precisa de CRUD completo antes de considerar o módulo pronto
- Migração de banco é **bloqueador** para o CRUD

---

## ✅ CRITÉRIOS DE CONCLUSÃO

Este documento será considerado **100% concluído** quando:

1. **Todos os P0** estiverem resolvidos (segurança crítica)
2. **80%+ dos P1** estiverem resolvidos (qualidade e funcionalidade)
3. **Módulo Relacionamento** validado com Checklist completo
4. **Módulo Financeiro** com CRUD de Categorias funcional
5. **Estrutura de pastas** consolidada (sem duplicações pt/en)
6. **Testes** passando (CI verde)

---

## 📅 CRONOGRAMA SUGERIDO (OUTUBRO)

### Semana 1 (01-06/10)
- P0.1 a P0.8 (Segurança e Higiene)
- P1.1 (Validar Checklist Relacionamento)
- P1.7 a P1.11 (Estrutura e Consistência)

### Semana 2 (07-13/10)
- P1.2 a P1.4 (Bugs Relacionamento)
- P1.5 a P1.6 (Financeiro - Categorias)
- P1.12 a P1.15 (Tipagem e Qualidade)

### Semana 3 (14-20/10)
- P2.1 a P2.5 (Migrations e Testes)
- P2.6 a P2.8 (Documentação)
- P2.9 a P2.14 (Refatoração e UX)

### Semana 4 (21-27/10)
- P3.1 a P3.10 (Nice to Have - conforme tempo disponível)
- Code review geral
- Validação final

### Buffer (28-31/10)
- Correções de última hora
- Documentação de lançamento
- Preparação para novembro

---

## 🔗 REFERÊNCIAS

- `Checklist_Release_Validation.txt` - 9 critérios GATE 10.7
- `RELATORIO_QUALIDADE.md` - Auditoria completa (24/09/2025)
- `Atividades.txt` - Histórico de desenvolvimento
- `web/Estrutura/Pendencias*.txt` - Backlog antigo
- Código-fonte: 109 TODOs encontrados em 55 arquivos

---

**Última Atualização:** 30/09/2025 13:20 BRT  
**Próxima Revisão:** 07/10/2025  
**Responsável:** Dev Team  

═══════════════════════════════════════════════════════════════════════════════
                    FIM DO DOCUMENTO DE PENDÊNCIAS OUTUBRO 2025
═══════════════════════════════════════════════════════════════════════════════
