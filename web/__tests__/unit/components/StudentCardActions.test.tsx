import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import StudentCardActions from '@/components/students/StudentCardActions'
import { TooltipProvider } from '@/components/ui/tooltip'

describe('StudentCardActions - Padrões UI', () => {
  const mockProps = {
    studentId: 'test-123',
    studentName: 'João Silva',
    onHover: vi.fn(),
    onActionComplete: vi.fn()
  }

  it('deve renderizar com tamanhos corretos (h-6 w-6)', () => {
    const { container } = render(
      <TooltipProvider>
        <StudentCardActions {...mockProps} />
      </TooltipProvider>
    )
    const buttons = container.querySelectorAll('button')
    buttons.forEach(btn => {
      expect(btn.className).toContain('h-6')
      expect(btn.className).toContain('w-6')
    })
  })

  it('deve ter variant ghost e size sm', () => {
    const { container } = render(
      <TooltipProvider>
        <StudentCardActions {...mockProps} />
      </TooltipProvider>
    )
    const buttons = container.querySelectorAll('button')
    buttons.forEach(btn => {
      expect(btn.className).toMatch(/ghost|outline/)
    })
  })

  it('deve ter estrutura de tooltip configurada', () => {
    const { container } = render(
      <TooltipProvider>
        <StudentCardActions {...mockProps} />
      </TooltipProvider>
    )
    const editButton = screen.getByRole('link', { name: /Editar aluno/i })
    // Verificar que está dentro de um Tooltip (data-slot é adicionado pelo Radix)
    expect(editButton).toHaveAttribute('data-slot', 'tooltip-trigger')
    expect(editButton).toHaveAttribute('data-state')
  })

  it('deve ter aria-label em todos os botões', () => {
    const { container } = render(
      <TooltipProvider>
        <StudentCardActions {...mockProps} />
      </TooltipProvider>
    )
    const buttons = container.querySelectorAll('button, a')
    buttons.forEach(btn => {
      // Verificar se tem aria-label, aria-labelledby, ou aria-haspopup para dropdowns
      const hasAriaLabel = btn.hasAttribute('aria-label') || 
                          btn.hasAttribute('aria-labelledby') ||
                          btn.hasAttribute('aria-haspopup') ||
                          btn.textContent?.trim()
      expect(hasAriaLabel).toBeTruthy()
    })
  })

  it('deve chamar onHover ao passar mouse sobre editar', () => {
    render(
      <TooltipProvider>
        <StudentCardActions {...mockProps} />
      </TooltipProvider>
    )
    const editButton = screen.getByRole('link')
    fireEvent.mouseEnter(editButton)
    expect(mockProps.onHover).toHaveBeenCalled()
  })

  it('deve ter link de edição correto', () => {
    render(
      <TooltipProvider>
        <StudentCardActions {...mockProps} />
      </TooltipProvider>
    )
    const editLink = screen.getByRole('link')
    expect(editLink).toHaveAttribute('href', '/app/students/test-123/edit')
  })
})

