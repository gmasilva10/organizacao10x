## Evidência — Correções de Login/Cache e Validação de Aniversário (2025-10-29)

### Contexto
Foram observados dois problemas:
- Após logoff e login com outro usuário/tenant, o cabeçalho continuava exibindo o nome do usuário anterior até forçar refresh (F5).
- Campo de data de aniversário aceitava ano com mais de 4 dígitos.

### Alterações Implementadas
1) Autenticação/Cache
- `web/app/(app)/app/layout.tsx`: marcado como `force-dynamic`, `revalidate = 0` e `fetchCache = 'force-no-store'` para impedir cache de RSC em sessão/tenant.
- `web/components/AppShell.tsx`: no logout, limpeza de `localStorage` relevante e `window.location.assign('/')` para forçar recarregamento completo da aplicação.

2) Validação de Aniversário
- Ajustes nos validadores e telas de aluno para exigir ano com 4 dígitos (YYYY) e impedir entrada superior a 4 caracteres.

### Como Reproduzir (antes)
1. Login com usuário A, acessar `/app` (nome A no topo).
2. Fazer logoff e logar com usuário B de outra organização.
3. Cabeçalho permanecia mostrando nome A até pressionar F5.

### Validação (depois)
- Após logoff → login com usuário B, o cabeçalho atualiza imediatamente (sem F5).
- Campo de aniversário bloqueia ano > 4 dígitos e valida formato YYYY.

### Riscos & Observações
- Pequeno custo de performance por desabilitar cache do layout autenticado; benefício de consistência de sessão supera o custo.
- Logout com reload completo garante não haver estado residual entre contas/tenants.


