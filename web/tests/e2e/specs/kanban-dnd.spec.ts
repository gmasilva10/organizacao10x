import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { TEST_IDS, TEST_DATA } from '../fixtures/test-data';

test.describe('Kanban Drag & Drop + Performance @regression', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.loginAsAdmin();
  });

  test('Board carrega com performance adequada', async ({ page }) => {
    await helpers.navigateToKanban();
    
    // Verificar se board carregou
    await expect(page.locator(TEST_IDS.kanbanBoard)).toBeVisible();
    
    // Verificar headers de performance
    await helpers.expectPerformanceHeaders();
  });

  test('Skeleton durante carregamento do board', async ({ page }) => {
    await helpers.navigateToKanban();
    
    // Verificar skeleton
    await helpers.expectSkeletonVisible();
    
    // Aguardar carregamento
    await helpers.waitForPageLoad();
    await helpers.expectSkeletonHidden();
  });

  test('Drag and drop de card altera order_index', async ({ page }) => {
    await helpers.navigateToKanban();
    
    // Aguardar board carregar
    await page.waitForSelector(TEST_IDS.kanbanColumn);
    
    // Encontrar primeiro card
    const firstCard = page.locator(TEST_IDS.kanbanCard).first();
    const firstColumn = page.locator(TEST_IDS.kanbanColumn).first();
    const secondColumn = page.locator(TEST_IDS.kanbanColumn).nth(1);
    
    // Verificar se há cards para mover
    const cardCount = await firstCard.count();
    if (cardCount === 0) {
      test.skip('Nenhum card disponível para teste de drag & drop');
    }
    
    // Fazer drag & drop do primeiro card para a segunda coluna
    await firstCard.dragTo(secondColumn);
    
    // Aguardar animação
    await page.waitForTimeout(1000);
    
    // Verificar se card foi movido
    await expect(secondColumn.locator(TEST_IDS.kanbanCard)).toContainText(
      await firstCard.textContent()
    );
  });

  test('Persistência após reload', async ({ page }) => {
    await helpers.navigateToKanban();
    
    // Aguardar board carregar
    await page.waitForSelector(TEST_IDS.kanbanColumn);
    
    // Fazer uma movimentação
    const firstCard = page.locator(TEST_IDS.kanbanCard).first();
    const firstColumn = page.locator(TEST_IDS.kanbanColumn).first();
    const secondColumn = page.locator(TEST_IDS.kanbanColumn).nth(1);
    
    const cardCount = await firstCard.count();
    if (cardCount === 0) {
      test.skip('Nenhum card disponível para teste de persistência');
    }
    
    const cardText = await firstCard.textContent();
    
    // Mover card
    await firstCard.dragTo(secondColumn);
    await page.waitForTimeout(1000);
    
    // Recarregar página
    await page.reload();
    await page.waitForSelector(TEST_IDS.kanbanBoard);
    
    // Verificar se card ainda está na nova posição
    await expect(secondColumn.locator(TEST_IDS.kanbanCard)).toContainText(cardText);
  });

  test('Contadores atualizam corretamente', async ({ page }) => {
    await helpers.navigateToKanban();
    
    // Aguardar board carregar
    await page.waitForSelector(TEST_IDS.kanbanColumn);
    
    // Contar cards em cada coluna
    const columns = page.locator(TEST_IDS.kanbanColumn);
    const columnCount = await columns.count();
    
    for (let i = 0; i < columnCount; i++) {
      const column = columns.nth(i);
      const cards = column.locator(TEST_IDS.kanbanCard);
      const cardCount = await cards.count();
      
      // Verificar se contador da coluna está correto
      const counter = column.locator('[data-testid="column-counter"]');
      if (await counter.count() > 0) {
        await expect(counter).toContainText(cardCount.toString());
      }
    }
  });

  test('Adicionar nova coluna', async ({ page }) => {
    await helpers.navigateToKanban();
    
    // Clicar em adicionar coluna
    await page.click(TEST_IDS.kanbanAddColumnButton);
    
    // Preencher nome da coluna
    await page.fill('[data-testid="column-name-input"]', TEST_DATA.kanbanColumn.title);
    
    // Salvar
    await page.click('[data-testid="save-column-button"]');
    
    // Verificar toast de sucesso
    await helpers.expectToastVisible('success');
    
    // Verificar se coluna aparece no board
    await expect(page.locator(TEST_IDS.kanbanColumn)).toContainText(TEST_DATA.kanbanColumn.title);
  });

  test('Adicionar novo card', async ({ page }) => {
    await helpers.navigateToKanban();
    
    // Aguardar board carregar
    await page.waitForSelector(TEST_IDS.kanbanColumn);
    
    // Clicar em adicionar card na primeira coluna
    await page.click(TEST_IDS.kanbanAddCardButton);
    
    // Preencher título do card
    await page.fill('[data-testid="card-title-input"]', 'Card de Teste E2E');
    
    // Salvar
    await page.click('[data-testid="save-card-button"]');
    
    // Verificar toast de sucesso
    await helpers.expectToastVisible('success');
    
    // Verificar se card aparece no board
    await expect(page.locator(TEST_IDS.kanbanCard)).toContainText('Card de Teste E2E');
  });

  test('Empty state em coluna vazia', async ({ page }) => {
    await helpers.navigateToKanban();
    
    // Aguardar board carregar
    await page.waitForSelector(TEST_IDS.kanbanColumn);
    
    // Verificar se há colunas vazias
    const columns = page.locator(TEST_IDS.kanbanColumn);
    const columnCount = await columns.count();
    
    for (let i = 0; i < columnCount; i++) {
      const column = columns.nth(i);
      const cards = column.locator(TEST_IDS.kanbanCard);
      const cardCount = await cards.count();
      
      if (cardCount === 0) {
        // Verificar empty state
        await expect(column.locator(TEST_IDS.emptyState)).toBeVisible();
      }
    }
  });

  test('Acessibilidade - navegação por teclado', async ({ page }) => {
    await helpers.navigateToKanban();
    
    // Aguardar board carregar
    await page.waitForSelector(TEST_IDS.kanbanBoard);
    
    // Testar navegação por teclado
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verificar se foco está em um elemento interativo
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('Performance - X-Query-Time < 400ms', async ({ page }) => {
    await helpers.navigateToKanban();
    
    // Verificar headers de performance
    await helpers.expectPerformanceHeaders();
  });

  test('Skeleton específico do Kanban', async ({ page }) => {
    await helpers.navigateToKanban();
    
    // Verificar se skeleton específico do Kanban aparece
    const kanbanSkeleton = page.locator('[data-testid="kanban-skeleton"]');
    if (await kanbanSkeleton.count() > 0) {
      await expect(kanbanSkeleton).toBeVisible();
    }
    
    // Aguardar carregamento
    await helpers.waitForPageLoad();
    await helpers.expectSkeletonHidden();
  });

  test('Responsividade - layout em diferentes tamanhos', async ({ page }) => {
    await helpers.navigateToKanban();
    
    // Testar em mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator(TEST_IDS.kanbanBoard)).toBeVisible();
    
    // Testar em tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator(TEST_IDS.kanbanBoard)).toBeVisible();
    
    // Testar em desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator(TEST_IDS.kanbanBoard)).toBeVisible();
  });
});
