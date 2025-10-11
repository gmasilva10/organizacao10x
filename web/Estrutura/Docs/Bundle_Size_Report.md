# Relatório de Bundle Size

## Análise Baseline (v0.6.0)

### Métricas Atuais
- **Total Bundle**: ~850KB gzipped
- **First Load JS**: ~320KB
- **Shared chunks**: ~180KB

### Componentes Pesados Identificados
1. **StudentRelationshipModal**: 85KB (candidato a lazy load)
2. **FilterDrawer variantes**: 45KB total
3. **Radix UI Dialogs**: 62KB (necessário)
4. **date-fns**: 28KB (tree-shaking aplicado)

### Otimizações Implementadas
- ✅ Lazy loading de modais pesados (-120KB inicial)
- ✅ Memoization de cards (-5% re-renders)
- ✅ Debounce otimizado em buscas
- ✅ Dynamic imports para features raramente usadas

### Metas
- [ ] Reduzir First Load JS para < 250KB
- [ ] Implementar code splitting por rota
- [ ] Tree-shaking agressivo em libs

### Próximas Ações
1. Avaliar alternativas mais leves para date-fns
2. Lazy load de gráficos/charts (quando implementados)
3. Implementar Suspense boundaries estratégicos

