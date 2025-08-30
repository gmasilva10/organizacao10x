Última atualização: 2025-08-26
# ESTRUTURA — Guia de Operação da Pasta
Produto: Personal Global (Organização10x)
Propósito: Central único de documentação viva do projeto (controle de atividades, pendências, erros, padrões e rotas).
Responsável: GP

Como usar
1) Toda alteração relevante deve gerar uma linha em Atividades.txt (com data, autor, escopo e evidência/commit).
2) Tudo que não vamos tratar agora, mas não pode se perder, entra em Pendencias.txt (ou Pendencias_<mêsAno>.txt).
3) Bugs/erros sempre registrados em Erros.txt (com passos para reproduzir + status).
4) Qualquer decisão de padrão (UI, código, acessibilidade, naming, pastas) vai para Padronizacao.txt.
5) Rotas (públicas/protegidas) e navegação ficam em Rotas.txt.
6) Se for usado mock local antes de banco/integração, documente em ControleDataMock.txt.

Fluxo mínimo diário
- Manhã: revisar Pendências, priorizar 3 itens do dia, registrar no topo do Atividades.txt.
- Tarde: atualizar status dos itens do dia e registrar aprendizados/decisões em Padronizacao.txt.
- Fim do dia: checklist de QA rápido + commit + atualização dos arquivos de Estrutura.

Checklist de “pronto”
- Build sem erros e sem warnings relevantes.
- Lighthouse: Performance ≥ 0.90, Acessibilidade ≥ 0.95, SEO ≥ 0.90 (em ambiente de build).
- Design consistente com paleta e padrões definidos.
- Documentação nesta pasta atualizada no mesmo commit.

Commits
- Usar Conventional Commits (ex.: feat(students): ..., docs(estrutura): ...)
- Incluir links para evidências em `web/evidencias` no corpo do commit [[Conventional Commits e evidências]].

Como registrar uma nova entrada (exemplo prático)
- Atividades.txt:
  [2025-08-13 17:10] DEV — DOC — Estrutura — Criação e padronização da pasta Estrutura — commit:<hash>

[2025-08-13] Conclusão da Sprint Landing v1.0
- Landing Page validada com Performance ≥ 0.90, A11y ≥ 0.95, SEO ≥ 0.90, LCP ≤ 2.5s
- Build de produção limpo, sem imports não utilizados
- Estrutura atualizada (Atividades, Pendencias_Agosto2025, Padronizacao se AA, Erros se houve)
- Carimbo v1.0 realizado pelo GP; próximo foco: Módulos do Sistema (Clientes, Comunicação, Dashboard)
