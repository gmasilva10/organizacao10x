# Objetivo
Realizar uma validação completa do módulo informado na solicitação, cobrindo funcional, código, dados, integrações, UX/UI, segurança, performance e observabilidade. Não alterar código sem autorização.

# Referências
- Siga @Padroes.md (estilo/DRY)
- Consulte @Seguranca.md para checagens de segurança
- Se houver falhas, use @Erro.md para diagnóstico

# Como responder (ordem obrigatória)
1) SUMÁRIO (2–3 linhas)
   - Visão geral + status: OK / Alertas / Bloqueios

2) ESCOPO & CONTEXTO
   - Caminho do módulo, rotas/endpoints, principais componentes/hooks/serviços
   - Usuários/roles afetados e objetivos do módulo

3) INVENTÁRIO DO MÓDULO
   - **Árvore de arquivos** (curta) com responsabilidade por arquivo
   - **Contratos** (props/tipos/DTOs/schemas) e **APIs** expostas/consumidas
   - Dependências internas (imports) e externas (libs/serviços)

4) FORMULÁRIOS & REGRAS (se houver UI)
   - **Tabela de campos** (nome, tipo, obrigatório?, validação client/server, máscara, estados de erro/disabled)
   - Fluxos: criar/editar/excluir, estados (loading/vazio/erro/sucesso), navegação e acessibilidade (foco/atalhos)
   - i18n (textos, plural, datas/números)

5) BANCO DE DADOS & DADOS
   - Tabelas envolvidas, colunas (tipo, null, default), **chaves** (PK/FK/unique), **índices**
   - Regras: constraints, **RLS/ACL** (se houver), policies, triggers, migrations
   - **Transação** do caso principal (ex.: cadastro): o que grava, em que ordem, idempotência e rollback
   - Retenções/anonimização, PII, auditoria (created_at/updated_at/actor)

6) INTEGRAÇÕES & PROCESSOS
   - Mapa de integrações (fonte → destino), eventos gerados/consumidos
   - Dependências assíncronas (jobs/filas/webhooks) e tolerância a falhas
   - Contratos de erro/retry/backoff e timeouts

7) SEGURANÇA (resumo; detalhes em @Seguranca.md)
   - Autenticação/Autorização por ação/rota
   - Exposição de segredos/tokens (client vs server)
   - Superfícies: XSS, CSRF, injeções, validação/saneamento, rate limit
   - Logs com **redação** de PII/segredos

8) PERFORMANCE & CONFIABILIDADE
   - N+1/I-O bloqueante, uso de cache/paginação, tamanho de payloads
   - Orçamentos de latência e tempo de first interaction (se UI)
   - Concurrency/race conditions e idempotência em operações de escrita

9) OBSERVABILIDADE & TESTES
   - Logs/metrics/traces/eventos de domínio (nomes e payloads)
   - Cobertura de testes (unit/integration/E2E) e lacunas relevantes
   - Cenários de regressão críticos e como testar

10) QUALIDADE DO CÓDIGO
   - Consistência com @Padroes.md, nomenclatura, responsabilidades claras
   - **DRY/Reuso**: duplicações detectadas e onde importar do canônico
   - Dead code/exports não usados e organização de pastas

11) ACHADOS & RECOMENDAÇÕES
   - **Tabela**: ID | Severidade (P0/P1/P2) | Área (Form/DB/Segurança/Perf/UX) | Descrição | Evidência (arquivo/linha) | Ação sugerida
   - **Quick wins** (alto impacto/baixo esforço) e **mudanças estruturais** (com plano)

12) PATCH (opcional, se autorizado)
   - **Diff mínimo** com reuso obrigatório e sem criar módulo paralelo
   - Se renomear/mover, incluir atualização de imports/rotas e remoção de código morto

13) PRÓXIMOS PASSOS
   - Prioridades, esforço estimado, riscos/rollback, responsáveis e dependências

# Regras
- Máx. 3 perguntas objetivas se algo crítico faltar.
- **Reuso-first**: importar símbolos canônicos; é proibido duplicar lógica/constantes/enums.
- Não expor credenciais/PII em exemplos; usar placeholders/redaçao.
- Patches só com autorização; sempre **diff mínimo** e **in-place**.
- Referenciar arquivos por caminho e trechos por linha quando apontar problemas.

# Formatos auxiliares

## Tabela de Campos (exemplo)
| Campo          | Tipo     | Obrigatório | Validação client | Validação server | Máscara/Formato | Estado de erro |
|----------------|----------|-------------|------------------|------------------|-----------------|----------------|

## Tabela de Achados
| ID | Sev | Área       | Descrição curta | Evidência (arquivo:linha) | Ação sugerida |
|----|-----|------------|------------------|---------------------------|---------------|