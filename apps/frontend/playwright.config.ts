import { defineConfig } from '@playwright/test'

// Testes visuais do tema da lojinha. A API é toda mockada (e2e/tema.spec.ts), então não precisa de backend nem de banco.
const PORT = 5199

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    // O api.test nunca é resolvido de verdade: toda requisição pra ele é interceptada pelo teste.
    env: { VITE_API_URL: 'http://api.test' },
  },
})
