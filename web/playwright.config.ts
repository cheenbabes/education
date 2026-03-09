import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3456",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npx next dev -p 3456",
    port: 3456,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
