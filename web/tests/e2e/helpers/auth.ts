import { Page, expect } from '@playwright/test'

export async function login(page: Page, baseUrl: string) {
  const email = process.env.TEST_EMAIL || 'agoravai@teste.com'
  const password = process.env.TEST_PASSWORD || 'Teste@123'

  await page.goto(baseUrl + '/login')

  // Open drawer if needed
  if (await page.getByRole('dialog', { name: /bem-vindo/i }).isHidden()) {
    await page.getByRole('button', { name: /login/i }).click()
  }

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: /^Entrar$/ }).click()

  // Expect to reach /app
  await page.waitForURL(/\/app(\/.*)?$/)
  await expect(page.locator('header')).toBeVisible()
}


