import { test, expect } from '@playwright/test'

test.describe('Relationship Kanban - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de relacionamento
    await page.goto('/app/relacionamento')
    
    // Aguardar o carregamento inicial
    await page.waitForLoadState('networkidle')
  })

  test('deve carregar o kanban sem erros', async ({ page }) => {
    // Verificar se o título está presente
    await expect(page.getByRole('heading', { name: 'Relacionamento' })).toBeVisible()
    
    // Verificar se as colunas estão presentes
    await expect(page.getByText('Atrasadas')).toBeVisible()
    await expect(page.getByText('Para Hoje')).toBeVisible()
    await expect(page.getByText('Pendentes de Envio')).toBeVisible()
    await expect(page.getByText('Enviadas')).toBeVisible()
    await expect(page.getByText('Adiadas/Puladas')).toBeVisible()
    
    // Verificar se não há erros no console
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Aguardar um pouco para capturar erros
    await page.waitForTimeout(2000)
    
    // Filtrar apenas erros relacionados ao TypeError
    const typeErrors = consoleErrors.filter(error => 
      error.includes('Cannot read properties of undefined') || 
      error.includes('toString')
    )
    
    expect(typeErrors).toHaveLength(0)
  })

  test('deve abrir modal de criação de mensagem', async ({ page }) => {
    // Clicar no botão "Nova Mensagem"
    await page.getByRole('button', { name: 'Nova Mensagem' }).click()
    
    // Verificar se o modal abriu
    await expect(page.getByRole('dialog', { name: 'Criar Tarefa' })).toBeVisible()
    
    // Verificar campos obrigatórios
    await expect(page.getByText('Aluno *')).toBeVisible()
    await expect(page.getByText('Canal *')).toBeVisible()
    await expect(page.getByText('Texto *')).toBeVisible()
  })

  test('deve aplicar filtros sem erros', async ({ page }) => {
    // Clicar no botão "Hoje"
    await page.getByRole('button', { name: 'Hoje' }).click()
    
    // Aguardar carregamento
    await page.waitForTimeout(1000)
    
    // Verificar se não há erros no console
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.waitForTimeout(2000)
    
    const typeErrors = consoleErrors.filter(error => 
      error.includes('Cannot read properties of undefined') || 
      error.includes('toString')
    )
    
    expect(typeErrors).toHaveLength(0)
  })

  test('deve atualizar tarefas sem erros', async ({ page }) => {
    // Clicar no botão "Atualizar"
    await page.getByRole('button', { name: 'Atualizar' }).click()
    
    // Aguardar carregamento
    await page.waitForTimeout(2000)
    
    // Verificar se não há erros no console
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.waitForTimeout(2000)
    
    const typeErrors = consoleErrors.filter(error => 
      error.includes('Cannot read properties of undefined') || 
      error.includes('toString')
    )
    
    expect(typeErrors).toHaveLength(0)
  })

  test('deve exibir contadores de tarefas', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForTimeout(2000)
    
    // Verificar se os contadores estão presentes (podem ser 0)
    const counters = page.locator('[data-testid="task-count"]')
    const count = await counters.count()
    
    // Deve ter pelo menos as colunas principais
    expect(count).toBeGreaterThanOrEqual(5)
  })
})
