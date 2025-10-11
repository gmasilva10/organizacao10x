# PRD   Organiza  o10x v0.4.0
**M dulo desta release**: Relacionamento (CRM de relacionamento + lembretes operacionais)  
**Patrocinador**: Personal Global  
**Consultor Externo**: _a confirmar_  
**Gerente de Projetos (GP)**: Gustavo Moreira  
**DEV respons vel**: _a confirmar_  
**Data**: 12/09/2025

---

## 1) Vis o e Realinhamento
O M dulo de **Relacionamento** habilita o time a gerir intera  es cont nuas com o aluno (mensagens, lembretes e tarefas de follow-up) conectadas a **Alunos** e **Servi os**, com **Kanban de Relacionamento** e **Templates de Mensagens**.

**Realinhamento de escopo (v0.4.0):** o plano anterior previa avan os em Financeiro/Planos. Por diretriz executiva, priorizamos **Relacionamento** por impacto imediato no valor entregue ao usu rio final. Guard-rails mantidos:
- **Sem integra  o financeira** nesta release (sem cobran as, pacotes, faturas).
- **Sem disparo externo** (WhatsApp/Email) nesta release; apenas lembretes internos e registro de notas/mensagens.
- **Performance P95 < 400ms**, **RLS ativa** por organiza  o e **auditoria completa**.

**Encaixe no fluxo de valor** (roadmap macro):  
Cadastro de Alunos → Cadastro de Servi os → **Relacionamento** → Onboarding/Kanban → Hist rico → Pagamentos.

---

## 2) Objetivos da Release v0.4.0
1. **Threads de Relacionamento** por aluno/servi o, com eventos (notas, tarefas, aplica  o de template, lembretes).
2. **Kanban de Relacionamento** (colunas configur veis, WIP limit, prioridades, badges din micos).
3. **Templates de Mensagens** (in-app/operacionais) com vari veis can nicas (ex.: `{aluno.nome}`, `{servico.nome}`, `{data_sessao}`).
4. **Motor de Lembretes** (regras simples + agendamentos internos) para lembrar o usu rio do que enviar/fazer, com toasts/contadores.
5. **UX premium**: consist ncia visual, navega  o clara, **zero scroll indevido**, acessibilidade (`data-testid`, ARIA), feedback imediato (loading, toasts), cross‑browser.
6. **QA automatizado no TestSprite**: cen rios ponta-a-ponta, seletores est veis, evid ncias e checklist.

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
- Cada **thread** pertence a um aluno e pode, opcionalmente, referenciar um servi o.
- Eventos s o **audit veis**; movimenta  o no Kanban gera `STATUS_CHANGE` em `relationship_events`.
- **Sem disparo externo** de mensagens nesta release; foco em lembretes internos e registro de hist rico.

### 3.2 Fluxos Principais (UX)
- **Criar Thread**: na listagem/vis o do aluno ou servi o → bot o  Relacionamento” → modal `threadCreate` → cria thread + item no Kanban (coluna default).
- **Adicionar Evento**: em `ThreadView` → `AddNote`, `AddTask`, `AplicarTemplate` (preview de vari veis → commit).
- **Kanban**: drag‑and‑drop entre colunas, com WIP limit e badges (ex.: tarefas pendentes, lembretes pr ximos).
- **Lembretes**: UI `ReminderRule` → regra simples (ex.:  D+3 ap s matr cula: sugerir mensagem de boas‑vindas”) → motor agenda `next_run_at`; ao disparar, gera evento e mostra toast.
- **Navega  o/Estados**: breadcrumb/Voltar; loaders claros; toasts de sucesso/erro; **sem scroll indevido**; atalhos de teclado (setas/enter/esc).

### 3.3 Fora do Escopo (v0.4.0)
- Envio real por WhatsApp/Email/SMS.
- Integra  o Financeira ou qualquer automa  o de cobran a.
- Push notifications.

---

## 4) UX/UI Premium   Requisitos
- **Consist ncia visual** com a landing; **navega  o clara** (breadcrumb + voltar); **zero scroll indevido**.
- **Acessibilidade**: `data-testid` para todos os elementos interativos cr ticos e roles ARIA adequados.
- **Feedback imediato**: spinners/skeletons, toasts, estados vazios (empty states) e mensagens de erro  teis.
- **Cross-browser**: Chrome, Edge, Firefox ( ltimas 2 vers es).

**Padr es de componentes:**
- Modais customizados (n o nativos), inputs com valida  o inline, tooltips contextuais.
- Reuso de componentes j existentes (cards, lists, toasts) para consist ncia e velocidade.

---

## 5) Crit rios de Aceite (ponta-a-ponta)
1. **Threads**
   - Criar thread vinculada a aluno (com/sem servi o); fechar e reabrir.
2. **Eventos**
   - Adicionar Nota; criar/editar TODO com `due_at`; concluir TODO; aplicar template com **preview** e **commit**.
3. **Kanban**
   - Mover item entre colunas respeitando WIP; bloqueio visual ao exceder WIP; badges atualizados.
4. **Lembretes**
   - Criar regra (ex.: D+3 ap s matr cula); simular execu  o; gerar `REMINDER_TRIGGERED` e exibir `toast-success`.
5. **Acessibilidade/UX**
   - `data-testid` est veis; navega  o por teclado (foco/ordem); **sem scroll indevido**; toasts e loaders consistentes.
6. **Qualidade/Performance**
   - P95 < 400ms para: listar threads; abrir thread; mover card no Kanban. Evidenciar com logs de tempo de consulta/resposta.

---

## 6) Requisitos N o Funcionais
- **Performance**: P95 < 400ms (listagens/movimenta  es principais).
- **Seguran a**: **RLS** por `org_id`; apenas membros da organiza  o podem CRUD de threads/eventos.
- **Auditoria**: logs de cria  o/edi  o/estado de threads, eventos, lembretes (quem, quando, o qu ).
- **Disponibilidade/Backup/Monitoramento**: seguir padr es atuais (Vercel + Supabase + Sentry/Analytics).

---

## 7) Arquitetura & Implementa  o

### 7.1 Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind, Radix/Shadcn.
- **Backend**: Supabase (Postgres + RLS) + Edge Functions (cron).
- **Testes**: **TestSprite + Puppeteer + Jest/Vitest**.
- **Deploy/Monitoramento**: Vercel + Supabase + Sentry/Analytics.

### 7.2 Banco de Dados (DDL   orienta  o)
Índices essenciais:
- `relationship_threads (org_id, student_id)`
- `relationship_events (thread_id, created_at desc)`
- `relationship_kanban_items (column_id, position)`
- GIN em `relationship_events.payload` (consultas por atributos).
- Colunas `created_at` com default `now()` e `NOT NULL` onde aplic vel.

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
- `trg_reminders_schedule`: ao criar/editar reminder → computa `next_run_at` (janela m nima 1 min).
- `trg_audit_rel`: escreve em tabela de auditoria padronizada (autor, a  o, alvo, timestamp).

### 7.3 Edge Functions (exemplos)
- `rel_apply_template_preview(thread_id, template_code, vars)` → retorna `body_resolvido`.
- `rel_apply_template_commit(...)` → grava `relationship_events` (`TEMPLATE_APPLIED`).
- `rel_schedule_tick()` (cron) → percorre `reminders` por janela; dispara `REMINDER_TRIGGERED` e atualiza `next_run_at`.

### 7.4 Seletores TestSprite (convenc es)
- Listagem: `data-testid="rel-list"`, item: `rel-item-{threadId}`
- A  es: `btn-new-thread`, `btn-add-note`, `btn-add-task`, `btn-apply-template`, `btn-add-reminder`
- Kanban: `kan-col-{columnId}`, card: `kan-card-{threadId}`
- Toasts: `toast-success`, `toast-error`

---

## 8) GATES (v0.4.0)
**R1.0** Esquema DB + RLS + triggers (migra  es)  
**R1.1** Templates de Mensagens (CRUD + preview/commit)  
**R1.2** Threads & Events (UI + API)  
**R1.3** Kanban de Relacionamento (D&D, WIP, badges)  
**R1.4** Motor de Lembretes (regras + cron + toasts)  
**R1.5** UX Premium pass (acessibilidade, estados, navega  o)  
**R1.6** QA Automatizado (TestSprite) + evid ncias  
**R1.7** Performance P95 < 400ms (evid ncias)  
**R1.8** Documenta  o e Governan a (Atividades.txt, Pend ncias, Checklist)

---

## 9) Plano de Testes (TestSprite)

### 9.1 Cen rios Automatizados (exemplos)
1. **Criar thread**: navegar → `btn-new-thread` → salvar → exibir `kan-card-{id}` na coluna default (tempo < 2s).
2. **Adicionar nota**: abrir thread → `btn-add-note` → salvar → evento aparece na timeline.
3. **Tarefa**: criar TODO com `due_at` → badge pendente +1; concluir → badge -1.
4. **Template**: `btn-apply-template` → preview com vari veis resolvidas → commit → evento `TEMPLATE_APPLIED`.
5. **Mover no Kanban**: D&D entre colunas; bloquear quando WIP excedido (tooltip explicativo).
6. **Lembrete**: `btn-add-reminder` (D+3 p s‑matr cula) → simular cron → evento `REMINDER_TRIGGERED` + `toast-success`.
7. **Acessibilidade**: tab ordem correta; roles ARIA; foco vis vel.
8. **Performance**: medir P95 (listar, abrir thread, mover card) < 400ms (logado em evid ncias).

### 9.2 Evid ncias obrigat rias
- Relat rio de testes 100% (TestSprite) + GIF/PNG dos fluxos cr ticos.
- Logs com tempos de consulta/resposta (X‑Query‑Time).
- Registro em **Atividades.txt** (timestamp real, GATE, evid ncias).

---

## 10) Riscos & Mitiga  es
- **Desvio de performance** em queries de Kanban/Eventos →  ndices, EXPLAIN, caching leve e telemetria P95 por rota.
- **UX inconsistente** com o padr o premium → checklist visual e QA cross‑browser.
- **Regras de lembrete mal configuradas** → presets validados, limites de recorr ncia e janela m nima (>= 1 min).

---

## 11) Governan a e Processo de Release
- **Documentos**: atualizar `Atividades.txt`, `Pendencias_*.txt`, `Checklist_Release_Validation.txt`, `PRD_v0.4.0.md`.
- **Processo**: Desenvolvimento → QA automatizado/manual → Aprova  o GP → Deploy → Monitoramento.
- **Checklist de Valida  o (amostra)**  
  - Funcionalidades: Threads/Events/Kanban/Lembretes OK.  
  - UX: navega  o/breadcrumb, estados vazios, toasts, sem scroll indevido.  
  - Acessibilidade: `data-testid` + ARIA, tabula  o.  
  - Seguran a: RLS por org; pol ticas CRUD corretas.  
  - Performance: P95 < 400ms com evid ncias anexas.  
  - QA: Suite TestSprite 100% passando; evid ncias arquivadas.

---

## 12) Crit rios de Aceite Executivos (resumo)
- Threads, Eventos, Kanban e Lembretes **funcionais e audit veis**.
- **UX premium** (navega  o, acessibilidade, feedback, zero scroll indevido).
- **P95 < 400ms** com evid ncias anexadas.
- **TestSprite** 100% verde, com seletores `data-testid` est veis.
