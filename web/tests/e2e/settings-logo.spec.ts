import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

test.describe('Settings - Organization Logo', () => {
  test('upload logo and see it in header', async ({ page }) => {
    await login(page, BASE_URL)

    // Go to settings
    await page.getByRole('link', { name: /configurações/i }).first().click()
    await page.waitForURL(/\/app\/settings/)

    // Open Organization card if necessary
    const orgButton = page.getByRole('button', { name: /Organização .* Dados da empresa/i })
    if (await orgButton.isVisible()) await orgButton.click()

    // Select file
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /Selecionar Arquivo/i }).click(),
    ])
    await fileChooser.setFiles('public/favicon-32x32.png')

    // Confirm upload
    const confirm = page.getByRole('button', { name: /Confirmar Upload/i })
    if (await confirm.isVisible()) {
      await confirm.click()
    }

    // Expect toast and reload
    await expect(page.getByText(/Logomarca atualizada com sucesso/i)).toBeVisible()

    // After reload, header should contain an <img> inside branding area
    await expect(page.locator('header img')).toBeVisible()
  })
})


