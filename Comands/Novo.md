# Objetivo
Projetar e implementar uma nova funcionalidade de forma incremental, segura e consistente com o projeto.

# Como responder (ordem obrigatória)
1) ENTENDIMENTO & CONTEXTO
   - Resumo do problema/objetivo (2–3 linhas)
   - Escopo IN / OUT
   - Usuários/roles afetados

2) REUSO-FIRST
   - Liste módulos/símbolos existentes a reutilizar (arquivos e exports).
   - Se algo parecido existir, importá-lo; é proibido duplicar lógica.
   - Se não houver, justificar em 1–2 linhas e propor extração para módulo canônico.

3) ESPECIFICAÇÃO FUNCIONAL
   - User stories (Given/When/Then ou bullets)
   - Critérios de aceitação (ACs) testáveis
   - Estados & fluxos (feliz/erros/vazios/loading)

4) CONTRATOS & DADOS
   - Tipos/DTOs/esquemas (zod/TypeScript) e validação
   - APIs/ações: assinatura, inputs/outputs, erros previstos
   - Permissões/autorização (roles, guardas)

5) ARQUITETURA & DEPENDÊNCIAS
   - Fluxo de dados e pontos assíncronos
   - Integrações (DB, cache, serviços)
   - Performance/a11y/i18n: orçamentos e riscos

6) PLANO DE IMPLEMENTAÇÃO (incremental)
   - Estrutura de arquivos (árvore pretendida)
   - Passos em pequenos PRs (1–3 arquivos por passo)
   - Migrações/refactors necessários (se houver)

7) TESTES & OBSERVABILIDADE
   - Unit/integration/E2E necessários (o que validar)
   - Logs, métricas e eventos para monitorar

8) PATCH (diff)
   - Entregar **apenas o patch mínimo** em unified diff
   - Mostrar imports de módulos reutilizados

9) ROLLOUT & RISCOS
   - Feature flag/gradual release, efeitos colaterais e rollback

# Regras
- Máx. 3 perguntas objetivas se faltar algo crítico.
- Proibido duplicar constantes/enums/services/hooks existentes — importar da fonte única.
- Preferir extração para reutilização em vez de copiar e colar.
- Alinhar com @Padroes.md (nomenclatura, lint, pastas).
- Mantenha o patch pequeno; evite refactors amplos fora do escopo.

# Formato de saída
### Entendimento
### Reuso (referências existentes)
### Especificação (ACs)
### Contratos & Dados
### Arquitetura & Dependências
### Plano (arquivos e passos)
### Patch (diff)
### Testes & Observabilidade
### Rollout & Riscos