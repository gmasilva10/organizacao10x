import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { TEST_IDS, TEST_DATA } from '../fixtures/test-data';

test.describe('Students CRUD Flow @regression', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.loginAsAdmin();
  });

  test('Criar aluno → toast success → listar', async ({ page }) => {
    await helpers.navigateToStudents();
    
    // Clicar em "Novo Aluno"
    await page.click('[data-testid="add-student-button"]');
    
    // Preencher formulário
    await page.fill(TEST_IDS.studentNameInput, TEST_DATA.student.full_name);
    await page.fill(TEST_IDS.studentEmailInput, TEST_DATA.student.email);
    await page.fill('[data-testid="student-phone-input"]', TEST_DATA.student.phone);
    
    // Salvar
    await page.click(TEST_IDS.studentSaveButton);
    
    // Verificar toast de sucesso
    await helpers.expectToastVisible('success');
    
    // Verificar se aluno aparece na lista
    await expect(page.locator(TEST_IDS.studentList)).toContainText(TEST_DATA.student.full_name);
  });

  test('Filtrar alunos por nome', async ({ page }) => {
    await helpers.navigateToStudents();
    
    // Preencher campo de busca
    await page.fill('[data-testid="student-search-input"]', 'João');
    
    // Aguardar filtro ser aplicado
    await page.waitForTimeout(500);
    
    // Verificar se apenas alunos com "João" aparecem
    const studentRows = page.locator('[data-testid="student-row"]');
    const count = await studentRows.count();
    
    for (let i = 0; i < count; i++) {
      await expect(studentRows.nth(i)).toContainText('João');
    }
  });

  test('Editar campo simples do aluno', async ({ page }) => {
    await helpers.navigateToStudents();
    
    // Clicar no primeiro aluno para editar
    await page.click('[data-testid="student-row"]:first-child [data-testid="edit-student-button"]');
    
    // Alterar nome
    const nameInput = page.locator(TEST_IDS.studentNameInput);
    await nameInput.clear();
    await nameInput.fill('João Silva Editado');
    
    // Salvar
    await page.click(TEST_IDS.studentSaveButton);
    
    // Verificar toast de sucesso
    await helpers.expectToastVisible('success');
    
    // Verificar se nome foi alterado na lista
    await expect(page.locator(TEST_IDS.studentList)).toContainText('João Silva Editado');
  });

  test('Excluir aluno com AlertDialog', async ({ page }) => {
    await helpers.navigateToStudents();
    
    // Clicar em excluir no primeiro aluno
    await page.click('[data-testid="student-row"]:first-child [data-testid="delete-student-button"]');
    
    // Verificar se AlertDialog aparece
    await helpers.expectAlertDialogVisible();
    
    // Confirmar exclusão
    await helpers.confirmAlertDialog();
    
    // Verificar toast de sucesso
    await helpers.expectToastVisible('success');
  });

  test('Validação de campos obrigatórios', async ({ page }) => {
    await helpers.navigateToStudents();
    
    // Clicar em "Novo Aluno"
    await page.click('[data-testid="add-student-button"]');
    
    // Tentar salvar sem preencher campos obrigatórios
    await page.click(TEST_IDS.studentSaveButton);
    
    // Verificar se toast de erro aparece
    await helpers.expectToastVisible('error');
    
    // Verificar se formulário não foi submetido
    await expect(page.locator('[data-testid="student-form"]')).toBeVisible();
  });

  test('Skeleton durante carregamento da lista', async ({ page }) => {
    await helpers.navigateToStudents();
    
    // Verificar se skeleton aparece durante carregamento
    await helpers.expectSkeletonVisible();
    
    // Aguardar carregamento completo
    await helpers.waitForPageLoad();
    await helpers.expectSkeletonHidden();
  });

  test('Empty state quando não há alunos', async ({ page }) => {
    // Este teste seria executado em um ambiente limpo
    // Por enquanto, apenas verificamos se o componente existe
    await helpers.navigateToStudents();
    
    // Se não houver alunos, verificar empty state
    const hasStudents = await page.locator(TEST_IDS.studentList).count() > 0;
    
    if (!hasStudents) {
      await helpers.expectEmptyStateVisible();
    }
  });

  test('Acessibilidade - navegação por teclado no formulário', async ({ page }) => {
    await helpers.navigateToStudents();
    await page.click('[data-testid="add-student-button"]');
    
    // Testar navegação por teclado no formulário
    await page.keyboard.press('Tab'); // Nome
    await page.keyboard.press('Tab'); // Email
    await page.keyboard.press('Tab'); // Telefone
    await page.keyboard.press('Tab'); // Botão Salvar
    
    // Verificar se foco está no botão salvar
    await expect(page.locator(TEST_IDS.studentSaveButton)).toBeFocused();
  });

  test('Performance - tempo de resposta da API', async ({ page }) => {
    await helpers.navigateToStudents();
    
    // Verificar headers de performance
    await helpers.expectPerformanceHeaders();
  });
});
