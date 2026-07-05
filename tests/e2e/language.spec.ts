import { expect, test } from "@playwright/test";

async function registerForLocale(
  page: import("@playwright/test").Page,
  locale: "zh-CN" | "en",
): Promise<void> {
  const email = `fictional-language-${locale}-${Date.now()}@example.test`;

  await page.goto(`/${locale}/register`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("Fictional-pass-2026");

  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.request().method() === "POST" &&
        new URL(candidate.url()).pathname === "/api/v1/auth/session",
    ),
    page.locator("form").getByRole("button").click(),
  ]);

  expect(response.status()).toBe(200);
  await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding/consent$`));
}

async function completeOnboardingWithLanguage(
  page: import("@playwright/test").Page,
  locale: "zh-CN" | "en",
): Promise<void> {
  await page.locator('input[name="adultConfirmed"]').check();
  await page.locator('input[name="productBoundaryAccepted"]').check();
  await page.locator('input[name="privacyAccepted"]').check();
  await page.locator('select[name="locale"]').selectOption(locale);
  await page.locator('input[name="timeZone"]').fill("Asia/Tokyo");

  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.request().method() === "POST" &&
        new URL(candidate.url()).pathname === "/api/v1/account/consents",
    ),
    page.locator("form").getByRole("button").click(),
  ]);

  expect(response.status()).toBe(201);
  await expect(page).toHaveURL(new RegExp(`/${locale}/today$`));
}

test.describe("language switcher", () => {
  test("preserves the semantic path between Chinese and English", async ({
    page,
  }) => {
    await page.goto("/zh-CN/product-boundary");
    await expect(page.getByRole("link", { name: "English" })).toBeVisible();

    await page.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/product-boundary$/);
    await expect(
      page.getByRole("heading", { name: "Product boundary" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "\u4e2d\u6587" }).click();
    await expect(page).toHaveURL(/\/zh-CN\/product-boundary$/);
  });

  test("serves the English login page", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "\u4e2d\u6587" }),
    ).toBeVisible();
  });

  test("keeps Chinese selected on Chinese onboarding", async ({ page }) => {
    await registerForLocale(page, "zh-CN");
    await expect(page.locator('select[name="locale"]')).toHaveValue("zh-CN");

    await completeOnboardingWithLanguage(page, "zh-CN");
    await expect(page.locator("main h1")).toBeVisible();
  });

  test("can switch from Chinese onboarding to English after consent", async ({
    page,
  }) => {
    await registerForLocale(page, "zh-CN");
    await completeOnboardingWithLanguage(page, "en");

    await expect(
      page.getByRole("heading", { name: "Record how things feel right now" }),
    ).toBeVisible();
  });

  test("keeps English selected on English onboarding", async ({ page }) => {
    await registerForLocale(page, "en");
    await expect(
      page.getByRole("heading", {
        name: "Confirm product boundary and privacy",
      }),
    ).toBeVisible();
    await expect(page.locator('select[name="locale"]')).toHaveValue("en");

    await completeOnboardingWithLanguage(page, "en");
    await expect(
      page.getByRole("heading", { name: "Record how things feel right now" }),
    ).toBeVisible();
  });
});
