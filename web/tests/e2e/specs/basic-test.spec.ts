import { test, expect } from '@playwright/test';

test.describe('Basic Test', () => {
  test('Aplicação carrega', async ({ page }) => {
    // Tentar acessar a página principal
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log('URL atual:', page.url());
    console.log('Título da página:', await page.title());
    
    // Verificar se não há erro 500
    const bodyText = await page.textContent('body');
    console.log('Conteúdo da página:', bodyText?.substring(0, 200));
    
    // Verificar se a página carregou (não deve ser "Internal Server Error")
    expect(bodyText).not.toContain('Internal Server Error');
  });
});
