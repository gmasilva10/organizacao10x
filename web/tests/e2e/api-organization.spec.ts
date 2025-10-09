import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

test.describe('API /api/organization', () => {
  test('GET returns current organization and PATCH updates name (noop revert)', async ({ page }) => {
    await login(page, BASE_URL)

    const resp = await page.request.get(BASE_URL + '/api/organization')
    expect(resp.status()).toBe(200)
    const data = await resp.json()
    expect(data?.success).toBeTruthy()
    const org = data?.organization
    expect(org?.id).toBeTruthy()

    // Update and revert
    const newName = (org.name || 'Organizacao10x') + ' '
    const patch = await page.request.patch(BASE_URL + '/api/organization', {
      data: { name: newName.trim() },
    })
    expect(patch.status()).toBe(200)

    // Revert to original
    await page.request.patch(BASE_URL + '/api/organization', { data: { name: org.name } })
  })
})


