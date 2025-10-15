# 📋 Plano de Ação - GATE 13A (Anamnese V1)

**Data:** 12/10/2025 17:02
**Versão:** v1.0
**Prazo Estimado:** 4-5 horas
**Status:** 📋 **PLANEJAMENTO CONCLUÍDO**

---

## 🎯 OBJETIVO DO GATE 13A

Finalizar e validar o módulo Anamnese V1, garantindo:
1. ✅ Conclusão gera tarefa no Kanban (evidência GIF)
2. ✅ Auditoria create/update em audit_log
3. ✅ Export JSON fiel
4. ✅ Performance p95/p99 conforme padrão (<400ms)

---

## 📊 ESCOPO DEFINIDO

### O QUE ESTÁ INCLUÍDO ✅

1. **Correção do AnamneseTab** - Implementar criação de anamnese
2. **Validação da integração Kanban** - Testar fluxo completo
3. **Validação de auditoria** - Verificar logs
4. **Validação de export** - Testar PDF/JSON
5. **Medição de performance** - Coletar p95/p99
6. **Documentação** - Completar dicionário e regras (se necessário)
7. **Evidências** - GIFs, screenshots, logs
8. **Relatório de aceite** - Documento final

### O QUE NÃO ESTÁ INCLUÍDO ❌

1. ❌ Motor de decisão de risco (parece ser GATE separado)
2. ❌ Novas features não mencionadas nos critérios
3. ❌ Refatoração profunda (código já funcional)
4. ❌ Migrações de banco (estrutura já existe)

---

## 🗂️ FASES DO PLANO

### FASE 1: Correções e Implementações (2h)

#### 1.1. Implementar Criação de Anamnese no AnamneseTab (30 min)
**Arquivo:** `web/components/students/tabs/AnamneseTab.tsx`

**Tarefas:**
- [ ] Remover TODO
- [ ] Implementar chamada a `POST /api/anamnese/generate`
- [ ] Adicionar estados de loading
- [ ] Feedback visual (toast sucesso/erro)
- [ ] Atualizar lista após criação
- [ ] Validações (service_id obrigatório?)

**Critério de aceite:**
- Botão "Nova Anamnese" cria instância
- Toast de confirmação
- Lista atualiza automaticamente

---

#### 1.2. Validar Integração com Kanban (45 min)

**Fluxo a testar:**
1. Aluno preenche anamnese pelo link
2. Submete respostas
3. Sistema cria tarefa no Kanban
4. Tarefa aparece no quadro

**Validações:**
- [ ] Endpoint `/api/anamnese/submit/[token]` cria tarefa no Kanban?
- [ ] Tarefa tem dados corretos (aluno, status, data)?
- [ ] Tarefa aparece no quadro de Onboarding?
- [ ] Logs estruturados registram a ação?

**Evidência necessária:**
- GIF do fluxo completo
- Screenshots do antes/depois
- Logs do console

**Se não funcionar:**
- Implementar hook para criar tarefa após submit
- Adicionar em `web/app/api/anamnese/submit/[token]/route.ts`

---

#### 1.3. Validar e Completar Auditoria (30 min)

**Ações a auditar:**
- [ ] Criação de anamnese (generate)
- [ ] Envio de convite (send)
- [ ] Submissão de respostas (submit)
- [ ] Atualização de status

**Verificações:**
- [ ] Logs em `audit_log` ou `anamnesis_audit_logs`?
- [ ] Campos: entity, entity_id, action, actor_id, payload_before/after
- [ ] Timestamps corretos
- [ ] org_id presente

**Ações:**
- Revisar APIs e garantir chamadas ao audit logger
- Testar queries de auditoria
- Documentar formato dos logs

---

#### 1.4. Validar Export JSON/PDF (15 min)

**Endpoint:** `GET /api/anamnese/version/[versionId]/pdf`

**Testes:**
- [ ] Buscar uma versão com respostas
- [ ] Chamar endpoint de PDF
- [ ] Verificar se retorna dados completos
- [ ] Validar fidelidade (todas as perguntas e respostas)

**Se falhar:**
- Corrigir endpoint
- Adicionar campos faltantes
- Validar formato JSON

---

### FASE 2: Performance e Métricas (1h)

#### 2.1. Medir Performance de APIs (30 min)

**Endpoints a medir:**
- [ ] `GET /api/anamnese/versions/[studentId]` - Listagem
- [ ] `POST /api/anamnese/generate` - Criação
- [ ] `POST /api/anamnese/submit/[token]` - Submissão
- [ ] `GET /api/anamnese/version/[versionId]/pdf` - Export

**Métricas:**
- [ ] p50, p95, p99
- [ ] Tempo de resposta
- [ ] Queries SQL executadas
- [ ] N+1 queries?

**Meta:** p95 < 400ms

**Ferramentas:**
- Console logs (PERF)
- Network tab do DevTools
- Logs estruturados das APIs

---

#### 2.2. Otimizar se Necessário (30 min)

**Se p95 > 400ms:**
- [ ] Adicionar índices no banco
- [ ] Otimizar queries (SELECT apenas campos necessários)
- [ ] Adicionar cache (React Query já configurado)
- [ ] Lazy loading se aplicável

---

### FASE 3: Documentação (1h)

#### 3.1. Completar Dicionário de Dados (30 min)

**Arquivo:** `GATE_13A_Templates/Dicionario_Anamnese_v1.md`

**Conteúdo:**
```markdown
## Seções da Anamnese

### 1. Dados Pessoais
- nome_completo (string, obrigatório)
- data_nascimento (date, obrigatório)
- sexo (enum: M/F/Outro, obrigatório)
- ...

### 2. Histórico de Saúde
- condicoes_pre_existentes (multi, opcional)
- medicamentos_atuais (text, opcional)
- ...

### 3. Objetivos
- objetivo_principal (single, obrigatório)
- metas_curto_prazo (multi, opcional)
- ...
```

**Baseado em:**
- Planilha Excel existente
- Perguntas já cadastradas no banco
- Tipos TypeScript definidos

---

#### 3.2. Documentar Regras de Risco (30 min) - SE NECESSÁRIO

**Arquivo:** `GATE_13A_Templates/Regras_Risco_Anamnese_v1.md`

**Se o GATE 13A não incluir motor de decisão:**
- Documentar que será implementado em GATE futuro
- Deixar draft com estrutura básica

**Se incluir:**
- Mapear combinações de respostas → red_flags
- Definir lógica de risk_level
- Implementar motor de decisão

---

### FASE 4: Evidências e Aceite (1h)

#### 4.1. Capturar Evidências (40 min)

**Evidências necessárias:**
1. [ ] **GIF:** Aluno preenche anamnese → tarefa criada no Kanban
2. [ ] **Screenshots:** Formulário, listagem, PDF
3. [ ] **Logs:** Console com performance metrics
4. [ ] **Queries SQL:** audit_log com registros
5. [ ] **JSON:** Export fiel de uma anamnese completa

**Ferramenta:** @Browser (Playwright)

---

#### 4.2. Preencher Relatório de Aceite (20 min)

**Arquivo:** `GATE_13A_Templates/Aceite_Gate13A.md`

**Estrutura:**
```markdown
# Relatório de Aceite - GATE 13A

## Critérios de Aceite

### 1. Conclusão gera tarefa no Kanban ✅
**Status:** ATENDIDO
**Evidência:** gate13a_kanban_integration.gif
**Validado em:** 12/10/2025
**Observações:** [detalhes]

### 2. Auditoria create/update ✅
**Status:** ATENDIDO
**Evidência:** audit_log_query_results.json
**Validado em:** 12/10/2025
**Observações:** [detalhes]

### 3. Export JSON fiel ✅
**Status:** ATENDIDO
**Evidência:** anamnese_export_sample.json
**Validado em:** 12/10/2025
**Observações:** [detalhes]

### 4. Performance p95/p99 ✅
**Status:** ATENDIDO
**Evidência:** performance_metrics.md
**Validado em:** 12/10/2025
**p95:** XXXms (< 400ms ✅)
**p99:** XXXms

## Conclusão
GATE 13A ✅ APROVADO
```

---

## 📝 CHECKLIST DE EXECUÇÃO

### Pré-requisitos
- [x] v0.7.0 concluída e validada
- [ ] Servidor dev rodando
- [ ] Banco de dados acessível
- [ ] @Browser disponível
- [ ] Credenciais de teste prontas

### Implementação
- [ ] 1.1. Implementar criação no AnamneseTab
- [ ] 1.2. Validar integração Kanban
- [ ] 1.3. Validar auditoria
- [ ] 1.4. Validar export JSON

### Performance
- [ ] 2.1. Medir performance
- [ ] 2.2. Otimizar se necessário

### Documentação
- [ ] 3.1. Completar dicionário
- [ ] 3.2. Documentar regras (se necessário)

### Evidências
- [ ] 4.1. Capturar GIF/screenshots/logs
- [ ] 4.2. Preencher relatório de aceite

---

## 🎯 PRÓXIMA AÇÃO

**Decisão do usuário:**
1. ⏳ Consolidar v0.7.0 (30 min) → depois GATE 13A
2. ⏳ Diagnóstico profundo (1h) → depois GATE 13A
3. ⏳ Começar GATE 13A agora (4-5h direto)

Qual opção deseja seguir?

---

*Plano criado em 2025-10-12 17:02*

