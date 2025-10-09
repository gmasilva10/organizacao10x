import { TEST_CONFIG } from './test-config';

// Re-exportar TEST_CONFIG para uso nos testes
export { TEST_CONFIG };

// Dados de seed para testes E2E
export const TEST_DATA = {
  // Usuários de teste
  users: {
    admin: {
      email: TEST_CONFIG.ADMIN_EMAIL,
      password: TEST_CONFIG.PASSWORD,
      role: 'admin',
      org_id: TEST_CONFIG.ORG_ID,
    },
    trainer: {
      email: TEST_CONFIG.TRAINER_EMAIL,
      password: TEST_CONFIG.PASSWORD,
      role: 'trainer',
      org_id: TEST_CONFIG.ORG_ID,
    },
  },

  // Aluno base para testes
  student: {
    full_name: TEST_CONFIG.STUDENT_NAME,
    email: 'joao.silva@test.com',
    phone: '11999999999',
    status: 'active',
    org_id: TEST_CONFIG.ORG_ID,
  },

  // Ocorrência base para testes
  occurrence: {
    student_id: '', // Será preenchido dinamicamente
    description: TEST_CONFIG.OCCURRENCE_DESCRIPTION,
    occurred_at: new Date().toISOString(),
    priority: 'medium',
    is_sensitive: false,
    reminder_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // +1 dia
    org_id: TEST_CONFIG.ORG_ID,
  },

  // Grupo de ocorrência para testes
  occurrenceGroup: {
    name: 'Teste E2E',
    description: 'Grupo para testes E2E',
    org_id: TEST_CONFIG.ORG_ID,
  },

  // Tipo de ocorrência para testes
  occurrenceType: {
    name: 'Teste E2E',
    description: 'Tipo para testes E2E',
    group_id: '', // Será preenchido dinamicamente
    org_id: TEST_CONFIG.ORG_ID,
  },

  // Coluna do Kanban para testes
  kanbanColumn: {
    title: TEST_CONFIG.KANBAN_COLUMN_TITLE,
    order_index: 1,
    org_id: TEST_CONFIG.ORG_ID,
  },

  // Tarefa do Kanban para testes
  kanbanTask: {
    title: 'Tarefa de Teste E2E',
    description: 'Descrição da tarefa para testes E2E',
    is_required: true,
    order_index: 1,
    column_id: '', // Será preenchido dinamicamente
    org_id: TEST_CONFIG.TENANT_ID,
  },
} as const;

// IDs de elementos para seletores de teste
export const TEST_IDS = {
  // AlertDialog
  alertDialog: '[data-testid="alert-dialog"]',
  alertDialogTrigger: '[data-testid="alert-dialog-trigger"]',
  alertDialogConfirm: '[data-testid="alert-dialog-confirm"]',
  alertDialogCancel: '[data-testid="alert-dialog-cancel"]',

  // Toast
  toast: '[data-testid="toast"]',
  toastSuccess: '[data-testid="toast-success"]',
  toastError: '[data-testid="toast-error"]',
  toastWarning: '[data-testid="toast-warning"]',
  toastDegraded: '[data-testid="toast-degraded"]',

  // Skeleton
  skeleton: '[data-testid="skeleton"]',
  tableSkeleton: '[data-testid="table-skeleton"]',
  cardSkeleton: '[data-testid="card-skeleton"]',

  // Empty State
  emptyState: '[data-testid="empty-state"]',
  emptyStateTitle: '[data-testid="empty-state-title"]',
  emptyStateDescription: '[data-testid="empty-state-description"]',

  // Breadcrumb
  breadcrumb: '[data-testid="breadcrumb"]',
  breadcrumbItem: '[data-testid="breadcrumb-item"]',

  // Students
  studentForm: '[data-testid="student-form"]',
  studentNameInput: '[data-testid="student-name-input"]',
  studentEmailInput: '[data-testid="student-email-input"]',
  studentSaveButton: '[data-testid="student-save-button"]',
  studentDeleteButton: '[data-testid="student-delete-button"]',
  studentList: '[data-testid="student-list"]',

  // Occurrences
  occurrenceForm: '[data-testid="occurrence-form"]',
  occurrenceDescriptionInput: '[data-testid="occurrence-description-input"]',
  occurrencePrioritySelect: '[data-testid="occurrence-priority-select"]',
  occurrenceSensitiveCheckbox: '[data-testid="occurrence-sensitive-checkbox"]',
  occurrenceSaveButton: '[data-testid="occurrence-save-button"]',
  occurrenceCloseButton: '[data-testid="occurrence-close-button"]',

  // Kanban
  kanbanBoard: '[data-testid="kanban-board"]',
  kanbanColumn: '[data-testid="kanban-column"]',
  kanbanCard: '[data-testid="kanban-card"]',
  kanbanAddCardButton: '[data-testid="kanban-add-card-button"]',
  kanbanAddColumnButton: '[data-testid="kanban-add-column-button"]',

  // Dashboard
  dashboardCard: '[data-testid="dashboard-card"]',
  dashboardStats: '[data-testid="dashboard-stats"]',
} as const;
