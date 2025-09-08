import { chromium, FullConfig } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Iniciando setup global dos testes E2E...');

  // Verificar se o servidor está rodando
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto(TEST_CONFIG.BASE_URL, { timeout: 30000 });
    console.log('✅ Servidor de desenvolvimento está rodando');
  } catch (error) {
    console.error('❌ Servidor de desenvolvimento não está acessível');
    throw new Error('Servidor de desenvolvimento não está rodando. Execute "npm run dev" antes dos testes.');
  } finally {
    await browser.close();
  }

  // Aqui poderíamos fazer setup de dados de teste no banco
  // Por enquanto, apenas logamos que o setup foi concluído
  console.log('✅ Setup global concluído');
}

export default globalSetup;
