# PRD – Organização10x v0.4.0
**Módulo desta release**: Relacionamento (CRM de relacionamento + lembretes operacionais)  
**Patrocinador**: Personal Global  
**Consultor Externo**: _a confirmar_  
**Gerente de Projetos (GP)**: Gustavo Moreira  
**DEV responsável**: _a confirmar_  
**Data**: 12/09/2025

---

## 1) Visão e Realinhamento
O Módulo de **Relacionamento** habilita o time a gerir interações contínuas com o aluno (mensagens, lembretes e tarefas de follow-up) conectadas a **Alunos** e **Serviços**, com **Kanban de Relacionamento** e **Templates de Mensagens**.

**Realinhamento de escopo (v0.4.0):** o plano anterior previa avanços em Financeiro/Planos. Por diretriz executiva, priorizamos **Relacionamento** por impacto imediato no valor entregue ao usuário final. Guard-rails mantidos:
- **Sem integração financeira** nesta release (sem cobranças, pacotes, faturas).
- **Sem disparo externo** (WhatsApp/Email) nesta release; apenas lembretes internos e registro de notas/mensagens.
- **Performance P95 < 400ms**, **RLS ativa** por organização e **auditoria completa**.

**Encaixe no fluxo de valor** (roadmap macro):  
Cadastro de Alunos → Cadastro de Serviços → **Relacionamento** → Onboarding/Kanban → Histórico → Pagamentos.

---

## 2) Objetivos da Release v0.4.0
1. **Threads de Relacionamento** por aluno/serviço, com eventos (notas, tarefas, aplicação de template, lembretes).
2. **Kanban de Relacionamento** (colunas configuráveis, WIP limit, prioridades, badges dinâmicos).
3. **Templates de Mensagens** (in-app/operacionais) com variáveis canônicas (ex.: `{aluno.nome}`, `{servico.nome}`, `{data_sessao}`).
4. **Motor de Lembretes** (regras simples + agendamentos internos) para lembrar o usuário do que enviar/fazer, com toasts/contadores.
5. **UX premium**: consistência visual, navegação clara, **zero scroll indevido**, acessibilidade (`data-testid`, ARIA), feedback imediato (loading, toasts), cross‑browser.
6. **QA automatizado no TestSprite**: cenários ponta-a-ponta, seletores estáveis, evidências e checklist.

---

## 3) Escopo Funcional

### 3.1 Entidades e Regras
- **relationship_threads**  
  `id (uuid)`, `org_id (uuid)`, `student_id (uuid)`, `service_id (uuid?)`, `titulo (text)`,  
  `status (OPEN|CLOSED)`, `created_by (uuid)`, `created_at (timestamptz)`, `archived_at (timestamptz?)`

- **relationship_events**  
  `id (uuid)`, `thread_id (uuid)`, `tipo (NOTE|TODO|TEMPLATE_APPLIED|REMINDER_TRIGGERED|STATUS_CHANGE)`,  
  `payload (jsonb)`, `due_at (timestamptz?)`, `completed_at (timestamptz?)`, `assignee_id (uuid?)`, `created_at (timestamptz)`

- **message_templates**  
  `id (uuid)`, `org_id (uuid)`, `code (text, unique)`, `nome (text)`, `canal (text: "in_app")`,  
  `body_md (text)`, `vars_schema (jsonb)`, `ativo (bool)`

- **relationship_kanban_columns**  
  `id (uuid)`, `org_id (uuid)`, `nome (text)`, `ordem (int)`, `wip_limit (int?)`, `is_default (bool)`

- **relationship_kanban_items**  
  `id (uuid)`, `thread_id (uuid)`, `column_id (uuid)`, `position (float8)`,  
  `priority (LOW|MED|HIGH)`, `badges (jsonb)`

- **reminders**  
  `id (uuid)`, `thread_id (uuid)`, `rule (text)`, `recurrence (text?)`, `next_run_at (timestamptz)`,  
  `last_run_at (timestamptz?)`, `ativo (bool)`

**Regras base:**
- Cada **thread** pertence a um aluno e pode, opcionalmente, referenciar um serviço.
- Eventos são **auditáveis**; movimentação no Kanban gera `STATUS_CHANGE` em `relationship_events`.
- **Sem disparo externo** de mensagens nesta release; foco em lembretes internos e registro de histórico.

### 3.2 Fluxos Principais (UX)
- **Criar Thread**: na listagem/visão do aluno ou serviço → botão “Relacionamento” → modal `threadCreate` → cria thread + item no Kanban (coluna default).
- **Adicionar Evento**: em `ThreadView` → `AddNote`, `AddTask`, `AplicarTemplate` (preview de variáveis → commit).
- **Kanban**: drag‑and‑drop entre colunas, com WIP limit e badges (ex.: tarefas pendentes, lembretes próximos).
- **Lembretes**: UI `ReminderRule` → regra simples (ex.: “D+3 após matrícula: sugerir mensagem de boas‑vindas”) → motor agenda `next_run_at`; ao disparar, gera evento e mostra toast.
- **Navegação/Estados**: breadcrumb/Voltar; loaders claros; toasts de sucesso/erro; **sem scroll indevido**; atalhos de teclado (setas/enter/esc).

### 3.3 Fora do Escopo (v0.4.0)
- Envio real por WhatsApp/Email/SMS.
- Integração Financeira ou qualquer automação de cobrança.
- Push notifications.

---

## 4) UX/UI Premium – Requisitos
- **Consistência visual** com a landing; **navegação clara** (breadcrumb + voltar); **zero scroll indevido**.
- **Acessibilidade**: `data-testid` para todos os elementos interativos críticos e roles ARIA adequados.
- **Feedback imediato**: spinners/skeletons, toasts, estados vazios (empty states) e mensagens de erro úteis.
- **Cross-browser**: Chrome, Edge, Firefox (últimas 2 versões).

**Padrões de componentes:**
- Modais customizados (não nativos), inputs com validação inline, tooltips contextuais.
- Reuso de componentes já existentes (cards, lists, toasts) para consistência e velocidade.

---

## 5) Critérios de Aceite (ponta-a-ponta)
1. **Threads**
   - Criar thread vinculada a aluno (com/sem serviço); fechar e reabrir.
2. **Eventos**
   - Adicionar Nota; criar/editar TODO com `due_at`; concluir TODO; aplicar template com **preview** e **commit**.
3. **Kanban**
   - Mover item entre colunas respeitando WIP; bloqueio visual ao exceder WIP; badges atualizados.
4. **Lembretes**
   - Criar regra (ex.: D+3 após matrícula); simular execução; gerar `REMINDER_TRIGGERED` e exibir `toast-success`.
5. **Acessibilidade/UX**
   - `data-testid` estáveis; navegação por teclado (foco/ordem); **sem scroll indevido**; toasts e loaders consistentes.
6. **Qualidade/Performance**
   - P95 < 400ms para: listar threads; abrir thread; mover card no Kanban. Evidenciar com logs de tempo de consulta/resposta.

---

## 6) Requisitos Não Funcionais
- **Performance**: P95 < 400ms (listagens/movimentações principais).
- **Segurança**: **RLS** por `org_id`; apenas membros da organização podem CRUD de threads/eventos.
- **Auditoria**: logs de criação/edição/estado de threads, eventos, lembretes (quem, quando, o quê).
- **Disponibilidade/Backup/Monitoramento**: seguir padrões atuais (Vercel + Supabase + Sentry/Analytics).

---

## 7) Arquitetura & Implementação

### 7.1 Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind, Radix/Shadcn.
- **Backend**: Supabase (Postgres + RLS) + Edge Functions (cron).
- **Testes**: **TestSprite + Puppeteer + Jest/Vitest**.
- **Deploy/Monitoramento**: Vercel + Supabase + Sentry/Analytics.

### 7.2 Banco de Dados (DDL – orientação)
Índices essenciais:
- `relationship_threads (org_id, student_id)`
- `relationship_events (thread_id, created_at desc)`
- `relationship_kanban_items (column_id, position)`
- GIN em `relationship_events.payload` (consultas por atributos).
- Colunas `created_at` com default `now()` e `NOT NULL` onde aplicável.

RLS (amostra):
```sql
create policy "rel_threads_org"
on relationship_threads
for all
using (org_id = auth.org_id())
with check (org_id = auth.org_id());
```

Triggers:
- `trg_kanban_badges_upd`: ao criar/concluir TODO → recalcula `badges.pending_tasks` do card.
- `trg_reminders_schedule`: ao criar/editar reminder → computa `next_run_at` (janela mínima 1 min).
- `trg_audit_rel`: escreve em tabela de auditoria padronizada (autor, ação, alvo, timestamp).

### 7.3 Edge Functions (exemplos)
- `rel_apply_template_preview(thread_id, template_code, vars)` → retorna `body_resolvido`.
- `rel_apply_template_commit(...)` → grava `relationship_events` (`TEMPLATE_APPLIED`).
- `rel_schedule_tick()` (cron) → percorre `reminders` por janela; dispara `REMINDER_TRIGGERED` e atualiza `next_run_at`.

### 7.4 Seletores TestSprite (convencões)
- Listagem: `data-testid="rel-list"`, item: `rel-item-{threadId}`
- Ações: `btn-new-thread`, `btn-add-note`, `btn-add-task`, `btn-apply-template`, `btn-add-reminder`
- Kanban: `kan-col-{columnId}`, card: `kan-card-{threadId}`
- Toasts: `toast-success`, `toast-error`

---

## 8) GATES (v0.4.0)
**R1.0** Esquema DB + RLS + triggers (migrações)  
**R1.1** Templates de Mensagens (CRUD + preview/commit)  
**R1.2** Threads & Events (UI + API)  
**R1.3** Kanban de Relacionamento (D&D, WIP, badges)  
**R1.4** Motor de Lembretes (regras + cron + toasts)  
**R1.5** UX Premium pass (acessibilidade, estados, navegação)  
**R1.6** QA Automatizado (TestSprite) + evidências  
**R1.7** Performance P95 < 400ms (evidências)  
**R1.8** Documentação e Governança (Atividades.txt, Pendências, Checklist)

---

## 9) Plano de Testes (TestSprite)

### 9.1 Cenários Automatizados (exemplos)
1. **Criar thread**: navegar → `btn-new-thread` → salvar → exibir `kan-card-{id}` na coluna default (tempo < 2s).
2. **Adicionar nota**: abrir thread → `btn-add-note` → salvar → evento aparece na timeline.
3. **Tarefa**: criar TODO com `due_at` → badge pendente +1; concluir → badge -1.
4. **Template**: `btn-apply-template` → preview com variáveis resolvidas → commit → evento `TEMPLATE_APPLIED`.
5. **Mover no Kanban**: D&D entre colunas; bloquear quando WIP excedido (tooltip explicativo).
6. **Lembrete**: `btn-add-reminder` (D+3 pós‑matrícula) → simular cron → evento `REMINDER_TRIGGERED` + `toast-success`.
7. **Acessibilidade**: tab ordem correta; roles ARIA; foco visível.
8. **Performance**: medir P95 (listar, abrir thread, mover card) < 400ms (logado em evidências).

### 9.2 Evidências obrigatórias
- Relatório de testes 100% (TestSprite) + GIF/PNG dos fluxos críticos.
- Logs com tempos de consulta/resposta (X‑Query‑Time).
- Registro em **Atividades.txt** (timestamp real, GATE, evidências).

---

## 10) Riscos & Mitigações
- **Desvio de performance** em queries de Kanban/Eventos → índices, EXPLAIN, caching leve e telemetria P95 por rota.
- **UX inconsistente** com o padrão premium → checklist visual e QA cross‑browser.
- **Regras de lembrete mal configuradas** → presets validados, limites de recorrência e janela mínima (>= 1 min).

---

## 11) Governança e Processo de Release
- **Documentos**: atualizar `Atividades.txt`, `Pendencias_*.txt`, `Checklist_Release_Validation.txt`, `PRD_v0.4.0.md`.
- **Processo**: Desenvolvimento → QA automatizado/manual → Aprovação GP → Deploy → Monitoramento.
- **Checklist de Validação (amostra)**  
  - Funcionalidades: Threads/Events/Kanban/Lembretes OK.  
  - UX: navegação/breadcrumb, estados vazios, toasts, sem scroll indevido.  
  - Acessibilidade: `data-testid` + ARIA, tabulação.  
  - Segurança: RLS por org; políticas CRUD corretas.  
  - Performance: P95 < 400ms com evidências anexas.  
  - QA: Suite TestSprite 100% passando; evidências arquivadas.

---

## 12) Critérios de Aceite Executivos (resumo)
- Threads, Eventos, Kanban e Lembretes **funcionais e auditáveis**.
- **UX premium** (navegação, acessibilidade, feedback, zero scroll indevido).
- **P95 < 400ms** com evidências anexadas.
- **TestSprite** 100% verde, com seletores `data-testid` estáveis.
