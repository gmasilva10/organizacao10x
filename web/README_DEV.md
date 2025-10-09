# DEV   Endpoints de Debug e Sentinela (Students)

Habilita  o: defina `NEXT_PUBLIC_DEBUG=true` em `.env.development.local`.

## Endpoints

- `GET /api/_debug/session`
  - Retorna `{ env, userId, orgId, role }` resolvidos no servidor.

- `GET /api/_debug/students/:id/raw`
  - Retorna o registro  cru” de `students` (respeita RLS). Inclui `id, tenant_id, deleted_at, status, ...`.

- `GET /api/_health/students-consistency`
  - Seleciona 3 alunos da listagem (tenant + soft delete) e verifica o item  nico para cada `id`.
  - Se qualquer aluno estiver na lista mas o item  nico retornar vazio/404, responde 500 com diagn stico.

## Cabe alhos de Debug (presentes em `/api/students` e `/api/students/:id`)

- `X-Debug-Env`
- `X-Debug-Commit`
- `X-Debug-Tenant`
- `X-Debug-User`
- `X-Debug-Flags` → `STUDENTS_USE_SOFT_DELETE=<true|false>`

## Cache

- DEV: `Cache-Control: no-store` + `Pragma: no-cache` ativados na API.
- Front: `fetch(..., { cache: 'no-store' })` em lista e item  nico; edi  o sempre faz fetch fresh.

## Visibilidade (DEV only)

- Cards e edi  o exibem `id=<uuid>` quando `NEXT_PUBLIC_DEBUG=true`.

## Execu  o de QA

1. Verifique sess o: `GET /api/_debug/session`.
2. Execute sentinela: `GET /api/_health/students-consistency` → esperado `{ ok: true }`.
3. Liste alunos: `GET /api/students?page=1&page_size=3` e colete `X-Debug-*`.
4. Para o primeiro `id`, chame `GET /api/students/:id` → 200.
5. Para um `uuid` inexistente, chame `GET /api/students/00000000-0000-0000-0000-000000000000` → 404.
6. Valide cross-tenant via RLS: com token/tenant A, tente `id` do tenant B → 403/404.
7. Atualize `testsprite_tests/testsprite-mcp-test-report.md` com as respostas cruas (bodies + X-Debug-*).
