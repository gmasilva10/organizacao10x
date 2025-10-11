# Checklist de Code Review - FilterDrawer

## Estrutura
- [ ] Usa Dialog/Drawer do Radix UI
- [ ] Estrutura: Header + Body (scroll) + Footer (fixo)
- [ ] Largura fixa: w-80 (320px)
- [ ] Altura completa: h-full
- [ ] Slide-in da direita: fixed right-0 top-0

## Header
- [ ] Ícone Filter + título
- [ ] Botão X para fechar (variant="ghost" size="sm")
- [ ] Borda inferior: border-b

## Body
- [ ] Overflow vertical: overflow-y-auto
- [ ] Padding: p-4
- [ ] flex-1 para ocupar espaço disponível
- [ ] Campos organizados com Label + Input/Select

## Footer
- [ ] Background diferenciado: bg-gray-50
- [ ] Padding: p-4
- [ ] Borda superior: border-t
- [ ] Botões: "Limpar" (outline) + "Aplicar Filtros" (primary)
- [ ] justify-end gap-2

## Comportamento
- [ ] onOpenChange para abrir/fechar
- [ ] onApply executa filtros
- [ ] onClear limpa todos os filtros
- [ ] Fecha ao pressionar Escape
- [ ] Mantém estado dos filtros ao fechar

## Acessibilidade
- [ ] role="dialog" no container
- [ ] aria-label em inputs sem label visível
- [ ] Focus trap quando aberto
- [ ] Foco volta ao trigger ao fechar

## Performance
- [ ] Não re-renderiza desnecessariamente
- [ ] Debounce em campos de busca (300ms)
- [ ] Lazy loading se houver muitos filtros

## Testes
- [ ] Abre e fecha corretamente
- [ ] Botões funcionam
- [ ] Escape fecha o drawer
- [ ] Acessibilidade validada

