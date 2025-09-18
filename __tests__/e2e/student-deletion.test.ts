import { test, expect } from '@playwright/test'
import { MOCK_STUDENTS } from '../__mocks__/data/students'

test.describe('Student Deletion Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock da API de estudantes
    await page.route('**/api/students', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_STUDENTS),
        })
      }
    })

    // Mock da API de exclusão de estudante
    await page.route('**/api/students/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      }
    })

    // Navegar para a página de estudantes
    await page.goto('/dashboard/students')
    await page.waitForLoadState('networkidle')
  })

  test('deve exibir o diálogo de confirmação ao clicar em excluir', async ({ page }) => {
    // Encontrar o primeiro botão de exclusão
    const deleteButton = page.getByRole('button', { name: /excluir/i }).first()
    await expect(deleteButton).toBeVisible()

    // Clicar no botão de exclusão
    await deleteButton.click()

    // Verificar se o diálogo foi aberto
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Verificar conteúdo do diálogo
    await expect(page.getByText('Confirmar exclusão')).toBeVisible()
    await expect(page.getByText(/tem certeza que deseja excluir/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Excluir' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible()
  })

  test('deve fechar o diálogo ao clicar em cancelar', async ({ page }) => {
    // Abrir o diálogo de exclusão
    const deleteButton = page.getByRole('button', { name: /excluir/i }).first()
    await deleteButton.click()

    // Verificar se o diálogo está aberto
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Clicar em cancelar
    const cancelButton = page.getByRole('button', { name: 'Cancelar' })
    await cancelButton.click()

    // Verificar se o diálogo foi fechado
    await expect(dialog).not.toBeVisible()
  })

  test('deve fechar o diálogo ao pressionar Escape', async ({ page }) => {
    // Abrir o diálogo de exclusão
    const deleteButton = page.getByRole('button', { name: /excluir/i }).first()
    await deleteButton.click()

    // Verificar se o diálogo está aberto
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Pressionar Escape
    await page.keyboard.press('Escape')

    // Verificar se o diálogo foi fechado
    await expect(dialog).not.toBeVisible()
  })

  test('deve excluir o estudante e atualizar a lista', async ({ page }) => {
    // Contar estudantes iniciais
    const initialStudents = await page.getByRole('row').count()

    // Abrir o diálogo de exclusão
    const deleteButton = page.getByRole('button', { name: /excluir/i }).first()
    await deleteButton.click()

    // Confirmar exclusão
    const confirmButton = page.getByRole('button', { name: 'Excluir' })
    await confirmButton.click()

    // Verificar se o diálogo foi fechado
    const dialog = page.getByRole('dialog')
    await expect(dialog).not.toBeVisible()

    // Verificar se a lista foi atualizada (simulação)
    // Em um cenário real, você verificaria se o estudante foi removido da lista
    await expect(page.getByText(/sucesso/i)).toBeVisible({ timeout: 5000 })
  })

  test('deve mostrar estado de loading durante a exclusão', async ({ page }) => {
    // Mock com delay para simular loading
    await page.route('**/api/students/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        // Delay de 1 segundo para ver o loading
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      }
    })

    // Abrir o diálogo de exclusão
    const deleteButton = page.getByRole('button', { name: /excluir/i }).first()
    await deleteButton.click()

    // Confirmar exclusão
    const confirmButton = page.getByRole('button', { name: 'Excluir' })
    await confirmButton.click()

    // Verificar estado de loading
    await expect(page.getByText('Confirmando...')).toBeVisible()
    await expect(confirmButton).toBeDisabled()

    // Aguardar conclusão
    await expect(page.getByText('Confirmando...')).not.toBeVisible({ timeout: 3000 })
  })

  test('deve exibir erro quando a exclusão falhar', async ({ page }) => {
    // Mock com erro
    await page.route('**/api/students/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Erro interno do servidor' }),
        })
      }
    })

    // Abrir o diálogo de exclusão
    const deleteButton = page.getByRole('button', { name: /excluir/i }).first()
    await deleteButton.click()

    // Confirmar exclusão
    const confirmButton = page.getByRole('button', { name: 'Excluir' })
    await confirmButton.click()

    // Verificar se o erro foi exibido
    await expect(page.getByText(/erro/i)).toBeVisible({ timeout: 5000 })

    // Verificar se o diálogo permanece aberto
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
  })

  test('deve manter foco no diálogo durante navegação por tab', async ({ page }) => {
    // Abrir o diálogo de exclusão
    const deleteButton = page.getByRole('button', { name: /excluir/i }).first()
    await deleteButton.click()

    // Verificar se o diálogo está aberto
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Verificar foco inicial
    const confirmButton = page.getByRole('button', { name: 'Excluir' })
    await expect(confirmButton).toBeFocused()

    // Navegar com Tab
    await page.keyboard.press('Tab')
    const cancelButton = page.getByRole('button', { name: 'Cancelar' })
    await expect(cancelButton).toBeFocused()

    // Tab novamente deve voltar para o botão de confirmar (trap de foco)
    await page.keyboard.press('Tab')
    await expect(confirmButton).toBeFocused()
  })

  test('deve ter atributos de acessibilidade corretos', async ({ page }) => {
    // Abrir o diálogo de exclusão
    const deleteButton = page.getByRole('button', { name: /excluir/i }).first()
    await deleteButton.click()

    // Verificar role dialog
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Verificar aria-labelledby
    const title = page.getByText('Confirmar exclusão')
    const titleId = await title.getAttribute('id')
    await expect(dialog).toHaveAttribute('aria-labelledby', titleId || '')

    // Verificar aria-describedby
    const description = page.getByText(/tem certeza que deseja excluir/i)
    const descriptionId = await description.getAttribute('id')
    await expect(dialog).toHaveAttribute('aria-describedby', descriptionId || '')
  })

  test('deve aplicar estilos de variante destructive corretamente', async ({ page }) => {
    // Abrir o diálogo de exclusão
    const deleteButton = page.getByRole('button', { name: /excluir/i }).first()
    await deleteButton.click()

    // Verificar se o botão de confirmar tem a classe destructive
    const confirmButton = page.getByRole('button', { name: 'Excluir' })
    await expect(confirmButton).toHaveClass(/bg-destructive/)
  })

  test('deve atualizar o Kanban quando um estudante for excluído', async ({ page }) => {
    // Navegar para a visualização Kanban
    await page.goto('/dashboard/students?view=kanban')
    await page.waitForLoadState('networkidle')

    // Contar cards iniciais
    const initialCards = await page.getByTestId('student-card').count()

    // Abrir o diálogo de exclusão do primeiro card
    const deleteButton = page.getByRole('button', { name: /excluir/i }).first()
    await deleteButton.click()

    // Confirmar exclusão
    const confirmButton = page.getByRole('button', { name: 'Excluir' })
    await confirmButton.click()

    // Verificar se o card foi removido
    await expect(page.getByTestId('student-card')).toHaveCount(initialCards - 1)
  })
})
