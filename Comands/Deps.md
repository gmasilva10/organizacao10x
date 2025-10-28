# Objetivo
Identificar dependências instaladas que **não são usadas**, **podem ser removidas** com segurança ou estão **duplicadas/desalinhadas**, sem quebrar o build. Não alterar nada sem minha autorização.

# O que considerar
- `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`
- Uso em código (imports estáticos/dinâmicos), em **scripts** do package.json e em **arquivos de config**
- Convenções do framework (Next.js/App Router, Server Actions, API routes, public assets, CSS globais)

# Estratégia (ordem obrigatória)
1) INVENTÁRIO
   - Listar todas as libs por escopo (runtime/dev/peer).
   - Marcar versão, tamanho aproximado e última atualização no lockfile.

2) ANÁLISE DE USO
   - **Estático**: procurar `import`/`require`/`new`/`import()` no código.
   - **Scripts**: checar `package.json` (`eslint`, `playwright`, `rimraf`, `ts-node`, etc.).
   - **Configs**: `.eslintrc*`, `tailwind.config.*`, `postcss.config.*`, `jest.config.*|vitest.config.*`, `playwright.config.*`, `next.config.*`, `tsconfig*`, `babel.config.*`, `vercel.json`, etc.
   - **Convencional** (evitar falso positivo):
     - Next.js: `next`, `react`, `react-dom` (usadas pelo framework), `sharp` (otimização), `@vercel/*`
     - Tailwind: `tailwindcss`, `postcss`, `autoprefixer`
     - UI: `@radix-ui/*`, `lucide-react`, `clsx` (confirmar nos componentes)
     - Types: `@types/*` (podem ser “só types”, mas necessárias no compile)
     - Testes/CI: `jest|vitest|playwright`, `eslint*`, `prettier`, `lint-staged`, `husky`
     - Auth/DB: `@supabase/supabase-js` e afins; libs só-server não aparecem no client

3) CLASSIFICAÇÃO
   - **[REMOVE]**: sem uso no código/scripts/configs **e** sem dependência por convenção.
   - **[REVIEW]**: suspeita de uso dinâmico/indireto (plugins, loaders, peers).
   - **[KEEP]**: usada claramente (referência explícita ou convenção do framework).
   - **[DUPLICATE]**: mesma lib com múltiplas versões (conflito).
   - **[PEER-MISSING]**: lib exige peer não instalado (ou versão fora do range).

4) PROVAS
   - Para cada candidata **[REMOVE]**, mostrar **onde não aparece** (grep) e por que não é necessária por convenção.
   - Para **[REVIEW]**, indicar o arquivo/config possivelmente relacionado.

5) DRY-RUN (relatório)
   - Listar por seção: `[REMOVE]`, `[REVIEW]`, `[DUPLICATE]`, `[PEER-MISSING]`, `[KEEP]` (apenas resumo).
   - **Nenhuma remoção aplicada** nesta etapa.

6) APLICAÇÃO (somente se eu autorizar)
   - Criar branch `chore/deps-prune-YYYYMMDD`.
   - Remover **apenas** `[REMOVE]` do `package.json` + lockfile (via `npm|pnpm|yarn remove`).
   - Resolver `[DUPLICATE]` com **resolutions/overrides** ou unificação de versão.
   - Instalar peers faltantes ou alinhar versões.
   - Rodar `typecheck`, `lint`, `test`, `build`, `start` (smoke). Se falhar, **reverter**.

7) SAÍDA FINAL
   - Resumo com números por categoria.
   - Lista detalhada das removidas e justificativas.
   - Próximos passos para os itens `[REVIEW]`.

# Regras
- **Não** tocar na pasta `Comands/`.
- Nada de “substituir por v2”; aqui é só poda de dependências.
- Evitar falso positivo de libs usadas só em config, scripts ou por convenção.
- Máx. 3 perguntas objetivas se faltar algo crítico antes de sugerir remoções.

# Dicas de ferramentas (opcional, se quiser usar)
- Varredura de uso: `npx knip` (arquivos/exports/deps não usados), `npx depcheck`
- Duplicadas: `npm ls <pkg>` / `pnpm why <pkg>`; checar `overrides/resolutions`
- Grep: `rg -n --hidden --glob '!node_modules' '<nome-da-lib>'`

# Formato de saída (obrigatório)
### Sumário
[REMOVE]: N | [REVIEW]: M | [DUPLICATE]: D | [PEER-MISSING]: P | [KEEP] (resumo)

### [REMOVE] (candidatas a remoção segura)
- `lib-x@1.2.3` — sem referências (código/scripts/config); não exigida por convenção.
- `lib-y@4.5.6` — …

### [REVIEW] (verificação manual)
- `lib-z@^3` — pode ser usada via `next.config.*` (plugin). Verificar.

### [DUPLICATE] (unificar versão)
- `lib-a`: 1.0.0 e 1.2.0 (causa: pacote B trava em 1.0). Sugerir override para 1.2.0.

### [PEER-MISSING] (alinhar instalação)
- `eslint-plugin-x` exige `eslint >= 9`. Projeto usa 8.

### [KEEP] (resumo)
- `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, …

### Plano de aplicação (se autorizado)
- Passo 1: remover `lib-x`, `lib-y`; rodar check-suite.
- Passo 2: unificar `lib-a` → 1.2.0 com `overrides`.
- Passo 3: instalar/alinhar peers, reexecutar check-suite.