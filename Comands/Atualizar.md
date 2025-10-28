# Objetivo
Aplicar a mudança no **alvo informado na solicitação** (citar caminho exato) por **refactor in-place**, mantendo compatibilidade, reusando o que já existe e sem criar módulo paralelo.

# Entregue nesta ordem
1) DELTA
   - O que muda (2–3 linhas) e as **invariantes** (APIs/props/contratos/estilos que permanecem).
2) MAPA DE IMPACTO
   - Consumidores do alvo (arquivos/rotas/hooks). O que precisa ajustar vs. fica igual.
3) REUSO-FIRST
   - Símbolos a **reutilizar** (arquivo + export). É proibido duplicar lógica/constantes/enums.
4) PLANO (pequenos passos)
   - Arquivos tocados, renomeações/moves (com atualização de **imports**), codemod se necessário.
5) PATCH (diff mínimo)
   - Somente as alterações essenciais no alvo e pontos impactados.
6) TESTES & VALIDAÇÃO
   - Testes atualizados (unit/integration/E2E) e passos manuais.
7) LIMPEZA & ROTAS
   - Remover código morto/exports não usados. Ajustar **rotas/rewrites** e links.
8) RISCOS & ROLLBACK
   - Riscos, feature flag/adapter e como reverter.

# Regras
- **In-place**: não criar diretório/“v2”/módulo novo.
- Se quebrar contrato, ofereça **adapter**/alias de rota e plano de migração.
- Atualize todos os **imports** dos consumidores quando renomear/mover.
- **DRY** obrigatório; importar do módulo canônico.
- Máx. 3 perguntas objetivas se faltar algo crítico.