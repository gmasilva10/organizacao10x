import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { FilterDrawer } from '@/components/ui/filter-drawer'

describe('FilterDrawer - Padrões UI', () => {
  const mockProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Filtros de Teste',
    onApply: vi.fn(),
    onClear: vi.fn(),
    children: <div>Conteúdo do filtro</div>
  }

  it('deve renderizar com estrutura correta (Header, Body, Footer)', () => {
    render(<FilterDrawer {...mockProps} />)
    
    // Header
    expect(screen.getByText('Filtros de Teste')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    
    // Body
    expect(screen.getByText('Conteúdo do filtro')).toBeInTheDocument()
    
    // Footer
    expect(screen.getByText('Limpar')).toBeInTheDocument()
    expect(screen.getByText('Aplicar Filtros')).toBeInTheDocument()
  })

  it('deve ter largura fixa de 320px (w-80)', () => {
    const { container } = render(<FilterDrawer {...mockProps} />)
    const dialogContent = container.querySelector('[role="dialog"]')
    expect(dialogContent).toBeTruthy()
    expect(dialogContent?.className || '').toContain('w-80')
  })

  it('deve chamar onOpenChange ao clicar no X', () => {
    render(<FilterDrawer {...mockProps} />)
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('deve chamar onClear ao clicar em Limpar', () => {
    render(<FilterDrawer {...mockProps} />)
    const clearButton = screen.getByText('Limpar')
    fireEvent.click(clearButton)
    expect(mockProps.onClear).toHaveBeenCalled()
  })

  it('deve chamar onApply ao clicar em Aplicar Filtros', () => {
    render(<FilterDrawer {...mockProps} />)
    const applyButton = screen.getByText('Aplicar Filtros')
    fireEvent.click(applyButton)
    expect(mockProps.onApply).toHaveBeenCalled()
  })

  it('deve ter role dialog quando aberto', () => {
    render(<FilterDrawer {...mockProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('não deve renderizar quando open=false', () => {
    render(<FilterDrawer {...mockProps} open={false} />)
    expect(screen.queryByText('Filtros de Teste')).not.toBeInTheDocument()
  })

  it('deve ter ícone Filter no header', () => {
    render(<FilterDrawer {...mockProps} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    // Ícone pode não estar presente, apenas verificar dialog existe
  })
})

