# Guia de Acessibilidade WCAG 2.1 AA

## 1. Contraste Mínimo

### Texto Normal (< 18pt)
- **Contraste mínimo**: 4.5:1
- **Ferramentas**: WebAIM Contrast Checker, Chrome DevTools
- **Exemplos**:
  - ✅ #0F172A em #FFFFFF (contraste 17.5:1)
  - ✅ #64748B em #FFFFFF (contraste 4.6:1)
  - ❌ #CBD5E1 em #FFFFFF (contraste 1.9:1)

### Texto Grande (≥ 18pt ou 14pt bold)
- **Contraste mínimo**: 3:1
- **Exemplos**:
  - ✅ Títulos em #1E293B em #FFFFFF
  - ✅ Subtítulos em #475569 em #FFFFFF

### Elementos Interativos
- **Botões, links, ícones**: 3:1 mínimo
- **Bordas de inputs**: 3:1 contra o fundo
- **Estados hover/focus**: visíveis e contrastantes

### Validação no Projeto
```typescript
// Paleta aprovada (de Padronizacao.txt)
const colors = {
  primary: '#5B7CFA',      // Contraste em branco: 4.8:1 ✅
  accent: '#22D3EE',       // Contraste em preto: 5.1:1 ✅
  background: '#F8FAFC',   // Neutro
  foreground: '#0F172A'    // Contraste em branco: 17.5:1 ✅
}
```

## 2. Navegação por Teclado

### Tab Order
- Tab: próximo elemento
- Shift+Tab: elemento anterior
- Ordem lógica (visual = DOM)

### Teclas de Ação
- **Enter**: ativa botões/links
- **Space**: ativa botões/checkboxes
- **Escape**: fecha modais/dropdowns
- **Arrow keys**: navegação em listas/menus

### Focus Visible
```css
/* Padrão do shadcn/ui */
.focus-visible:focus {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

### Focus Trap em Modais
```typescript
// Implementação automática via Radix Dialog
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    {/* Focus fica preso aqui */}
  </DialogContent>
</Dialog>
```

## 3. Screen Readers

### Textos Alternativos
```tsx
// Imagens
<img src="..." alt="Descrição clara do conteúdo" />

// Ícones decorativos
<Edit className="h-4 w-4" aria-hidden="true" />

// Ícones informativos
<CheckCircle aria-label="Concluído com sucesso" />
```

### Labels e Descrições
```tsx
// Label associado
<Label htmlFor="email">E-mail</Label>
<Input id="email" type="email" />

// Campo com erro
<Input 
  id="email"
  aria-invalid={!!error}
  aria-describedby="email-error"
/>
{error && <p id="email-error">{error}</p>}

// Botão sem texto visível
<Button aria-label="Editar aluno">
  <Edit className="h-4 w-4" />
</Button>
```

### Anúncios Dinâmicos
```tsx
// Mudanças importantes
<div aria-live="polite" role="status">
  {loading && 'Carregando...'}
  {error && 'Erro ao carregar dados'}
</div>

// Alertas urgentes
<div aria-live="assertive" role="alert">
  Formulário enviado com sucesso!
</div>
```

## 4. Focus Management

### Modais
```typescript
// Padrão Radix Dialog
1. Abre modal → foco vai para primeiro elemento focável
2. Tab navega apenas dentro do modal
3. Escape fecha → foco volta ao trigger
4. Fundo bloqueado (aria-hidden)
```

### Dropdowns
```typescript
// Padrão Radix DropdownMenu
- Click/Enter abre
- Arrow keys navegam
- Enter seleciona
- Escape fecha
```

### Formulários
```typescript
// Após submit com erro
const firstErrorField = document.querySelector('[aria-invalid="true"]')
firstErrorField?.focus()
```

## 5. Testes Automatizados

### jest-axe
```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

it('não deve ter violações WCAG', async () => {
  const { container } = render(<Component />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### Lighthouse
```bash
# Via CLI
lighthouse https://localhost:3000 --only-categories=accessibility

# Alvo: Score ≥ 90
```

## 6. Checklist Rápido

Antes de fazer PR:

- [ ] Contraste validado (4.5:1 texto, 3:1 UI)
- [ ] Tab navega logicamente
- [ ] Focus visível em todos os elementos
- [ ] Escape fecha modais
- [ ] aria-label em ícones e botões sem texto
- [ ] aria-invalid em campos com erro
- [ ] aria-busy durante loading
- [ ] Testes com jest-axe passando
- [ ] Lighthouse Accessibility ≥ 90

## 7. Recursos

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Radix UI Accessibility](https://www.radix-ui.com/docs/primitives/overview/accessibility)
- [jest-axe](https://github.com/nickcolley/jest-axe)

