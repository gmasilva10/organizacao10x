import { FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  // Set a cookie to signal E2E mode (server layout will allow minimal auth)
  for (const project of config.projects) {
    // Playwright does not provide direct cookie set here; tests will set it on first page
    // leaving placeholder for completeness
  }
}

export default globalSetup
