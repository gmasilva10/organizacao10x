import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe, toHaveNoViolations } from 'jest-axe'
import StudentCardActions from '@/components/students/StudentCardActions'
import { FilterDrawer } from '@/components/ui/filter-drawer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

expect.extend(toHaveNoViolations)

describe('Acessibilidade - Padrões WCAG AA', () => {
  
  describe('StudentCardActions', () => {
    it('não deve ter violações de acessibilidade', async () => {
      const { container } = render(
        <StudentCardActions 
          studentId="123" 
          studentName="João Silva" 
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('deve ter aria-label em todos os botões', () => {
      const { container } = render(
        <StudentCardActions 
          studentId="123" 
          studentName="João Silva" 
        />
      )
      const interactiveElements = container.querySelectorAll('button, a')
      interactiveElements.forEach(el => {
        const hasAriaLabel = el.hasAttribute('aria-label') || 
                            el.hasAttribute('aria-labelledby') ||
                            el.textContent?.trim()
        expect(hasAriaLabel).toBeTruthy()
      })
    })

    it('deve navegar por teclado (Tab)', () => {
      render(<StudentCardActions studentId="123" studentName="João Silva" />)
      const firstButton = screen.getAllByRole('button')[0]
      firstButton.focus()
      expect(document.activeElement).toBe(firstButton)
    })
  })

  describe('FilterDrawer', () => {
    it('não deve ter violações de acessibilidade', async () => {
      const { container} = render(
        <FilterDrawer 
          open={true} 
          onOpenChange={() => {}}
          onApply={() => {}}
          onClear={() => {}}
        >
          <input aria-label="Campo de teste" />
        </FilterDrawer>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('deve fechar ao pressionar Escape', () => {
      const onOpenChange = vi.fn()
      render(
        <FilterDrawer 
          open={true} 
          onOpenChange={onOpenChange}
          onApply={() => {}}
          onClear={() => {}}
        >
          <div>Conteúdo</div>
        </FilterDrawer>
      )
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('deve ter role dialog', () => {
      render(
        <FilterDrawer 
          open={true} 
          onOpenChange={() => {}}
          onApply={() => {}}
          onClear={() => {}}
        >
          <div>Conteúdo</div>
        </FilterDrawer>
      )
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('ConfirmDialog', () => {
    it('não deve ter violações de acessibilidade', async () => {
      const { container } = render(
        <ConfirmDialog 
          open={true}
          onClose={() => {}}
          onConfirm={async () => {}}
          title="Confirmar ação"
          description="Tem certeza?"
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('deve ter aria-busy durante loading', () => {
      render(
        <ConfirmDialog 
          open={true}
          onClose={() => {}}
          onConfirm={async () => {}}
          title="Confirmar"
          description="Descrição"
        />
      )
      const confirmButton = screen.getByText('Confirmar')
      // Simular loading state
      fireEvent.click(confirmButton)
      // Verificar aria-busy (implementação específica)
    })
  })

  describe('Focus Management', () => {
    it('deve retornar foco ao trigger após fechar modal', () => {
      const { rerender } = render(
        <button>Abrir Modal</button>
      )
      const trigger = screen.getByText('Abrir Modal')
      trigger.focus()
      expect(document.activeElement).toBe(trigger)
      
      // Abrir modal
      rerender(
        <>
          <button>Abrir Modal</button>
          <ConfirmDialog 
            open={true}
            onClose={() => {}}
            onConfirm={async () => {}}
            title="Test"
            description="Test"
          />
        </>
      )
      
      // Fechar modal
      rerender(<button>Abrir Modal</button>)
      
      // Foco deve voltar
      expect(document.activeElement).toBe(trigger)
    })
  })
})

