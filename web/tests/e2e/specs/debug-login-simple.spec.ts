import { test, expect } from '@playwright/test';

test.describe('Debug Login Simple', () => {
  test('Teste simples de login na página simplificada', async ({ page }) => {
    // Ir para a página de login simples
    await page.goto('/login-simple');
    await page.waitForLoadState('networkidle');
    
    // Verificar se a página carregou
    console.log('URL atual:', page.url());
    console.log('Título da página:', await page.title());
    
    // Verificar o HTML da página
    const bodyText = await page.textContent('body');
    console.log('Conteúdo da página:', bodyText?.substring(0, 500));
    
    // Verificar se o formulário está visível
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    console.log('Email input visível:', await emailInput.isVisible());
    console.log('Password input visível:', await passwordInput.isVisible());
    console.log('Submit button visível:', await submitButton.isVisible());
    
    // Tentar preencher o formulário
    if (await emailInput.isVisible()) {
      await emailInput.fill('gma_silva@yahoo.com.br');
      await passwordInput.fill('Gma@11914984');
      
      // Aguardar um pouco antes de clicar
      await page.waitForTimeout(1000);
      
      // Clicar no botão de submit
      await submitButton.click();
      
      // Aguardar um pouco para ver o resultado
      await page.waitForTimeout(2000);
      
      console.log('URL após submit:', page.url());
      console.log('Console logs:', await page.evaluate(() => {
        return window.console.logs || [];
      }));
    } else {
      console.log('Formulário de login não encontrado');
    }
  });
});
