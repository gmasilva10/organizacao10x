import { test, expect } from '@playwright/test';

const LOGIN_URL = 'http://localhost:5173/login';
const ALUNOS_URL = 'http://localhost:5173/cadastro/alunos';
const USER = 'gma_silva@yahoo.com.br';
const PASS = '123456';

test('Editar e excluir aluno - fluxo completo', async ({ page }) => {
  // Login
  await page.goto(LOGIN_URL);
  await page.fill('input[name="email"]', USER);
  await page.fill('input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.screenshot({ path: '01-dashboard.png' });

  // Navegar até alunos
  await page.goto(ALUNOS_URL);
  await expect(page).toHaveURL(/alunos/);
  await page.screenshot({ path: '02-lista-alunos.png' });

  // Selecionar primeiro aluno
  const alunoRow = page.locator('table tbody tr').first();
  const nomeAluno = await alunoRow.locator('td').first().innerText();
  await alunoRow.click();
  await page.screenshot({ path: '03-perfil-aluno.png' });

  // Teste 1: Editar informação
  await page.click('button:has-text("Editar")');
  const campoEditavel = page.locator('input, textarea').first();
  const valorAntigo = await campoEditavel.inputValue();
  const valorNovo = valorAntigo + ' Editado';
  await campoEditavel.fill(valorNovo);
  await page.click('button:has-text("Salvar")');
  await expect(campoEditavel).toHaveValue(valorNovo, { timeout: 5000 });
  await page.screenshot({ path: '04-aluno-editado.png' });

  // Teste 2: Excluir aluno
  await page.click('button:has-text("Excluir")');
  await page.click('button:has-text("Confirmar")');
  await page.waitForTimeout(1500); // Aguarda atualização
  await page.goto(ALUNOS_URL);
  await expect(page.locator('table')).not.toContainText(nomeAluno);
  await page.screenshot({ path: '05-aluno-excluido.png' });
}); 