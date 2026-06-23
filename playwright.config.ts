import { defineConfig, devices } from "@playwright/test";

const firebaseEnvironment = {
  APP_ORIGIN: "http://127.0.0.1:3000",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIREBASE_PROJECT_ID: "mindtrace-demo",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
  NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app-id",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "localhost",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "mindtrace-demo",
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    channel: "chrome",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chrome",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
  ],
  webServer: [
    {
      command:
        "firebase emulators:start --project mindtrace-demo --only auth,firestore",
      env: firebaseEnvironment,
      reuseExistingServer: true,
      timeout: 120_000,
      url: "http://127.0.0.1:4000",
    },
    {
      command: "next dev",
      env: firebaseEnvironment,
      reuseExistingServer: true,
      timeout: 120_000,
      url: "http://127.0.0.1:3000/zh-CN/login",
    },
  ],
});
