import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  esbuild: {
    jsxInject: `import React from 'react'`,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    css: false, // Desabilitar processamento CSS completamente
    include: ['__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/', 'tests/e2e/**', 'tests/**'],
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '*.config.ts',
        'tests/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    }
  }
})

