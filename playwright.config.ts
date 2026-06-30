import { defineConfig, devices } from "@playwright/test";

const useBundledChromium =
  process.env.PLAYWRIGHT_USE_BUNDLED_CHROMIUM === "true";
const isCi = process.env.CI === "true";
const hasExternalE2eServer =
  process.env.MINDTRACE_EXTERNAL_E2E_SERVER === "true";
const channel = useBundledChromium ? undefined : "chrome";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  timeout: 90_000,
  workers: 1,
  reporter: isCi ? [["list"], ["./tests/e2e/safe-ci-reporter.ts"]] : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    ...(channel ? { channel } : {}),
    screenshot: isCi ? "off" : "only-on-failure",
    trace: isCi ? "off" : "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chrome",
      use: {
        ...devices["Desktop Chrome"],
        ...(channel ? { channel } : {}),
      },
    },
  ],
  webServer: hasExternalE2eServer
    ? undefined
    : {
        command: "node scripts/e2e-next-server.mjs",
        env: {
          APP_ORIGIN: "http://127.0.0.1:3000",
          FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
          FIREBASE_PROJECT_ID: "mindtrace-demo",
          FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
          NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
          NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app-id",
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "localhost",
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: "mindtrace-demo",
          NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
        },
        reuseExistingServer: false,
        timeout: 120_000,
        url: "http://127.0.0.1:3000/zh-CN/login",
      },
});
