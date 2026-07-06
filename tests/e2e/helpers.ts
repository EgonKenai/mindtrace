import { expect, type Page } from "@playwright/test";

export interface FictionalEntryInput {
  energy: number;
  eventTags: string[];
  mood: number;
  note: string;
  occurredAt: string;
  sleepHours: number;
  sleepQuality: number;
  stress: number;
}

export interface CreatedEntrySummary {
  id: string;
  localDate: string;
  revision: number;
}

function hasApiPath(candidateUrl: string, pathname: string): boolean {
  return new URL(candidateUrl).pathname === pathname;
}

async function clearBrowserAuthState(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/zh-CN/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();

    const databaseFactory = indexedDB as IDBFactory & {
      databases?: () => Promise<Array<{ name?: string }>>;
    };
    const databases = await databaseFactory.databases?.();

    await Promise.all(
      (databases ?? [])
        .map((database) => database.name)
        .filter((name): name is string => Boolean(name))
        .map(
          (name) =>
            new Promise<void>((resolve) => {
              const request = indexedDB.deleteDatabase(name);
              request.onerror = () => resolve();
              request.onsuccess = () => resolve();
              request.onblocked = () => resolve();
            }),
        ),
    );
  });
  await page.context().clearCookies();
}

async function expectSessionCreated(
  page: Page,
  triggerSessionRequest: () => Promise<unknown>,
) {
  const [response] = await Promise.all([
    page.waitForResponse((candidate) => {
      const request = candidate.request();

      return (
        request.method() === "POST" &&
        hasApiPath(candidate.url(), "/api/v1/auth/session")
      );
    }),
    triggerSessionRequest(),
  ]);

  expect(response.status()).toBe(200);
  await expect
    .poll(async () =>
      (await page.context().cookies()).some(
        (cookie) => cookie.name === "mindtrace_session",
      ),
    )
    .toBe(true);
}

export async function registerWithoutConsent(
  page: Page,
  testLabel: string,
): Promise<void> {
  const email = `fictional-${testLabel}-${Date.now()}@example.test`;
  const password = "Fictional-pass-2026";

  await clearBrowserAuthState(page);
  await page.goto("/zh-CN/register");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await expectSessionCreated(page, () =>
    page.locator("form").getByRole("button").click(),
  );

  await expect(page).toHaveURL(/\/zh-CN\/onboarding\/consent$/);
}

export async function completeConsent(page: Page): Promise<void> {
  await page.locator('input[name="adultConfirmed"]').check();
  await page.locator('input[name="productBoundaryAccepted"]').check();
  await page.locator('input[name="privacyAccepted"]').check();
  await page.locator('input[name="timeZone"]').fill("Asia/Tokyo");

  const [consentResponse] = await Promise.all([
    page.waitForResponse((response) => {
      const request = response.request();

      return (
        request.method() === "POST" &&
        hasApiPath(response.url(), "/api/v1/account/consents") &&
        response.status() === 201
      );
    }),
    page.locator("form").getByRole("button").click(),
  ]);
  expect(consentResponse.status()).toBe(201);
  await expect(page).toHaveURL(/\/zh-CN\/today$/);
  await expect(page.locator("main h1")).toBeVisible();
}

export async function registerAndConsent(
  page: Page,
  testLabel: string,
): Promise<void> {
  await registerWithoutConsent(page, testLabel);
  await completeConsent(page);
}

export async function acceptAiConsent(page: Page): Promise<void> {
  const [consentResponse] = await Promise.all([
    page.waitForResponse((response) => {
      const request = response.request();

      return (
        request.method() === "POST" &&
        hasApiPath(response.url(), "/api/v1/account/ai-consent") &&
        response.status() === 200
      );
    }),
    page.locator(".ai-consent-dialog").locator(".primary-button").click(),
  ]);
  expect(consentResponse.status()).toBe(200);
}

export async function createEntryViaApi(
  page: Page,
  input: FictionalEntryInput,
): Promise<CreatedEntrySummary> {
  return page.evaluate(async (entryInput) => {
    const response = await fetch("/api/v1/entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(entryInput),
    });

    if (!response.ok) {
      throw new Error(`Entry creation failed with ${response.status}`);
    }

    const payload = (await response.json()) as {
      data: { entry: CreatedEntrySummary };
    };
    return payload.data.entry;
  }, input);
}
