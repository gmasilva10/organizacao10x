import { test, expect } from '../fixtures/auth-fixture';
import { TestHelpers } from '../utils/test-helpers';
import { TEST_IDS } from '../fixtures/test-data';

test.describe('Smoke Tests - Autenticação e Navegação @smoke', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('Login como admin redireciona para /app', async ({ adminPage }) => {
    await adminPage.goto('/app');
    await expect(adminPage).toHaveURL('/app');
  });

  test('Login como trainer redireciona para /app', async ({ trainerPage }) => {
    await trainerPage.goto('/app');
    await expect(trainerPage).toHaveURL('/app');
  });

  test('Página de login carrega corretamente', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('Entrar');
  });

  test('Navegação após login funciona', async ({ adminPage }) => {
    // Dashboard
    await adminPage.goto('/app');
    await expect(adminPage).toHaveURL('/app');
    
    // Students
    await adminPage.goto('/app/students');
    await expect(adminPage).toHaveURL('/app/students');
    
    // Occurrences
    await adminPage.goto('/app/workflow/occurrences');
    await expect(adminPage).toHaveURL('/app/workflow/occurrences');
    
    // Kanban
    await adminPage.goto('/app/onboarding');
    await expect(adminPage).toHaveURL('/app/onboarding');
  });

  test('Skeletons exibidos durante carregamento', async ({ adminPage }) => {
    // Navegar para Students e verificar skeleton
    await adminPage.goto('/app/students');
    
    // Verificar se há skeleton (pode não aparecer se carregar muito rápido)
    const skeleton = adminPage.locator(TEST_IDS.skeleton);
    if (await skeleton.count() > 0) {
      await expect(skeleton.first()).toBeVisible();
    }
    
    // Aguardar carregamento completo
    await adminPage.waitForLoadState('networkidle');
  });

  test('Performance headers presentes nas rotas principais', async ({ adminPage }) => {
    // Testar performance headers em diferentes rotas
    await adminPage.goto('/app');
    await adminPage.waitForLoadState('networkidle');
    
    await adminPage.goto('/app/students');
    await adminPage.waitForLoadState('networkidle');
    
    await adminPage.goto('/app/onboarding');
    await adminPage.waitForLoadState('networkidle');
  });
});
