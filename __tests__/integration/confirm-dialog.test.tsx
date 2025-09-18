import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { toast } from 'sonner'

// Mock do toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock do next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

// Mock do event bus
const mockEventBus = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
}

vi.mock('@/lib/event-bus', () => ({
  eventBus: mockEventBus,
}))

describe('ConfirmDialog Integration', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirmar exclusão',
    description: 'Tem certeza que deseja excluir este item?',
    confirmText: 'Excluir',
    cancelText: 'Cancelar',
    variant: 'destructive' as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderização e Interação Básica', () => {
    it('deve renderizar o diálogo com todas as props corretas', () => {
      render(<ConfirmDialog {...defaultProps} />)

      expect(screen.getByText('Confirmar exclusão')).toBeInTheDocument()
      expect(screen.getByText('Tem certeza que deseja excluir este item?')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    })

    it('deve fechar o diálogo ao clicar em cancelar', () => {
      render(<ConfirmDialog {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
      fireEvent.click(cancelButton)

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('deve fechar o diálogo ao pressionar Escape', () => {
      render(<ConfirmDialog {...defaultProps} />)

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Fluxo de Confirmação', () => {
    it('deve chamar onConfirm ao clicar em confirmar', async () => {
      render(<ConfirmDialog {...defaultProps} />)

      const confirmButton = screen.getByRole('button', { name: 'Excluir' })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
      })
    })

    it('deve fechar o diálogo após confirmação bem-sucedida', async () => {
      render(<ConfirmDialog {...defaultProps} />)

      const confirmButton = screen.getByRole('button', { name: 'Excluir' })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Estados e Variantes', () => {
    it('deve aplicar variante destructive corretamente', () => {
      render(<ConfirmDialog {...defaultProps} variant="destructive" />)

      const confirmButton = screen.getByRole('button', { name: 'Excluir' })
      expect(confirmButton).toHaveClass('bg-destructive')
    })

    it('deve aplicar variante default corretamente', () => {
      render(<ConfirmDialog {...defaultProps} variant="default" />)

      const confirmButton = screen.getByRole('button', { name: 'Excluir' })
      expect(confirmButton).toHaveClass('bg-primary')
    })
  })

  describe('Acessibilidade', () => {
    it('deve ter role dialog', () => {
      render(<ConfirmDialog {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })
  })

  describe('Tratamento de Erros', () => {
    it('deve mostrar toast de erro se onConfirm falhar', async () => {
      const errorConfirm = vi.fn().mockRejectedValue(new Error('Erro na operação'))
      
      render(<ConfirmDialog {...defaultProps} onConfirm={errorConfirm} />)

      const confirmButton = screen.getByRole('button', { name: 'Excluir' })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(errorConfirm).toHaveBeenCalledTimes(1)
        expect(toast.error).toHaveBeenCalledWith('Erro ao executar operação')
      })
    })
  })

  describe('Props Opcionais', () => {
    it('deve usar valores padrão para props opcionais', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          title="Título"
        />
      )

      expect(screen.getByText('Título')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    })
  })
})
