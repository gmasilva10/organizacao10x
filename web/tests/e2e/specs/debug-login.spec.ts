import { test, expect } from '@playwright/test';

test.describe('Debug Login', () => {
  test('Teste simples de login', async ({ page }) => {
    // Ir para a página de login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Verificar se a página carregou
    console.log('URL atual:', page.url());
    console.log('Título da página:', await page.title());
    
    // Verificar o HTML da página
    const bodyText = await page.textContent('body');
    console.log('Conteúdo da página:', bodyText?.substring(0, 500));
    
    // Aguardar o drawer aparecer (pode demorar um pouco)
    await page.waitForTimeout(3000);
    
    // Verificar se o formulário está visível
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    console.log('Email input visível:', await emailInput.isVisible());
    console.log('Password input visível:', await passwordInput.isVisible());
    console.log('Submit button visível:', await submitButton.isVisible());
    
    // Verificar se há algum drawer ou modal
    const drawer = page.locator('[role="dialog"], .drawer, [data-testid*="drawer"]');
    console.log('Drawer encontrado:', await drawer.count());
    
    // Verificar se há algum botão de login na página
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    console.log('Número de botões na página:', buttonCount);
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = allButtons.nth(i);
      const text = await button.textContent();
      console.log(`Botão ${i}: "${text}"`);
    }
    
    // Se não estiver visível, tentar clicar no botão de login se existir
    if (!await emailInput.isVisible()) {
      const loginButton = page.locator('button:has-text("Entrar"), button:has-text("Login")');
      if (await loginButton.isVisible()) {
        console.log('Clicando no botão de login...');
        await loginButton.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Tentar preencher o formulário
    if (await emailInput.isVisible()) {
      await emailInput.fill('gma_silva@yahoo.com.br');
      await passwordInput.fill('Gma@11914984');
      
      // Aguardar um pouco antes de clicar
      await page.waitForTimeout(1000);
      
      // Clicar no botão de submit
      await submitButton.click();
      
      // Aguardar redirecionamento
      await page.waitForTimeout(3000);
      
      console.log('URL após login:', page.url());
    } else {
      console.log('Formulário de login não encontrado');
    }
  });
});
