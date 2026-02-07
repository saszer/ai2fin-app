/**
 * Playwright E2E Configuration — embracingearth.space
 *
 * ARCHITECTURE: Runs against the local dev server (client on :3000, API on :3001).
 * Tests critical user journeys only — auth, dashboard, transactions, bills.
 * Not a replacement for unit/integration tests, just a safety net for full-stack flows.
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Dev server startup (optional — comment out if running servers manually)
  // webServer: [
  //   {
  //     command: 'npm run start:dev',
  //     cwd: './ai2-core-app',
  //     port: 3001,
  //     reuseExistingServer: !process.env.CI,
  //   },
  //   {
  //     command: 'npm start',
  //     cwd: './ai2-core-app/client',
  //     port: 3000,
  //     reuseExistingServer: !process.env.CI,
  //   },
  // ],
});
