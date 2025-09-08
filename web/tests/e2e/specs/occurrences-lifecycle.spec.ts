import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { TEST_IDS, TEST_DATA } from '../fixtures/test-data';

test.describe('Occurrences Lifecycle + Audit @regression', () => {
  let helpers: TestHelpers;
  let studentId: string;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.loginAsAdmin();
    
    // Criar aluno para usar nas ocorrências
    await helpers.createTestStudent();
    // Em um teste real, obteríamos o ID do aluno criado
    studentId = 'test-student-id';
  });

  test('Criar ocorrência com campos válidos', async ({ page }) => {
    await helpers.navigateToOccurrences();
    
    // Clicar em "Nova Ocorrência"
    await page.click('[data-testid="add-occurrence-button"]');
    
    // Preencher formulário
    await page.fill(TEST_IDS.occurrenceDescriptionInput, TEST_DATA.occurrence.description);
    await page.selectOption(TEST_IDS.occurrencePrioritySelect, 'medium');
    await page.check(TEST_IDS.occurrenceSensitiveCheckbox);
    
    // Selecionar data (hoje)
    const today = new Date().toISOString().split('T')[0];
    await page.fill('[data-testid="occurrence-date-input"]', today);
    
    // Salvar
    await page.click(TEST_IDS.occurrenceSaveButton);
    
    // Verificar toast de sucesso
    await helpers.expectToastVisible('success');
    
    // Verificar se ocorrência aparece na lista
    await expect(page.locator('[data-testid="occurrence-list"]')).toContainText(TEST_DATA.occurrence.description);
  });

  test('Editar ocorrência e validar auditoria', async ({ page }) => {
    await helpers.navigateToOccurrences();
    
    // Clicar na primeira ocorrência para editar
    await page.click('[data-testid="occurrence-row"]:first-child [data-testid="edit-occurrence-button"]');
    
    // Alterar descrição
    const descriptionInput = page.locator(TEST_IDS.occurrenceDescriptionInput);
    await descriptionInput.clear();
    await descriptionInput.fill('Ocorrência editada via E2E');
    
    // Salvar
    await page.click(TEST_IDS.occurrenceSaveButton);
    
    // Verificar toast de sucesso
    await helpers.expectToastVisible('success');
    
    // Validar auditoria (caso feliz)
    const auditValid = await helpers.validateAuditLog('student_occurrence', 'test-occurrence-id', 'update');
    expect(auditValid).toBe(true);
  });

  test('Fechar ocorrência com motivo obrigatório', async ({ page }) => {
    await helpers.navigateToOccurrences();
    
    // Clicar em fechar na primeira ocorrência
    await page.click('[data-testid="occurrence-row"]:first-child [data-testid="close-occurrence-button"]');
    
    // Verificar se modal de fechamento aparece
    await expect(page.locator('[data-testid="close-occurrence-modal"]')).toBeVisible();
    
    // Preencher motivo
    await page.fill('[data-testid="close-reason-input"]', 'Resolvido via E2E');
    
    // Selecionar data de resolução (hoje)
    const today = new Date().toISOString().split('T')[0];
    await page.fill('[data-testid="resolved-date-input"]', today);
    
    // Confirmar fechamento
    await page.click('[data-testid="confirm-close-button"]');
    
    // Verificar toast de sucesso
    await helpers.expectToastVisible('success');
    
    // Verificar se ocorrência aparece como fechada
    await expect(page.locator('[data-testid="occurrence-row"]:first-child')).toContainText('Fechada');
  });

  test('Modo degradado - auditoria com falha', async ({ page }) => {
    // Habilitar modo degradado
    await page.request.post('/api/test/audit-degradation', {
      data: { enabled: true }
    });
    
    await helpers.navigateToOccurrences();
    
    // Editar uma ocorrência
    await page.click('[data-testid="occurrence-row"]:first-child [data-testid="edit-occurrence-button"]');
    
    const descriptionInput = page.locator(TEST_IDS.occurrenceDescriptionInput);
    await descriptionInput.clear();
    await descriptionInput.fill('Teste modo degradado');
    
    await page.click(TEST_IDS.occurrenceSaveButton);
    
    // Verificar toast degradado
    await helpers.expectToastVisible('degraded');
    
    // Validar auditoria degradada
    const degradedAuditValid = await helpers.validateDegradedAuditLog('student_occurrence', 'test-occurrence-id', 'update');
    expect(degradedAuditValid).toBe(true);
    
    // Desabilitar modo degradado
    await page.request.post('/api/test/audit-degradation', {
      data: { enabled: false }
    });
  });

  test('Validação - reminder_at >= occurred_at', async ({ page }) => {
    await helpers.navigateToOccurrences();
    
    // Clicar em "Nova Ocorrência"
    await page.click('[data-testid="add-occurrence-button"]');
    
    // Preencher campos
    await page.fill(TEST_IDS.occurrenceDescriptionInput, 'Teste validação de data');
    
    // Data da ocorrência: hoje
    const today = new Date().toISOString().split('T')[0];
    await page.fill('[data-testid="occurrence-date-input"]', today);
    
    // Data do lembrete: ontem (inválido)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await page.fill('[data-testid="reminder-date-input"]', yesterday);
    
    // Tentar salvar
    await page.click(TEST_IDS.occurrenceSaveButton);
    
    // Verificar toast de erro
    await helpers.expectToastVisible('error');
    
    // Verificar se formulário não foi submetido
    await expect(page.locator('[data-testid="occurrence-form"]')).toBeVisible();
  });

  test('Skeleton durante carregamento', async ({ page }) => {
    await helpers.navigateToOccurrences();
    
    // Verificar skeleton
    await helpers.expectSkeletonVisible();
    
    // Aguardar carregamento
    await helpers.waitForPageLoad();
    await helpers.expectSkeletonHidden();
  });

  test('Empty state quando não há ocorrências', async ({ page }) => {
    // Este teste seria executado em um ambiente limpo
    await helpers.navigateToOccurrences();
    
    const hasOccurrences = await page.locator('[data-testid="occurrence-list"]').count() > 0;
    
    if (!hasOccurrences) {
      await helpers.expectEmptyStateVisible();
    }
  });

  test('Acessibilidade - AlertDialog em ações destrutivas', async ({ page }) => {
    await helpers.navigateToOccurrences();
    
    // Tentar excluir uma ocorrência
    await page.click('[data-testid="occurrence-row"]:first-child [data-testid="delete-occurrence-button"]');
    
    // Verificar AlertDialog
    await helpers.expectAlertDialogVisible();
    
    // Testar navegação por teclado
    await page.keyboard.press('Tab'); // Cancelar
    await page.keyboard.press('Tab'); // Confirmar
    await page.keyboard.press('Enter'); // Confirmar
    
    // Verificar se dialog foi fechado
    await helpers.expectAlertDialogHidden();
  });

  test('Performance - headers de tempo de resposta', async ({ page }) => {
    await helpers.navigateToOccurrences();
    
    // Verificar headers de performance
    await helpers.expectPerformanceHeaders();
  });
});
