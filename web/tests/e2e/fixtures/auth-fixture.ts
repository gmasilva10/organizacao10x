import { test as base, Page } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

// Tipos para o contexto de autenticação
type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  trainerPage: Page;
};

// Fixture de autenticação que resolve o redirect loop
export const test = base.extend<AuthFixtures>({
  // Página autenticada genérica
  authenticatedPage: async ({ page }, use) => {
    // Sinalizar modo E2E para o servidor
    await page.context().addCookies([
      { name: 'e2e', value: '1', domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' }
    ]);
    // Configurar storage state para evitar redirect loop
    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-access-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      },
      {
        name: 'sb-refresh-token', 
        value: 'mock-refresh-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      },
      {
        name: 'pg.active_org',
        value: TEST_CONFIG.ORG_ID,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      }
    ]);

    // Mock da API de autenticação para evitar redirects
    await page.route('**/api/auth/**', async route => {
      const url = new URL(route.request().url());
      
      if (url.pathname === '/api/auth/resolve-org') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ orgId: TEST_CONFIG.ORG_ID, source: 'cookie' })
        });
      } else {
        await route.continue();
      }
    });

    // Mock da API de perfil para evitar redirects
    await page.route('**/api/profile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: TEST_CONFIG.ADMIN_EMAIL,
            user_metadata: { name: 'Test Admin' }
          },
          membership: {
            org_id: TEST_CONFIG.ORG_ID,
            role: 'admin'
          },
          profile: {
            full_name: 'Test Admin',
            avatar_url: null
          }
        })
      });
    });

    await use(page);
  },

  // Página com usuário admin
  adminPage: async ({ page }, use) => {
    // Sinalizar modo E2E para o servidor
    await page.context().addCookies([
      { name: 'e2e', value: '1', domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' }
    ]);
    // Configurar storage state para admin
    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-admin-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      },
      {
        name: 'pg.active_org',
        value: TEST_CONFIG.ORG_ID,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      }
    ]);

    // Mock das APIs para admin
    await page.route('**/api/auth/resolve-org', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ orgId: TEST_CONFIG.ORG_ID, source: 'cookie' })
      });
    });

    await page.route('**/api/profile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-admin-id',
            email: TEST_CONFIG.ADMIN_EMAIL,
            user_metadata: { name: 'Test Admin' }
          },
          membership: {
            org_id: TEST_CONFIG.ORG_ID,
            role: 'admin'
          },
          profile: {
            full_name: 'Test Admin',
            avatar_url: null
          }
        })
      });
    });

    await use(page);
  },

  // Página com usuário trainer
  trainerPage: async ({ page }, use) => {
    // Sinalizar modo E2E para o servidor
    await page.context().addCookies([
      { name: 'e2e', value: '1', domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' }
    ]);
    // Configurar storage state para trainer
    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-trainer-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      },
      {
        name: 'pg.active_org',
        value: TEST_CONFIG.ORG_ID,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      }
    ]);

    // Mock das APIs para trainer
    await page.route('**/api/auth/resolve-org', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ orgId: TEST_CONFIG.ORG_ID, source: 'cookie' })
      });
    });

    await page.route('**/api/profile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-trainer-id',
            email: TEST_CONFIG.TRAINER_EMAIL,
            user_metadata: { name: 'Test Trainer' }
          },
          membership: {
            org_id: TEST_CONFIG.ORG_ID,
            role: 'trainer'
          },
          profile: {
            full_name: 'Test Trainer',
            avatar_url: null
          }
        })
      });
    });

    await use(page);
  }
});

export { expect } from '@playwright/test';
