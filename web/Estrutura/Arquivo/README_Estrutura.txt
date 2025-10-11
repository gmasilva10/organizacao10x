 ltima atualiza  o: 2025-08-26
# ESTRUTURA   Guia de Opera  o da Pasta
Produto: Personal Global (Organiza  o10x)
Prop sito: Central  nico de documenta  o viva do projeto (controle de atividades, pend ncias, erros, padr es e rotas).
Respons vel: GP

Como usar
1) Toda altera  o relevante deve gerar uma linha em Atividades.txt (com data, autor, escopo e evid ncia/commit).
2) Tudo que n o vamos tratar agora, mas n o pode se perder, entra em Pendencias.txt (ou Pendencias_<m sAno>.txt).
3) Bugs/erros sempre registrados em Erros.txt (com passos para reproduzir + status).
4) Qualquer decis o de padr o (UI, c digo, acessibilidade, naming, pastas) vai para Padronizacao.txt.
5) Rotas (p blicas/protegidas) e navega  o ficam em Rotas.txt.
6) Se for usado mock local antes de banco/integra  o, documente em ControleDataMock.txt.

Fluxo m nimo di rio
- Manh : revisar Pend ncias, priorizar 3 itens do dia, registrar no topo do Atividades.txt.
- Tarde: atualizar status dos itens do dia e registrar aprendizados/decis es em Padronizacao.txt.
- Fim do dia: checklist de QA r pido + commit + atualiza  o dos arquivos de Estrutura.

Checklist de  pronto”
- Build sem erros e sem warnings relevantes.
- Lighthouse: Performance ≥ 0.90, Acessibilidade ≥ 0.95, SEO ≥ 0.90 (em ambiente de build).
- Design consistente com paleta e padr es definidos.
- Documenta  o nesta pasta atualizada no mesmo commit.

Commits
- Usar Conventional Commits (ex.: feat(students): ..., docs(estrutura): ...)
- Incluir links para evid ncias em `web/evidencias` no corpo do commit [[Conventional Commits e evid ncias]].

Como registrar uma nova entrada (exemplo pr tico)
- Atividades.txt:
  [2025-08-13 17:10] DEV   DOC   Estrutura   Cria  o e padroniza  o da pasta Estrutura   commit:<hash>

[2025-08-13] Conclus o da Sprint Landing v1.0
- Landing Page validada com Performance ≥ 0.90, A11y ≥ 0.95, SEO ≥ 0.90, LCP ≤ 2.5s
- Build de produ  o limpo, sem imports n o utilizados
- Estrutura atualizada (Atividades, Pendencias_Agosto2025, Padronizacao se AA, Erros se houve)
- Carimbo v1.0 realizado pelo GP; pr ximo foco: M dulos do Sistema (Clientes, Comunica  o, Dashboard)
