import { test, expect } from '@playwright/test'

test.describe('Relationship Calendar - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de relacionamento
    await page.goto('/app/relacionamento')
    
    // Aguardar o carregamento inicial
    await page.waitForLoadState('networkidle')
    
    // Clicar na aba Calendário
    await page.getByRole('tab', { name: 'Calendário' }).click()
    
    // Aguardar carregamento do calendário
    await page.waitForTimeout(1000)
  })

  test('deve carregar o calendário sem erros', async ({ page }) => {
    // Verificar se o calendário está presente
    await expect(page.getByRole('grid')).toBeVisible()
    
    // Verificar se os controles de navegação estão presentes
    await expect(page.getByRole('button', { name: 'Hoje' })).toBeVisible()
    
    // Verificar se os botões de visualização estão presentes
    await expect(page.getByRole('button', { name: 'Dia' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Semana' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mês' })).toBeVisible()
    
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

  test('deve navegar entre visualizações', async ({ page }) => {
    // Testar visualização por dia
    await page.getByRole('button', { name: 'Dia' }).click()
    await page.waitForTimeout(500)
    
    // Testar visualização por semana
    await page.getByRole('button', { name: 'Semana' }).click()
    await page.waitForTimeout(500)
    
    // Testar visualização por mês
    await page.getByRole('button', { name: 'Mês' }).click()
    await page.waitForTimeout(500)
    
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

  test('deve navegar entre datas', async ({ page }) => {
    // Clicar no botão de navegação anterior
    await page.getByRole('button').first().click()
    await page.waitForTimeout(500)
    
    // Clicar no botão de navegação próximo
    await page.getByRole('button').nth(2).click()
    await page.waitForTimeout(500)
    
    // Clicar no botão "Hoje"
    await page.getByRole('button', { name: 'Hoje' }).click()
    await page.waitForTimeout(500)
    
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

  test('deve exibir grid do calendário', async ({ page }) => {
    // Verificar se o grid está presente
    const grid = page.getByRole('grid')
    await expect(grid).toBeVisible()
    
    // Verificar se há células do calendário
    const cells = page.locator('[role="gridcell"]')
    const cellCount = await cells.count()
    expect(cellCount).toBeGreaterThan(0)
    
    // Verificar se os cabeçalhos dos dias estão presentes
    const dayHeaders = page.locator('text=Seg, Ter, Qua, Qui, Sex, Sáb, Dom')
    await expect(dayHeaders).toBeVisible()
  })

  test('deve atualizar calendário sem erros', async ({ page }) => {
    // Clicar no botão de atualizar
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
})
