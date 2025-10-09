// ConfiguraÃ§Ã£o de ambiente para testes E2E
export const TEST_CONFIG = {
  // URLs
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  SUPABASE_URL: process.env.SUPABASE_URL || 'http://localhost:54321',
  
  // Test Org ID (fixo para testes)
  ORG_ID: 'test-tenant-123',
  
  // Test Users (via environment variables)
  ADMIN_EMAIL: process.env.TEST_ADMIN_EMAIL || 'test-admin@example.com',
  TRAINER_EMAIL: process.env.TEST_TRAINER_EMAIL || 'test-trainer@example.com',
  PASSWORD: process.env.TEST_PASSWORD || 'test-password-123',
  
  // Supabase Keys (para testes locais)
    SUPABASE_ANON_KEY: process.env.TEST_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || '',
  
  // Audit Degradation Flag (somente para testes E2E)
  AUDIT_FORCE_FAIL: process.env.AUDIT_FORCE_FAIL === '1',
  
  // Performance Headers Validation
  PERFORMANCE_THRESHOLD_MS: 400,
  
  // Test Data Seeds
  STUDENT_NAME: 'JoÃ£o Silva Teste',
  OCCURRENCE_DESCRIPTION: 'OcorrÃªncia de teste para E2E',
  KANBAN_COLUMN_TITLE: 'Teste E2E',
  
  // Timeouts
  DEFAULT_TIMEOUT: 30000,
  NAVIGATION_TIMEOUT: 60000,
  API_TIMEOUT: 10000,
} as const;


