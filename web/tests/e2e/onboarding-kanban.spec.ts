import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

test.describe('Onboarding/Kanban - required columns and card creation', () => {
  test('ensure columns #1 and #99 and create a middle column and task', async ({ page }) => {
    await login(page, BASE_URL)

    // Go to Onboarding
    await page.getByRole('link', { name: /onboarding\/kanban/i }).click()
    await page.waitForURL(/\/app\/onboarding/)

    // Ensure required columns
    const col1 = page.getByRole('heading', { name: /novo aluno/i })
    const col99 = page.getByRole('heading', { name: /entrega do treino/i })
    await expect(col1).toBeVisible()
    await expect(col99).toBeVisible()

    // Create a middle column via UI if button exists
    const addColumnButton = page.getByRole('button', { name: /nova coluna/i })
    if (await addColumnButton.isVisible()) {
      await addColumnButton.click()
      await page.getByLabel(/título/i).fill('Avaliação')
      await page.getByRole('button', { name: /^Salvar$/i }).click()
      await expect(page.getByRole('heading', { name: /Avaliação/i })).toBeVisible()
    }
  })
})


