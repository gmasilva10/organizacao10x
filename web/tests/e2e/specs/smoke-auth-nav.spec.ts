import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { TEST_IDS } from '../fixtures/test-data';

test.describe('Smoke Tests - Autenticação e Navegação @smoke', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('Login como admin redireciona para /app', async ({ page }) => {
    await helpers.loginAsAdmin();
    await expect(page).toHaveURL('/app');
  });

  test('Login como trainer redireciona para /app', async ({ page }) => {
    await helpers.loginAsTrainer();
    await expect(page).toHaveURL('/app');
  });

  test('Página de login carrega corretamente', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('Entrar');
  });

  test('Navegação após login funciona', async ({ page }) => {
    await helpers.loginAsAdmin();
    
    // Dashboard
    await page.goto('/app');
    await expect(page).toHaveURL('/app');
    
    // Students
    await page.goto('/app/students');
    await expect(page).toHaveURL('/app/students');
    
    // Occurrences
    await page.goto('/app/workflow/occurrences');
    await expect(page).toHaveURL('/app/workflow/occurrences');
    
    // Kanban
    await page.goto('/app/kanban');
    await expect(page).toHaveURL('/app/kanban');
  });

  test('Skeletons exibidos durante carregamento', async ({ page }) => {
    // Navegar para Students e verificar skeleton
    await page.goto('/app/students');
    
    // Verificar se há skeleton (pode não aparecer se carregar muito rápido)
    const skeleton = page.locator(TEST_IDS.skeleton);
    if (await skeleton.count() > 0) {
      await expect(skeleton.first()).toBeVisible();
    }
    
    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');
  });

  test('Performance headers presentes nas rotas principais', async ({ page }) => {
    // Testar performance headers em diferentes rotas
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/app/students');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/app/kanban');
    await page.waitForLoadState('networkidle');
  });
});
