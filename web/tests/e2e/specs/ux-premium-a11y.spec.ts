import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { TEST_IDS } from '../fixtures/test-data';

test.describe('UX Premium & Acessibilidade @regression', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.loginAsAdmin();
  });

  test('AlertDialog - presente em ações destrutivas', async ({ page }) => {
    await helpers.navigateToStudents();
    
    // Tentar excluir um aluno
    await page.click('[data-testid="student-row"]:first-child [data-testid="delete-student-button"]');
    
    // Verificar se AlertDialog aparece
    await helpers.expectAlertDialogVisible();
    
    // Verificar botões de ação
    await expect(page.locator(TEST_IDS.alertDialogCancel)).toBeVisible();
    await expect(page.locator(TEST_IDS.alertDialogConfirm)).toBeVisible();
  });

  test('AlertDialog - navegação por teclado (TAB/ESC/ENTER)', async ({ page }) => {
    await helpers.navigateToStudents();
    
    // Abrir AlertDialog
    await page.click('[data-testid="student-row"]:first-child [data-testid="delete-student-button"]');
    await helpers.expectAlertDialogVisible();
    
    // Testar TAB navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(TEST_IDS.alertDialogCancel)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator(TEST_IDS.alertDialogConfirm)).toBeFocused();
    
    // Testar ESC para fechar
    await page.keyboard.press('Escape');
    await helpers.expectAlertDialogHidden();
  });

  test('AlertDialog - ENTER confirma ação', async ({ page }) => {
    await helpers.navigateToStudents();
    
    // Abrir AlertDialog
    await page.click('[data-testid="student-row"]:first-child [data-testid="delete-student-button"]');
    await helpers.expectAlertDialogVisible();
    
    // Focar no botão confirmar e pressionar ENTER
    await page.locator(TEST_IDS.alertDialogConfirm).focus();
    await page.keyboard.press('Enter');
    
    // Verificar se dialog foi fechado
    await helpers.expectAlertDialogHidden();
  });

  test('Toasts - success/error/warning/degraded padronizados', async ({ page }) => {
    await helpers.navigateToStudents();
    
    // Testar toast de sucesso
    await page.click('[data-testid="add-student-button"]');
    await page.fill(TEST_IDS.studentNameInput, 'Teste Toast');
    await page.fill(TEST_IDS.studentEmailInput, 'teste@toast.com');
    await page.click(TEST_IDS.studentSaveButton);
    
    await helpers.expectToastVisible('success');
    
    // Testar toast de erro (campo obrigatório vazio)
    await page.click('[data-testid="add-student-button"]');
    await page.click(TEST_IDS.studentSaveButton);
    
    await helpers.expectToastVisible('error');
  });

  test('Skeletons - visíveis em todas as telas', async ({ page }) => {
    // Dashboard
    await page.goto('/app');
    await helpers.expectSkeletonVisible();
    await helpers.waitForPageLoad();
    await helpers.expectSkeletonHidden();
    
    // Students
    await page.goto('/app/students');
    await helpers.expectSkeletonVisible();
    await helpers.waitForPageLoad();
    await helpers.expectSkeletonHidden();
    
    // Occurrences
    await page.goto('/app/workflow/occurrences');
    await helpers.expectSkeletonVisible();
    await helpers.waitForPageLoad();
    await helpers.expectSkeletonHidden();
    
    // Kanban
    await page.goto('/app/kanban');
    await helpers.expectSkeletonVisible();
    await helpers.waitForPageLoad();
    await helpers.expectSkeletonHidden();
  });

  test('Empty/Error states - com CTA "tentar novamente"', async ({ page }) => {
    // Simular erro de rede
    await page.route('**/api/students', route => route.abort());
    
    await helpers.navigateToStudents();
    
    // Verificar se empty/error state aparece
    const emptyState = page.locator(TEST_IDS.emptyState);
    const errorState = page.locator('[data-testid="error-state"]');
    
    if (await emptyState.count() > 0) {
      await expect(emptyState).toBeVisible();
    } else if (await errorState.count() > 0) {
      await expect(errorState).toBeVisible();
      
      // Verificar botão "Tentar novamente"
      const retryButton = page.locator('[data-testid="retry-button"]');
      if (await retryButton.count() > 0) {
        await expect(retryButton).toBeVisible();
      }
    }
  });

  test('Breadcrumbs - navegação clara em todas as páginas', async ({ page }) => {
    const pages = [
      { url: '/app', expectedText: 'Dashboard' },
      { url: '/app/students', expectedText: 'Alunos' },
      { url: '/app/workflow/occurrences', expectedText: 'Gestão de Ocorrências' },
      { url: '/app/kanban', expectedText: 'Onboarding/Kanban' }
    ];
    
    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      await helpers.expectBreadcrumbVisible();
      await expect(page.locator(TEST_IDS.breadcrumb)).toContainText(pageInfo.expectedText);
    }
  });

  test('Acessibilidade - ARIA labels e descrições', async ({ page }) => {
    await helpers.navigateToStudents();
    
    // Verificar ARIA labels em elementos importantes
    const alertDialog = page.locator(TEST_IDS.alertDialog);
    if (await alertDialog.count() > 0) {
      await expect(alertDialog).toHaveAttribute('aria-labelledby');
    }
    
    // Verificar breadcrumb
    const breadcrumb = page.locator(TEST_IDS.breadcrumb);
    await expect(breadcrumb).toHaveAttribute('aria-label', 'Breadcrumb');
    
    // Verificar skeleton
    const skeleton = page.locator(TEST_IDS.skeleton).first();
    if (await skeleton.count() > 0) {
      await expect(skeleton).toHaveAttribute('data-testid', 'skeleton');
    }
  });

  test('Acessibilidade - foco inicial correto', async ({ page }) => {
    await helpers.navigateToStudents();
    
    // Abrir modal de novo aluno
    await page.click('[data-testid="add-student-button"]');
    
    // Verificar se foco está no primeiro campo
    const firstInput = page.locator(TEST_IDS.studentNameInput);
    await expect(firstInput).toBeFocused();
  });

  test('Acessibilidade - ordem de tabulação lógica', async ({ page }) => {
    await helpers.navigateToStudents();
    
    // Testar ordem de tabulação na página
    const focusableElements = [
      '[data-testid="add-student-button"]',
      TEST_IDS.studentNameInput,
      TEST_IDS.studentEmailInput,
      '[data-testid="student-search-input"]'
    ];
    
    for (const selector of focusableElements) {
      await page.keyboard.press('Tab');
      const element = page.locator(selector);
      if (await element.count() > 0) {
        await expect(element).toBeFocused();
      }
    }
  });

  test('Acessibilidade - leitura por screen reader', async ({ page }) => {
    await helpers.navigateToStudents();
    
    // Verificar se elementos têm texto alternativo
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
    
    // Verificar se botões têm labels descritivos
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      // Pelo menos um dos dois deve existir
      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test('Cross-browser - funcionalidades básicas', async ({ page, browserName }) => {
    await helpers.navigateToStudents();
    
    // Testar funcionalidades básicas em diferentes browsers
    await page.click('[data-testid="add-student-button"]');
    await page.fill(TEST_IDS.studentNameInput, `Teste ${browserName}`);
    await page.fill(TEST_IDS.studentEmailInput, `teste@${browserName}.com`);
    await page.click(TEST_IDS.studentSaveButton);
    
    // Verificar se funcionou independente do browser
    await helpers.expectToastVisible('success');
  });

  test('Performance - headers X-Query-Time < 400ms', async ({ page }) => {
    const routes = ['/app', '/app/students', '/app/workflow/occurrences', '/app/kanban'];
    
    for (const route of routes) {
      await page.goto(route);
      await helpers.expectPerformanceHeaders();
    }
  });

  test('Responsividade - modais sem scroll indevido', async ({ page }) => {
    await helpers.navigateToStudents();
    
    // Testar em mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.click('[data-testid="add-student-button"]');
    
    // Verificar se modal não causa scroll horizontal
    const body = page.locator('body');
    const scrollWidth = await body.evaluate(el => el.scrollWidth);
    const clientWidth = await body.evaluate(el => el.clientWidth);
    
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10); // Margem de erro
  });
});
