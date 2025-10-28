# Objetivo
Inventariar todo o repositório, identificar arquivos/pastas não usados e aplicar uma limpeza **segura**, sem quebrar o build/rotas e **SEM tocar em `Comands/`**.

# Escopo
- Alvo: raiz do repo.
- Exclusões absolutas (NÃO alterar/apagar): `Comands/**`
- Por padrão, só mover/apagar o que cumprir **Tripla Verificação** (abaixo).

# Estratégia (ordem obrigatória)
1) INVENTÁRIO
   - Gerar lista (caminho, tamanho, último commit) de todos os arquivos.
   - Classificar por tipo: código (ts/tsx/js), estilos, assets, testes, snapshots, docs, scripts, migrações, configs.

2) ÁRVORE DE DEPENDÊNCIAS
   - Construir grafo de imports/uso entre arquivos.
   - Mapear **consumidores** de cada arquivo e detectar **órfãos** (sem referências).

3) TRIPLA VERIFICAÇÃO (regra para considerar remoção)
   ✅ A) **Sem referências estáticas** (grafo/grep/knip/ts-prune)  
   ✅ B) **Sem referências convencionais** (Next.js file-routing, Server Actions, CSS globais, env, imagens usadas no markup)  
   ✅ C) **Build + testes passam** após remoção simulada

4) RELATÓRIO (DRY-RUN)
   - **Tabela de candidatos**: caminho | tipo | por que está sobrando (A/B/C) | risco | ação sugerida (mover p/ `_archive/`, apagar, manter)
   - **Lista de falsos positivos potenciais** (dynamic import, i18n, require condicional)
   - **Plano de aplicação** por passos pequenos (≤20 arquivos por passo)

5) APLICAÇÃO (opcional)
   - Criar branch `chore/cleanup-YYYYMMDD`.
   - Para **APAGAR** usar `git rm` (ou mover para `_archive/cleanup-YYYYMMDD/` se `modo_quarentena=true`).
   - Ajustar imports/rotas **se necessário**.
   - Rodar typecheck, lint, build e testes; se falhar, **reverter** o passo e reclassificar.

6) VALIDAÇÃO FINAL
   - `typecheck`/`lint`/`test`/`build` OK, app sobe local, rotas principais funcionam.
   - Publicar **Relatório de Limpeza** com diffs e motivo de cada remoção.

# Comandos úteis (use npx/pnpm/yarn conforme o projeto)
- Inventário: `git ls-files -z | xargs -0 -I{} bash -lc 'printf "%s\t" "{}"; git log -1 --format="%cs" -- {}; du -h {} | cut -f1'`
- Grafo: `npx dependency-cruiser . --exclude "node_modules|Comands|_archive" --output-type dot > dep-graph.dot`
- Não usados (exports/arquivos): `npx knip` e `npx ts-prune -p tsconfig.json`
- Grep de referências: `rg -n --hidden --glob '!node_modules' --glob '!Comands/**' '<arquivo|export>'`
- Qualidade: `pnpm typecheck && pnpm lint && pnpm test && pnpm build` (ajuste aos scripts do seu `package.json`)
- Next.js: `pnpm next build` para pegar quebras de rotas/imports convencionais

# Regras
- **NUNCA** tocar em `Comands/**`.
- **Sem v2 paralela**: não criar pastas novas para substituir antigas; limpeza é **in-place**.
- Tudo que virar obsoleto deve ser **removido** ou movido para `_archive/cleanup-YYYYMMDD/` (quarentena opcional).
- Não deletar: arquivos de migração/seed de banco, configs de deploy/CD, exemplos de `.env` (a não ser que você autorize explicitamente).
- Se um arquivo parecer duplicado, preferir **unificar** e remover duplicatas no mesmo patch.
- Máx. 3 perguntas objetivas se faltar algo crítico antes de aplicar.

# Formato de saída (obrigatório)
### Sumário
Totais por tipo (código, testes, assets, etc.) e candidatos à remoção.

### Candidatos (Dry-run)
| Caminho | Tipo | Evidências (A/B/C) | Risco | Ação sugerida |
|--------|------|---------------------|-------|---------------|

### Exclusões e Proteções
Lista de caminhos protegidos (inclui `Comands/**`) e razões.

### Plano de Aplicação (passos)
Passo N: arquivos, diffs esperados, checagens a executar.

### Patch (se autorizado)
Unified diff por passo (usar `git rm` ou mover p/ `_archive/...`).

### Validação Final
Resultados de typecheck/lint/build/test e verificação manual de rotas.

### Observações
Falsos positivos/decisões de manter e o porquê.