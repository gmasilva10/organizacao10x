// Configuração de ambiente para testes E2E
export const TEST_CONFIG = {
  // URLs
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  SUPABASE_URL: process.env.SUPABASE_URL || 'http://localhost:54321',
  
  // Test Tenant ID (fixo para testes)
  TENANT_ID: 'test-tenant-123',
  
  // Test Users (usando usuário real fornecido)
  ADMIN_EMAIL: 'gma_silva@yahoo.com.br',
  TRAINER_EMAIL: 'gma_silva@yahoo.com.br',
  PASSWORD: 'Gma@11914984',
  
  // Supabase Keys (para testes locais)
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  
  // Audit Degradation Flag (somente para testes E2E)
  AUDIT_FORCE_FAIL: process.env.AUDIT_FORCE_FAIL === '1',
  
  // Performance Headers Validation
  PERFORMANCE_THRESHOLD_MS: 400,
  
  // Test Data Seeds
  STUDENT_NAME: 'João Silva Teste',
  OCCURRENCE_DESCRIPTION: 'Ocorrência de teste para E2E',
  KANBAN_COLUMN_TITLE: 'Teste E2E',
  
  // Timeouts
  DEFAULT_TIMEOUT: 30000,
  NAVIGATION_TIMEOUT: 60000,
  API_TIMEOUT: 10000,
} as const;
