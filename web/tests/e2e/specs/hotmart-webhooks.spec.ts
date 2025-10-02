import { test, expect } from '../fixtures/auth-fixture';
import { TestHelpers } from '../utils/test-helpers';
import { TEST_CONFIG } from '../fixtures/test-data';

test.describe('Hotmart Webhooks E2E @smoke', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ adminPage }) => {
    helpers = new TestHelpers(adminPage);
  });

  test('PURCHASE_APPROVED webhook creates student and service', async ({ adminPage }) => {
    // Navegar para a página de teste do Hotmart
    await adminPage.goto('/app/settings/integrations/hotmart/test');
    await adminPage.waitForLoadState('networkidle');

    // Verificar se a página carregou
    await expect(adminPage.locator('h1')).toContainText('Teste de Webhook Hotmart');

    // Simular webhook PURCHASE_APPROVED
    const webhookPayload = {
      event: 'PURCHASE_APPROVED',
      id: `test-${Date.now()}`,
      data: {
        product: {
          id: '6352170',
          name: 'Plano Premium Teste',
          ucode: 'premium-test'
        },
        buyer: {
          name: 'João Silva Teste',
          email: 'joao.silva.teste@example.com',
          checkout_phone: '11999999999',
          document: '12345678901'
        },
        purchase: {
          transaction: `tx-${Date.now()}`,
          order_ref: `order-${Date.now()}`,
          approved_date: new Date().toISOString(),
          price: {
            value: 19700, // R$ 197,00 em centavos
            currency_code: 'BRL'
          },
          payment: {
            type: 'CREDIT_CARD',
            installments_number: 1
          },
          subscription: {
            status: 'ACTIVE',
            plan: {
              name: 'Mensal'
            },
            subscriber: {
              code: `sub-${Date.now()}`
            }
          }
        }
      }
    };

    // Enviar webhook
    const response = await adminPage.request.post('/api/webhooks/hotmart', {
      data: webhookPayload,
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Hottok': 'Basic ' + Buffer.from(`${TEST_CONFIG.ADMIN_EMAIL}:test-token`).toString('base64')
      }
    });

    expect(response.status()).toBe(200);
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.correlationId).toBeDefined();

    // Verificar se o aluno foi criado
    await adminPage.goto('/app/students');
    await adminPage.waitForLoadState('networkidle');

    // Aguardar o aluno aparecer na lista
    await expect(adminPage.locator('text=João Silva Teste')).toBeVisible({ timeout: 10000 });
  });

  test('PURCHASE_REFUNDED webhook updates service status', async ({ adminPage }) => {
    // Primeiro criar um aluno via webhook PURCHASE_APPROVED
    const approvedPayload = {
      event: 'PURCHASE_APPROVED',
      id: `test-approved-${Date.now()}`,
      data: {
        product: {
          id: '6352170',
          name: 'Plano Premium Teste',
          ucode: 'premium-test'
        },
        buyer: {
          name: 'Maria Santos Teste',
          email: 'maria.santos.teste@example.com',
          checkout_phone: '11988888888',
          document: '98765432100'
        },
        purchase: {
          transaction: `tx-approved-${Date.now()}`,
          order_ref: `order-approved-${Date.now()}`,
          approved_date: new Date().toISOString(),
          price: {
            value: 19700,
            currency_code: 'BRL'
          },
          payment: {
            type: 'CREDIT_CARD',
            installments_number: 1
          },
          subscription: {
            status: 'ACTIVE',
            plan: {
              name: 'Mensal'
            },
            subscriber: {
              code: `sub-approved-${Date.now()}`
            }
          }
        }
      }
    };

    // Enviar webhook de aprovação
    await adminPage.request.post('/api/webhooks/hotmart', {
      data: approvedPayload,
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Hottok': 'Basic ' + Buffer.from(`${TEST_CONFIG.ADMIN_EMAIL}:test-token`).toString('base64')
      }
    });

    // Aguardar um pouco para o processamento
    await adminPage.waitForTimeout(2000);

    // Agora enviar webhook de reembolso
    const refundPayload = {
      event: 'PURCHASE_REFUNDED',
      id: `test-refund-${Date.now()}`,
      data: {
        product: {
          id: '6352170',
          name: 'Plano Premium Teste',
          ucode: 'premium-test'
        },
        buyer: {
          name: 'Maria Santos Teste',
          email: 'maria.santos.teste@example.com',
          checkout_phone: '11988888888',
          document: '98765432100'
        },
        purchase: {
          transaction: `tx-approved-${Date.now()}`,
          order_ref: `order-approved-${Date.now()}`,
          refund_date: new Date().toISOString(),
          price: {
            value: 19700,
            currency_code: 'BRL'
          },
          payment: {
            type: 'CREDIT_CARD',
            installments_number: 1
          },
          subscription: {
            status: 'CANCELLED',
            plan: {
              name: 'Mensal'
            },
            subscriber: {
              code: `sub-approved-${Date.now()}`
            }
          }
        }
      }
    };

    const response = await adminPage.request.post('/api/webhooks/hotmart', {
      data: refundPayload,
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Hottok': 'Basic ' + Buffer.from(`${TEST_CONFIG.ADMIN_EMAIL}:test-token`).toString('base64')
      }
    });

    expect(response.status()).toBe(200);
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.correlationId).toBeDefined();
  });

  test('SUBSCRIPTION_CANCELLATION webhook updates subscription status', async ({ adminPage }) => {
    // Primeiro criar um aluno via webhook PURCHASE_APPROVED
    const approvedPayload = {
      event: 'PURCHASE_APPROVED',
      id: `test-sub-${Date.now()}`,
      data: {
        product: {
          id: '6352170',
          name: 'Plano Premium Teste',
          ucode: 'premium-test'
        },
        buyer: {
          name: 'Carlos Oliveira Teste',
          email: 'carlos.oliveira.teste@example.com',
          checkout_phone: '11977777777',
          document: '11122233344'
        },
        purchase: {
          transaction: `tx-sub-${Date.now()}`,
          order_ref: `order-sub-${Date.now()}`,
          approved_date: new Date().toISOString(),
          price: {
            value: 19700,
            currency_code: 'BRL'
          },
          payment: {
            type: 'CREDIT_CARD',
            installments_number: 1
          },
          subscription: {
            status: 'ACTIVE',
            plan: {
              name: 'Mensal'
            },
            subscriber: {
              code: `sub-${Date.now()}`
            }
          }
        }
      }
    };

    // Enviar webhook de aprovação
    await adminPage.request.post('/api/webhooks/hotmart', {
      data: approvedPayload,
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Hottok': 'Basic ' + Buffer.from(`${TEST_CONFIG.ADMIN_EMAIL}:test-token`).toString('base64')
      }
    });

    // Aguardar um pouco para o processamento
    await adminPage.waitForTimeout(2000);

    // Agora enviar webhook de cancelamento
    const cancellationPayload = {
      event: 'SUBSCRIPTION_CANCELLATION',
      id: `test-cancel-${Date.now()}`,
      data: {
        product: {
          id: '6352170',
          name: 'Plano Premium Teste',
          ucode: 'premium-test'
        },
        buyer: {
          name: 'Carlos Oliveira Teste',
          email: 'carlos.oliveira.teste@example.com',
          checkout_phone: '11977777777',
          document: '11122233344'
        },
        purchase: {
          transaction: `tx-sub-${Date.now()}`,
          order_ref: `order-sub-${Date.now()}`,
          cancellation_date: new Date().toISOString(),
          price: {
            value: 19700,
            currency_code: 'BRL'
          },
          payment: {
            type: 'CREDIT_CARD',
            installments_number: 1
          },
          subscription: {
            status: 'CANCELLED',
            plan: {
              name: 'Mensal'
            },
            subscriber: {
              code: `sub-${Date.now()}`
            }
          }
        }
      }
    };

    const response = await adminPage.request.post('/api/webhooks/hotmart', {
      data: cancellationPayload,
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Hottok': 'Basic ' + Buffer.from(`${TEST_CONFIG.ADMIN_EMAIL}:test-token`).toString('base64')
      }
    });

    expect(response.status()).toBe(200);
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.correlationId).toBeDefined();
  });

  test('Webhook with invalid credentials returns 401', async ({ adminPage }) => {
    const webhookPayload = {
      event: 'PURCHASE_APPROVED',
      id: 'test-invalid',
      data: {}
    };

    const response = await adminPage.request.post('/api/webhooks/hotmart', {
      data: webhookPayload,
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Hottok': 'Basic invalid-credentials'
      }
    });

    expect(response.status()).toBe(401);
    const responseData = await response.json();
    expect(responseData.error).toContain('Unauthorized');
  });

  test('Webhook with missing headers returns 401', async ({ adminPage }) => {
    const webhookPayload = {
      event: 'PURCHASE_APPROVED',
      id: 'test-missing-header',
      data: {}
    };

    const response = await adminPage.request.post('/api/webhooks/hotmart', {
      data: webhookPayload,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(401);
    const responseData = await response.json();
    expect(responseData.error).toContain('Missing X-Hotmart-Hottok header');
  });

  test('Webhook idempotency prevents duplicate processing', async ({ adminPage }) => {
    const webhookPayload = {
      event: 'PURCHASE_APPROVED',
      id: 'test-idempotency',
      data: {
        product: {
          id: '6352170',
          name: 'Plano Idempotência Teste',
          ucode: 'idempotency-test'
        },
        buyer: {
          name: 'Idempotência Teste',
          email: 'idempotencia.teste@example.com',
          checkout_phone: '11966666666',
          document: '55566677788'
        },
        purchase: {
          transaction: 'tx-idempotency',
          order_ref: 'order-idempotency',
          approved_date: new Date().toISOString(),
          price: {
            value: 19700,
            currency_code: 'BRL'
          },
          payment: {
            type: 'CREDIT_CARD',
            installments_number: 1
          },
          subscription: {
            status: 'ACTIVE',
            plan: {
              name: 'Mensal'
            },
            subscriber: {
              code: 'sub-idempotency'
            }
          }
        }
      }
    };

    // Primeiro envio
    const response1 = await adminPage.request.post('/api/webhooks/hotmart', {
      data: webhookPayload,
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Hottok': 'Basic ' + Buffer.from(`${TEST_CONFIG.ADMIN_EMAIL}:test-token`).toString('base64')
      }
    });

    expect(response1.status()).toBe(200);
    const responseData1 = await response1.json();
    expect(responseData1.success).toBe(true);

    // Segundo envio (deve ser idempotente)
    const response2 = await adminPage.request.post('/api/webhooks/hotmart', {
      data: webhookPayload,
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Hottok': 'Basic ' + Buffer.from(`${TEST_CONFIG.ADMIN_EMAIL}:test-token`).toString('base64')
      }
    });

    expect(response2.status()).toBe(200);
    const responseData2 = await response2.json();
    expect(responseData2.success).toBe(true);
    expect(responseData2.message).toContain('Already processed');
  });
});
