import { expect, test } from "@playwright/test";

import { en } from "@/i18n/messages/en";
import { zhCN } from "@/i18n/messages/zh-CN";

interface TodayJournalCopy {
  journal: {
    actions: {
      submit: string;
    };
    errors: {
      eventTags: string;
    };
    eventTags: {
      study: string;
    };
    success: {
      body: string;
      title: string;
    };
  };
}

const chineseTextPattern = /[\u3400-\u9fff]/;

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

async function expectTodayValidationAndSuccess(
  page: import("@playwright/test").Page,
  messages: TodayJournalCopy,
  tagName: string,
): Promise<void> {
  await page
    .getByRole("button", { name: messages.journal.actions.submit })
    .click();
  await expect(page.getByText(messages.journal.errors.eventTags)).toBeVisible();

  await page.getByLabel(tagName, { exact: true }).check();
  const createResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/v1/entries",
  );
  await page
    .getByRole("button", { name: messages.journal.actions.submit })
    .click();
  expect((await createResponse).status()).toBe(201);

  await expect(
    page.getByRole("heading", { name: messages.journal.success.title }),
  ).toBeVisible();
  await expect(page.getByText(messages.journal.success.body)).toBeVisible();
}

async function expectMainHasNoChineseText(
  page: import("@playwright/test").Page,
): Promise<void> {
  const mainText = await page.locator("main").innerText();
  expect(mainText).not.toMatch(chineseTextPattern);
}

test.describe("language switcher", () => {
  test("root path defaults to English", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);

    await expect(
      page.getByRole("heading", { name: en.landing.title }),
    ).toBeVisible();
    const primaryActions = page.getByLabel(en.landing.actionsLabel);
    await expect(
      primaryActions.getByRole("link", { name: en.landing.startFree }),
    ).toHaveAttribute("href", "/en/register");
    await expect(
      primaryActions.getByRole("link", { name: en.landing.login }),
    ).toHaveAttribute("href", "/en/login");
  });

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

  test("English today page shows English validation and success copy", async ({
    page,
  }) => {
    await registerForLocale(page, "en");
    await completeOnboardingWithLanguage(page, "en");

    await expectTodayValidationAndSuccess(page, en, en.journal.eventTags.study);
    await expectMainHasNoChineseText(page);
  });

  test("English journal, trend, and long-term pages use English copy and dates", async ({
    page,
  }) => {
    await registerForLocale(page, "en");
    await completeOnboardingWithLanguage(page, "en");
    await expectTodayValidationAndSuccess(page, en, en.journal.eventTags.study);

    await page
      .getByRole("link", { name: en.journal.actions.viewHistory })
      .click();
    await expect(page).toHaveURL(/\/en\/history$/);
    await expectMainHasNoChineseText(page);
    await expect(page.locator(".entry-local-date").first()).not.toContainText(
      "年",
    );

    await page
      .getByRole("link", { name: en.journal.actions.viewEntry })
      .click();
    await expect(page).toHaveURL(/\/en\/entries\/[^/]+$/);
    await expectMainHasNoChineseText(page);
    await page.getByRole("button", { name: en.journal.actions.delete }).click();
    await expect(
      page.getByRole("heading", { name: en.journal.deleteDialog.title }),
    ).toBeVisible();
    await expect(page.getByText(en.journal.deleteDialog.body)).toBeVisible();
    const deleteDialog = page.getByRole("dialog", {
      name: en.journal.deleteDialog.title,
    });
    await expect(
      deleteDialog.getByRole("button", {
        name: en.journal.deleteDialog.confirm,
      }),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    await page.goto("/en/trends");
    await expect(page.getByText("Range 1–10 pts").first()).toBeVisible();
    await expectMainHasNoChineseText(page);

    await page.goto("/en/long-term");
    await expect(
      page.getByText(
        "This window has many missing dates, so the summary is best used as a very rough review.",
      ),
    ).toBeVisible();
    await expectMainHasNoChineseText(page);
  });

  test("English plans page shows English plan and action status labels", async ({
    page,
  }) => {
    await registerForLocale(page, "en");
    await completeOnboardingWithLanguage(page, "en");

    await page.goto("/en/plans");
    await page
      .getByLabel(en.plans.form.titleLabel)
      .fill("Fictional English plan");
    await page
      .getByLabel(en.plans.form.descriptionLabel)
      .fill("A fictional plan used only for English status labels.");

    const createPlanResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname === "/api/v1/plans",
    );
    await page.getByRole("button", { name: en.plans.actions.create }).click();
    expect((await createPlanResponse).status()).toBe(201);

    await expect(
      page.getByRole("heading", { name: "Fictional English plan" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        en.plans.meta(en.plans.statuses.active, en.plans.frequencies.none),
      ),
    ).toBeVisible();
    await expect(page.locator("main")).not.toContainText(
      /进行中|已暂停|已完成|已放弃|待完成|已跳过|不提醒|每日|每周/,
    );

    const updatePlanResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        /\/api\/v1\/plans\/[^/]+$/.test(new URL(response.url()).pathname),
    );
    await page.getByRole("button", { name: en.plans.statuses.paused }).click();
    expect((await updatePlanResponse).status()).toBe(200);
    await expect(
      page.getByText(
        en.plans.meta(en.plans.statuses.paused, en.plans.frequencies.none),
      ),
    ).toBeVisible();

    await page
      .getByLabel(en.plans.form.actionTitleLabel)
      .fill("Fictional English action");
    const createActionResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        /\/api\/v1\/plans\/[^/]+\/actions$/.test(
          new URL(response.url()).pathname,
        ),
    );
    await page
      .getByRole("button", { name: en.plans.actions.addAction })
      .click();
    expect((await createActionResponse).status()).toBe(201);
    await expect(
      page.getByText(
        `Fictional English action - ${en.plans.actionStatuses.todo}`,
      ),
    ).toBeVisible();

    const completeActionResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        /\/api\/v1\/plans\/[^/]+\/actions\/[^/]+$/.test(
          new URL(response.url()).pathname,
        ),
    );
    await page
      .getByRole("button", { name: en.plans.actions.completeAction })
      .click();
    expect((await completeActionResponse).status()).toBe(200);
    await expect(
      page.getByText(
        `Fictional English action - ${en.plans.actionStatuses.done}`,
      ),
    ).toBeVisible();
    await expect(page.locator("main")).not.toContainText(
      /进行中|已暂停|已完成|已放弃|待完成|已跳过|不提醒|每日|每周/,
    );
  });

  test("Chinese today page keeps Chinese validation and success copy", async ({
    page,
  }) => {
    await registerForLocale(page, "zh-CN");
    await completeOnboardingWithLanguage(page, "zh-CN");

    await expectTodayValidationAndSuccess(
      page,
      zhCN,
      zhCN.journal.eventTags.study,
    );
  });
});
