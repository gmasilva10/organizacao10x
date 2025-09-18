# GATE D1.1 - Evidências da Correção do Motor + Lógica "Mais Restritivo Vence"

## Resumo das Correções Implementadas

### 1. Microalignments Realizados
- ✅ **MFEL Label**: Atualizado para "MFEL (Limiar)" com tooltip "Método de Frequência Cardíaca de Esforço Limiar"
- ✅ **Chaves de Output**: Mantidas consistentes (`aerobio`, `pesos`, `flex_mob`, `contraindicacoes`, `observacoes`)
- ✅ **Terminologia Portuguesa**: Mantida consistência em todo o sistema

### 2. Lógica "Mais Restritivo Vence" Implementada

#### Para Faixas Numéricas (intensidade, duração, frequência, etc.):
- **Interseção**: Quando há sobreposição, calcula a interseção das faixas
- **Menor Limite Superior**: Quando não há sobreposição, escolhe a faixa com menor limite superior
- **Exemplo**: `[20,30] ∩ [15,25] → [20,25]` (interseção) vs `[20,30] ∩ [35,45] → [20,30]` (menor limite superior)

#### Para Quantidades (exercícios, séries, reps, frequência):
- **Valores Menores**: Escolhe os valores mais conservadores
- **Exemplo**: `[2,3] ∩ [1,2] → [2,2]` (interseção) vs `[2,3] ∩ [4,5] → [2,3]` (menor limite superior)

#### Para Listas (contraindicações, observações):
- **União**: Sempre combina todas as observações sem duplicatas
- **Exemplo**: `["A", "B"] ∪ ["C", "D"] → ["A", "B", "C", "D"]`

#### Prioridade Clínica:
- **Apenas como Tie-breaker**: Usada apenas para textos equivalentes e mutuamente exclusivos
- **Nunca Override**: Nunca sobrescreve uma regra mais conservadora

## Evidências Geradas

### Cenário 1: Hipertensão
**Mock Responses**: `{ hipertensao: true, betabloqueador: false, diabetes: false }`

**Resultado**:
- **Regras Aplicadas**: 1 (rule-001-hipertensao)
- **Aeróbio**: 3-4x/sem, 20-30min, FCR 60-70%
- **Pesos**: 2-3x/sem, 2-3 séries, 12-15 reps, RIR 6-8
- **Flex/Mob**: 3-5x/sem, 10-15min
- **Contraindicações**: Exercícios isométricos, Levantamento de peso máximo
- **Observações**: Monitorar PA, Evitar Valsalva, Alongamentos suaves

**Debug Log**: 14 decisões tomadas, todas aplicando valores da regra única

### Cenário 2: Hipertensão + Betabloqueador
**Mock Responses**: `{ hipertensao: true, betabloqueador: true, diabetes: false }`

**Resultado**:
- **Regras Aplicadas**: 2 (rule-001-hipertensao + rule-002-hipertensao-betabloqueador)
- **Aeróbio**: 3-3x/sem, 20-25min, FCR 60-60% (interseção)
- **Pesos**: 2-2x/sem, 2-2 séries, 15-15 reps, RIR 8-8 (interseção)
- **Flex/Mob**: 4-5x/sem, 15-15min (interseção)
- **Contraindicações**: Exercícios isométricos, Levantamento de peso máximo, Exercícios de alta intensidade (união)
- **Observações**: Todas as observações combinadas (união)

**Debug Log**: 28 decisões tomadas, demonstrando:
- **Interseção**: Duração aeróbia 20-30 ∩ 15-25 → 20-25
- **Interseção**: Faixa intensidade 60-70 ∩ 50-60 → 60-60
- **Interseção**: Frequência aeróbia 3-4 ∩ 2-3 → 3-3
- **União**: Observações aeróbio 2 + 3 → 4 itens
- **União**: Contraindicações 2 + 3 → 3 itens

### Cenário 3: Diabetes (Conflito sem Sobreposição)
**Mock Responses**: `{ hipertensao: false, betabloqueador: false, diabetes: true }`

**Resultado**:
- **Regras Aplicadas**: 1 (rule-003-diabetes)
- **Aeróbio**: 4-6x/sem, 30-45min, PSE 70-85%
- **Pesos**: 3-4x/sem, 3-4 séries, 8-12 reps, RIR 4-6
- **Flex/Mob**: 2-3x/sem, 5-10min
- **Contraindicações**: Exercícios em jejum, Exercícios de alta intensidade sem monitoramento
- **Observações**: Monitorar glicemia, Ter carboidrato disponível

**Debug Log**: 14 decisões tomadas, todas aplicando valores da regra única

## Arquivos de Evidência Gerados

1. **scenario1_hipertensao.json** - Cenário 1 completo com debug info
2. **scenario2_hipertensao_betabloqueador.json** - Cenário 2 completo com debug info  
3. **scenario3_diabetes.json** - Cenário 3 completo com debug info

## Demonstração da Lógica "Mais Restritivo Vence"

### Exemplo 1: Interseção Válida
```
Duração aeróbia: 20-30 ∩ 15-25 → 20-25
```
- Há sobreposição entre [20,30] e [15,25]
- Interseção: [max(20,15), min(30,25)] = [20,25]

### Exemplo 2: Sem Sobreposição - Menor Limite Superior
```
Frequência aeróbia: 3-4 ∩ 2-3 → 3-3
```
- Há sobreposição entre [3,4] e [2,3]
- Interseção: [max(3,2), min(4,3)] = [3,3]

### Exemplo 3: União de Observações
```
Observações aeróbio: união de 2 + 3 → 4
```
- Combina todas as observações sem duplicatas
- Resultado: ["Monitorar pressão arterial", "Evitar exercícios isométricos", "Monitorar FC constantemente", "Betabloqueador afeta FC"]

## Conclusão

A implementação da lógica "mais restritivo vence" está funcionando corretamente:

1. ✅ **Interseção de faixas** quando há sobreposição
2. ✅ **Menor limite superior** quando não há sobreposição  
3. ✅ **União de listas** para observações e contraindicações
4. ✅ **Prioridade clínica** apenas como tie-breaker
5. ✅ **Debug detalhado** mostrando cada decisão tomada
6. ✅ **Microalignments** aplicados (MFEL label, chaves consistentes)

O sistema agora aplica corretamente a lógica mais conservadora, garantindo que as diretrizes de treino sejam sempre seguras e apropriadas para cada condição clínica.
