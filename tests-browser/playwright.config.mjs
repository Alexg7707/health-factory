import { defineConfig } from '@playwright/test';

export default defineConfig({
  testMatch: '*.spec.mjs',
  outputDir: '../test-results/browser',
  workers: 2,
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: 'http://127.0.0.1:4189',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH },
    timezoneId: 'UTC',
  },
  webServer: {
    command: 'node serve.mjs',
    url: 'http://127.0.0.1:4189',
  },
});
