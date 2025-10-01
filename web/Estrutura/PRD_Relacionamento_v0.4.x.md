# PRD – Módulo de Relacionamento (v0.4.x) – Enxuto (testsprite)

**Data**: 2025-09-29  
**Flag leitura templates v2**: `REL_TEMPLATES_V2_READ` (1=ON; 0/ausente=OFF)

---

## 1) Objetivo
- Gerir relacionamento com alunos via tarefas (automáticas e manuais) e operar no Kanban.
- Fontes de tarefas: Job diário (âncoras), Gatilho de Ocorrência, Mensagem Manual.

---

## 2) Fluxos Principais
- Templates (dual‑write; leitura por flag): `GET/POST /api/relationship/templates`
- Job diário: `POST /api/relationship/job` (Bearer `$CRON_SECRET`)
- Kanban tarefas: `GET/PATCH /api/relationship/tasks`
- Gatilho de ocorrência: `POST /api/relationship/occurrence-trigger`
- Timeline aluno: `GET /api/students/{id}/relationship-logs`

Âncoras suportadas no job agora: `sale_close`, `birthday`, `occurrence_followup`. Demais: no‑op até padronização.

---

## 3) Como Popular o Kanban (passo a passo)
1. (Staging) Ativar flag v2: `REL_TEMPLATES_V2_READ=1`.
2. Templates: criar/ativar ao menos 1 com âncora `sale_close` (execução hoje).  
   Endpoint: `GET/POST /api/relationship/templates`.
3. Job: `POST /api/relationship/job` com body `{"tenant_id":"<TENANT_UUID>"}` e `Authorization: Bearer $CRON_SECRET`.
4. Tarefa manual: usar Composer (UI) ou `POST /api/relationship/tasks/manual` (quando disponível).
5. Ocorrência: `POST /api/relationship/occurrence-trigger` com `student_id`, `occurrence_id`, `reminder_at`.
6. Ver no Kanban: `GET /api/relationship/tasks` (colunas Pendente/Para Hoje/Enviadas/Snoozed/Skipped).  
   Dica: limpar filtros se “vazio”.

---

## 4) Critérios de Aceite (testsprite)
- CA-01: Job cria tarefas (sem duplicar por dia). Logs `created` por tarefa.
- CA-02: PATCH altera status (sent/snoozed/skipped/failed) e retorna `X-Query-Time`.
- CA-03: Occurrence-trigger cria/atualiza `occurrence_followup` com logs `created/scheduled`.
- CA-04: Kanban exibe colunas corretas; filtros funcionam.
- CA-05: Timeline lista logs do aluno paginados.
- CA-06: P95 GET/PATCH de tarefas < 400ms (amostra mínima do ambiente).

---

## 5) Endpoints (resumo)
- `POST /api/relationship/job` — processa âncoras e templates ativos.  
- `GET/PATCH /api/relationship/tasks` — lista/atualiza tarefas (mapeia logs válidos).  
- `POST /api/relationship/occurrence-trigger` — cria/ajusta tarefa por ocorrência.  
- `GET/POST /api/relationship/templates` — dual‑write (MVP+v2); leitura condicionada à flag.  
- `GET /api/students/{id}/relationship-logs` — timeline do aluno.

---

## 6) Dados e Regras
- Tabelas: `relationship_templates` (MVP), `relationship_templates_v2` (estruturada), `relationship_tasks`, `relationship_logs`.
- Dedup diário: `(student_id, anchor, template_code, scheduled_for::date)`.
- Logs aceitos: `created`, `scheduled`, `sent`, `snoozed`, `skipped`, `failed` (sem logs “globais”).

---

## 7) Observabilidade
- `X-Query-Time` em GET/PATCH de tarefas; `duration_ms` no retorno do job.
- Monitorar 5xx por endpoint para alerta básico.

---

## 8) Rollback
- Desativar `REL_TEMPLATES_V2_READ` (0/ausente) e repetir o passo a passo (lendo do MVP).

---

## 9) Referências rápidas
- Kanban: `web/components/relationship/RelationshipKanban.tsx`
- Job: `web/app/api/relationship/job/route.ts`
- Tasks: `web/app/api/relationship/tasks/route.ts`
- Occurrence-trigger: `web/app/api/relationship/occurrence-trigger/route.ts`
- Templates: `web/app/api/relationship/templates/route.ts`
- Timeline: `web/app/api/students/[id]/relationship-logs/route.ts`


