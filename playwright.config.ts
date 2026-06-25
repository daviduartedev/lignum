import { defineConfig, devices } from "@playwright/test";

/** Usar o mesmo host que o `next dev` (evita mismatch de cookies entre localhost e 127.0.0.1). */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "e2e",
  /** Vários specs partilham estado na BD; paralelismo causa corridas. */
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["html"], ["github"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts$/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/admin.json",
      },
      dependencies: ["setup"],
      testMatch: /.*\.spec\.ts$/,
    },
  ],
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: baseURL,
    /** Servidor novo garante `RATE_LIMIT_DISABLED` (suites longas esgotam `?all=1`). Com `PLAYWRIGHT_REUSE_SERVER=1`, reutiliza servidor já na porta (ex.: `next dev` local). */
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      RATE_LIMIT_DISABLED: "1",
    },
  },
});
