## Relatório de Auditoria: Vestígios de `tenant_id`

Data: 2025-10-08

Resumo:
- Código-fonte: nenhuma referência funcional a `tenant_id` encontrada (apenas textos de documentação/planejamento).
- Banco (Supabase): políticas atualizadas; funções corrigidas; nenhuma coluna/índice/constraint restante com `tenant_id`.

Detalhes da verificação (amostra):
- Código: busca global por `tenant_id|tenantId|tenant-id|tenantid` sem ocorrências funcionais.
- Políticas storage.objects reescritas para `(storage.foldername(name))[1] = m.org_id::text`.
- Funções corrigidas: `has_role`, `has_role_org`, `check_single_default_guideline`, `seed_occurrences_taxonomy` (usa `org_id`).
- Consultas de auditoria em `pg_policies`, `information_schema.columns`, `pg_indexes`, `pg_constraint`: sem correspondências para `tenant_id` após correções.

Ações de garantia:
- Migration “guard” adicionada para impedir reintrodução de colunas `tenant_id`.
- CI com job `tenant-id-audit` para varrer o repositório e falhar se houver referências proibidas.


