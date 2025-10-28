# Objetivo
Validar, de ponta a ponta, a {feature/tarefa}, registrando evidências e um relatório final profissional. Não alterar código sem autorização explícita.

# Ambiente
- URL: http://localhost:3000/
- Servidor: ativo
- Credenciais: usar @Credenciais.md (NUNCA exponha segredos no relatório)

# Como proceder (ordem obrigatória)
1) ENTENDIMENTO & ESCOPO
   - Resumo do que deve ser validado (2–3 linhas)
   - Escopo IN/OUT (o que validar / o que fica fora)

2) MATRIZ DE TESTES (ACs)
   - Liste critérios de aceitação testáveis (Given/When/Then)
   - Categorias: Happy Path, Edge Cases, Negativos, Permissões/AutZ
   - Se ACs não existirem, **derive** a partir do requisito/tela e sinalize suposições.

3) PREP & INSTRUMENTAÇÃO
   - Abrir DevTools (Console/Network), limpar storage/cookies quando necessário
   - Preparar dados/fixtures mínimos; logar timestamps dos testes

4) EXECUÇÃO & EVIDÊNCIAS
   - Para cada AC: passos → resultado esperado → resultado observado
   - Evidências: print da tela e/ou trecho de log/Network (sem segredos)
   - Em caso de falha, coletar stack/console/network e condições de reprodução

5) SMOKE NÃO FUNCIONAL
   - Segurança rápida: sem segredos expostos; erros não vazam stack sensível; CORS/cookies ok
   - Performance rápida: tempo de resposta/latência perceptível; ausência de travamentos; N+1 óbvio
   - A11y/UI: foco navegável, labels essenciais

6) RELATÓRIO & RECOMENDAÇÕES
   - Tabela PASS/FAIL por AC
   - Bugs com severidade, passos de reprodução, ambiente, logs, suspeita de causa, sugestão de correção
   - Se sugerir correção, fornecer **patch mínimo** em diff, mas **aplicar só com autorização**

# Regras
- Máx. 3 perguntas objetivas se faltar algo crítico antes de executar.
- Não expor credenciais/PII nas evidências; usar redação.
- DRY: ao sugerir correções, **reutilizar módulos canônicos** (ver @Padroes.md/@Erro.md); nunca duplicar lógica.
- Manter vocabulário direto e profissional no relatório.

# Formato de saída (obrigatório)
### Sumário
Breve visão geral da validação e resultado (X/Y ACs aprovados).

### Ambiente
Browser/OS, branch/commit, data/hora, usuário/role utilizado (sem segredos).

### Escopo IN/OUT

### Matriz de Testes (ACs)
| ID | Critério (Given/When/Then) | Tipo (Happy/Edge/Negativo) | Status |
|----|-----------------------------|-----------------------------|--------|

### Execução & Evidências
Para cada AC: passos, esperado, observado, prints/logs redigidos.

### Bugs encontrados
- **BUG-001** — Título curto (Sev: Alta)
  - Reproduzir: …
  - Evidências: …
  - Suspeita de causa: …
  - Sugestão: …
  - (Opcional) Patch mínimo (diff) — **não aplicar sem autorização**

### Smoke não funcional (segurança/perf/a11y)
Notas e achados relevantes.

### Recomendações & Próximos passos
Checklist do que aprovar, corrigir e revalidar.

### DoD (Definition of Done)
Todos ACs **PASS**, sem regressões, sem vazamento de segredos, sem duplicação de lógica, e evidências anexadas.
