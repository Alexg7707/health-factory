import { defineConfig } from '@playwright/test';

export default defineConfig({
  testMatch: '*.spec.mjs',
  outputDir: '../test-results/browser',
  workers: 2,
  forbidOnly: !!process.env.CI,
  globalSetup: './serve.mjs',
  use: {
    launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH },
    timezoneId: 'UTC',
  },
});
