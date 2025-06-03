import { test, expect } from '@playwright/test';

// Ajuste a URL se necessário
const REGISTRO_URL = 'http://localhost:5173/registro';

test('Registro de nova organização exibe erro de trigger de perfil', async ({ page }) => {
  await page.goto(REGISTRO_URL);
  await page.fill('input[name="empresa"]', 'Empresa Teste Playwright');
  await page.selectOption('select[name="tipoDocumento"]', 'CPF');
  await page.fill('input[name="documento"]', '123.456.789-00');
  await page.fill('input[name="nome"]', 'Usuário Teste');
  await page.fill('input[name="email"]', `playwright-teste+${Date.now()}@mail.com`);
  await page.fill('input[name="senha"]', 'SenhaForte123!');
  await page.fill('input[name="confirmarSenha"]', 'SenhaForte123!');
  await page.click('button[type="submit"]');
  // Espera pela mensagem de erro
  const erro = page.locator('text=Perfil não encontrado para o usuário');
  await expect(erro).toBeVisible({ timeout: 8000 });
  // Tirar print em caso de erro
  await page.screenshot({ path: 'registro-erro.png' });
}); 