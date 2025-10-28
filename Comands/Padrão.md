# Política de Reuso (DRY-first)
Antes de propor código novo:
1) Faça um scan do workspace e liste funções/hooks/constantes/tipos já existentes que resolvem o caso.
2) Priorize **importar e reutilizar** o que já existe. É proibido duplicar lógica.
3) Se não houver algo reaproveitável, justifique em 1–2 linhas por que não serve e proponha **extração** para um módulo compartilhado (ex.: `domain/categorias.ts`) em vez de copiar/colar.

# Regras de Patch
- Patch **mínimo** e **local** (≤ 3 arquivos), a menos que seja uma extração para reuso.
- Mostre sempre os **imports** com caminhos corretos do módulo canônico.
- Se o patch criar uma função parecida com uma existente, **pare** e proponha: (a) importar a existente; ou (b) extrair genéricos e reutilizar ambas.
- Nunca redefina constantes/enums já existentes (ex.: `CATEGORIAS`). Importe da fonte única.
- Se precisar renomear/mover algo para virar canônico, inclua remoção das duplicatas no mesmo patch.

# Formato de Saída (obrigatório)
### Causa raiz
### Referências reutilizadas
- Arquivo: `path/para/modulo.ts` — Símbolo: `minhaFuncao`
- Arquivo: `path/para/categorias.ts` — Símbolo: `CATEGORIAS`
*(Se nenhuma for adequada, justificar aqui em 1–2 linhas.)*

### Patch (diff)
### Validação (passos e testes)
### Observabilidade
### Riscos/Rollback
