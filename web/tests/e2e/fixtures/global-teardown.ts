import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Iniciando teardown global dos testes E2E...');

  // Aqui poderíamos limpar dados de teste do banco
  // Por enquanto, apenas logamos que o teardown foi concluído
  console.log('✅ Teardown global concluído');
}

export default globalTeardown;
