# Smoke de Relacionamento (cURL)

Objetivo: validar rapidamente o caminho crítico (templates v2 + dual‑write + job + Kanban + occurrence‑trigger + timeline) em staging. Rollback imediato via flag.

## Pré‑requisitos

- Variável de ambiente ativada em staging: `REL_TEMPLATES_V2_READ=1`.
- Valores à mão:
  - `BASE_URL` (ex.: https://staging.seudominio.com)
  - `ORG_ID` (UUID da organização de teste)
  - `CRON_SECRET` (segredo usado pelo job)
  - `STUDENT_ID` (UUID de um aluno de teste, opcional para occurrence‑trigger e timeline)
  - `OCCURRENCE_ID` (ID inteiro de uma ocorrência de teste, opcional)

Use os comandos abaixo substituindo os placeholders.

---

## 1) GET templates (leitura v2 via flag)

```bash
curl -sS "$BASE_URL/api/relationship/templates"
```

Deve retornar os templates lidos de `relationship_templates_v2` (flag v2 ON). Se quiser formatar a saída e tiver `jq`, acrescente `| jq .`.

---

## 2) POST template (dual‑write: MVP + v2)

```bash
curl -sS -X POST "$BASE_URL/api/relationship/templates" \
  -H 'Content-Type: application/json' \
  --data '{
    "code":"SMOKE_MSG",
    "title":"Smoke Template",
    "anchor":"sale_close",
    "touchpoint":"Smoke Touchpoint",
    "suggested_offset":"+0d",
    "channel_default":"whatsapp",
    "message_v1":"Olá [Nome] — smoke test",
    "active":true,
    "priority":0,
    "audience_filter":{},
    "variables":["Nome","PrimeiroNome"]
  }'
```

Esperado: criação OK no MVP e tentativa de gravação no v2 (best‑effort). Repita o GET acima para conferência.

---

## 3) POST job (Bearer $CRON_SECRET)

```bash
curl -sS -i -X POST "$BASE_URL/api/relationship/job" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H 'Content-Type: application/json' \
  --data "{\"org_id\":\"$ORG_ID\"}"
```

Checar `stats.duration_ms` e mensagens de erro (se houver). O job respeita dedup por dia.

---

## 4) GET tasks (Kanban) — medir P95 com `X-Query-Time`

```bash
curl -sS -i "$BASE_URL/api/relationship/tasks?page=1&page_size=10"
```

Verifique o cabeçalho `X-Query-Time` e a lista de itens (colunas Pendente/Para Hoje/Enviadas/Snoozed/Skipped).

---

## 5) PATCH task (quick action)

1) Anote um `id` de tarefa do passo anterior (ex.: `TASK_ID`).
2) Rode o PATCH para marcar como enviada:

```bash
curl -sS -i -X PATCH "$BASE_URL/api/relationship/tasks" \
  -H 'Content-Type: application/json' \
  --data "{\"task_id\":\"$TASK_ID\",\"status\":\"sent\"}"
```

Espera‑se header `X-Query-Time` e log com ação válida (`sent`).

---

## 6) POST occurrence‑trigger (opcional)

Requer `STUDENT_ID` e `OCCURRENCE_ID` (inteiro). Ajuste `reminder_at` para um instante futuro (RFC3339):

```bash
WHEN=$(date -u +"%Y-%m-%dT03:00:00Z")
curl -sS -i -X POST "$BASE_URL/api/relationship/occurrence-trigger" \
  -H 'Content-Type: application/json' \
  --data "{\"student_id\":\"$STUDENT_ID\",\"occurrence_id\":$OCCURRENCE_ID,\"reminder_at\":\"$WHEN\",\"occurrence_type\":\"SMOKE\",\"occurrence_notes\":\"Smoke test\",\"org_id\":\"$ORG_ID\"}"
```

Verificar criação/atualização de tarefa `occurrence_followup` e log de `created` / `scheduled`.

---

## 7) GET timeline do aluno (opcional)

```bash
curl -sS "$BASE_URL/api/students/$STUDENT_ID/relationship-logs?page=1&page_size=10"
```

Deve listar os logs do aluno (ações válidas, paginação e filtros funcionam).

---

## Rollback (flag OFF)

1) Desativar `REL_TEMPLATES_V2_READ` no staging (unset ou `=0`).
2) Repetir o GET de templates:

```bash
curl -sS "$BASE_URL/api/relationship/templates"
```

Deve voltar a ler do MVP (`relationship_templates`). O restante do fluxo segue funcionando (dual‑write permanece na criação/edição/exclusão).

