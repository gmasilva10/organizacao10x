# Checklist de Code Review - Cards Compactos

## Estrutura e Layout
- [ ] Card usa variant="ghost" size="sm" para botões
- [ ] Botões têm tamanho fixo h-6 w-6 ou p-0
- [ ] Espaçamento entre botões: gap-1
- [ ] Borda superior no container: pt-1.5 border-t
- [ ] Icons têm tamanho h-3 w-3

## Comportamento
- [ ] Tooltip aparece no hover de cada botão
- [ ] onHover é chamado ao passar mouse sobre editar
- [ ] onActionComplete é chamado após ações bem-sucedidas
- [ ] Links de edição usam Next.js <Link>

## Acessibilidade
- [ ] Todos os botões têm aria-label descritivo
- [ ] Tooltips usam TooltipTrigger + TooltipContent
- [ ] Elementos interativos são focáveis (tabIndex)
- [ ] onFocus também dispara onHover (além de onMouseEnter)

## Performance
- [ ] Componente usa "use client" apenas se necessário
- [ ] Icons são importados de lucide-react
- [ ] Prefetch de dados no hover (quando aplicável)

## Testes
- [ ] Testes de renderização
- [ ] Testes de interação (click, hover)
- [ ] Testes de acessibilidade (jest-axe)
- [ ] Cobertura mínima 80%

