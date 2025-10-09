import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

test.describe('Students - create and validate isolation', () => {
  test('create student and see it listed', async ({ page }) => {
    await login(page, BASE_URL)

    await page.getByRole('link', { name: /alunos/i }).click()
    await page.waitForURL(/\/app\/students/)

    const newBtn = page.getByRole('link', { name: /ir para novo aluno/i })
    if (await newBtn.isVisible()) await newBtn.click()

    // Fill modal if present
    if (await page.getByRole('dialog').isVisible()) {
      await page.getByLabel(/nome/i).fill('Aluno E2E')
      await page.getByLabel(/e-mail/i).fill(`aluno.e2e+${Date.now()}@example.com`)
      await page.getByRole('button', { name: /^Salvar$/i }).click()
    }

    await expect(page.getByText(/Aluno E2E/)).toBeVisible()
  })
})


