# Checklist de Code Review - Acessibilidade WCAG AA

## ARIA Attributes
- [ ] aria-label em botões sem texto visível
- [ ] aria-labelledby em seções com títulos
- [ ] aria-describedby em campos com erro
- [ ] aria-invalid em inputs com erro
- [ ] aria-busy durante operações assíncronas
- [ ] aria-live para anúncios dinâmicos
- [ ] role apropriado (dialog, button, alert, etc)

## Navegação por Teclado
- [ ] Tab navega entre elementos focáveis
- [ ] Shift+Tab navega para trás
- [ ] Enter ativa botões e links
- [ ] Escape fecha modais
- [ ] Setas navegam em listas (quando aplicável)
- [ ] Focus visível em todos os elementos

## Screen Readers
- [ ] Textos alternativos em imagens
- [ ] Labels associados a inputs (htmlFor/id)
- [ ] Mensagens de erro anunciadas
- [ ] Estados de loading anunciados
- [ ] Tooltips acessíveis via teclado

## Contraste de Cores
- [ ] Texto normal: 4.5:1 mínimo
- [ ] Texto grande (18pt+): 3:1 mínimo
- [ ] Elementos interativos: 3:1 mínimo
- [ ] Estados (hover, focus): contraste visível

## Focus Management
- [ ] Focus trap em modais
- [ ] Foco volta ao trigger após fechar
- [ ] Primeiro elemento focável recebe foco ao abrir
- [ ] Ordem de tab lógica

## Validação Automática
- [ ] Testes com jest-axe
- [ ] Lighthouse Accessibility Score > 90
- [ ] Sem violações críticas

## Semântica HTML
- [ ] Headings hierárquicos (h1, h2, h3...)
- [ ] Buttons para ações, links para navegação
- [ ] Forms com fieldset/legend quando aplicável
- [ ] Listas usam ul/ol/li

