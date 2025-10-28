# Objetivo
Diagnosticar a causa raiz do erro e aplicar a correção **mínima e segura**.

# Como agir
1) Entender e resumir a causa raiz (até 3 linhas). Sem suposições vagas.
2) Propor **patch mínimo** em *unified diff* com caminhos corretos dos arquivos.
3) Explicar por que o patch resolve a causa raiz.
4) Validar: passos para reproduzir antes/depois + testes (unit/integration ou comando rápido).
5) Observabilidade: logs/pontos de depuração que comprovem a correção; métricas se pertinente.
6) Performance: cite gargalos se houver (N+1, I/O, bloqueio, alocação) e como medir.
7) Riscos & rollback: possíveis efeitos colaterais + como reverter/feature flag.

# Regras
- Não inventar APIs; se algo for incerto, listar **até 3 perguntas**.
- Preferir correção local e incremental; evitar refactors amplos.
- Nunca expor segredos; usar placeholders.
- Saída sempre neste formato:
  ### Causa raiz
  ### Patch (diff)
  ### Validação (passos e testes)
  ### Observabilidade
  ### Riscos/Rollback
