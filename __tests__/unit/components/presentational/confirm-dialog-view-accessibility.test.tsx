import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { ConfirmDialogView } from '@/components/presentational/confirm-dialog-view'

describe('ConfirmDialogView Accessibility', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirmar exclusão',
    description: 'Tem certeza que deseja excluir este item?',
    confirmText: 'Excluir',
    cancelText: 'Cancelar',
    variant: 'destructive' as const,
    isLoading: false,
  }

  describe('Verificações de Acessibilidade com axe-core', () => {
    it('deve não ter violações de acessibilidade', async () => {
      const { container } = render(<ConfirmDialogView {...defaultProps} />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('deve não ter violações de acessibilidade no estado de loading', async () => {
      const { container } = render(
        <ConfirmDialogView {...defaultProps} isLoading={true} />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('deve não ter violações de acessibilidade com variante default', async () => {
      const { container } = render(
        <ConfirmDialogView {...defaultProps} variant="default" />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('deve não ter violações de acessibilidade com variante outline', async () => {
      const { container } = render(
        <ConfirmDialogView {...defaultProps} variant="outline" />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('deve não ter violações de acessibilidade com variante secondary', async () => {
      const { container } = render(
        <ConfirmDialogView {...defaultProps} variant="secondary" />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('deve não ter violações de acessibilidade com variante ghost', async () => {
      const { container } = render(
        <ConfirmDialogView {...defaultProps} variant="ghost" />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('deve não ter violações de acessibilidade com variante link', async () => {
      const { container } = render(
        <ConfirmDialogView {...defaultProps} variant="link" />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('deve não ter violações de acessibilidade sem descrição', async () => {
      const { container } = render(
        <ConfirmDialogView {...defaultProps} description={undefined} />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('deve não ter violações de acessibilidade com textos customizados', async () => {
      const { container } = render(
        <ConfirmDialogView 
          {...defaultProps} 
          title="Título Personalizado"
          description="Descrição personalizada com texto mais longo para testar acessibilidade"
          confirmText="Sim, confirmar"
          cancelText="Não, cancelar"
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('deve não ter violações de acessibilidade quando fechado', async () => {
      const { container } = render(
        <ConfirmDialogView {...defaultProps} isOpen={false} />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Verificações Específicas de Acessibilidade', () => {
    it('deve ter cor de contraste adequada para texto do título', async () => {
      const { container } = render(<ConfirmDialogView {...defaultProps} />)
      
      // axe-core verifica automaticamente o contraste de cores
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      })
      expect(results).toHaveNoViolations()
    })

    it('deve ter cor de contraste adequada para botões', async () => {
      const { container } = render(<ConfirmDialogView {...defaultProps} />)
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true }
        }
      })
      expect(results).toHaveNoViolations()
    })

    it('deve ter elementos focáveis acessíveis via teclado', async () => {
      const { container } = render(<ConfirmDialogView {...defaultProps} />)
      
      const results = await axe(container, {
        rules: {
          'focus-order-semantics': { enabled: true },
          'focusable-content': { enabled: true }
        }
      })
      expect(results).toHaveNoViolations()
    })

    it('deve ter estrutura ARIA correta', async () => {
      const { container } = render(<ConfirmDialogView {...defaultProps} />)
      
      const results = await axe(container, {
        rules: {
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'aria-allowed-attr': { enabled: true },
          'aria-required-attr': { enabled: true }
        }
      })
      expect(results).toHaveNoViolations()
    })

    it('deve ter labels e roles adequados', async () => {
      const { container } = render(<ConfirmDialogView {...defaultProps} />)
      
      const results = await axe(container, {
        rules: {
          'label': { enabled: true },
          'label-title-only': { enabled: true },
          'button-name': { enabled: true }
        }
      })
      expect(results).toHaveNoViolations()
    })
  })
})
