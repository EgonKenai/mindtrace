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

async function expectSessionCreated(page: Page) {
  const response = await page.waitForResponse(
    (candidate) =>
      candidate.request().method() === "POST" &&
      candidate.url().endsWith("/api/v1/auth/session"),
  );

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

  await page.goto("/zh-CN/register");
  await page.getByLabel("邮箱").fill(email);
  await page.getByLabel("密码").fill(password);
  const sessionCreated = expectSessionCreated(page);
  await page.getByRole("button", { name: "注册" }).click();
  await sessionCreated;

  await expect(page).toHaveURL(/\/zh-CN\/onboarding\/consent$/);
}

export async function completeConsent(page: Page): Promise<void> {
  await page.getByLabel("我确认自己已达到所在地区的法定成年年龄。").check();
  await page.getByLabel("我已阅读并理解产品边界。").check();
  await page.getByLabel("我已阅读并接受当前隐私说明。").check();
  await page.getByLabel("我已阅读并接受当前 AI 数据处理说明。").check();
  await page.getByLabel("你的时区").fill("Asia/Tokyo");

  const consentResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().endsWith("/api/v1/account/consents"),
  );
  await page.getByRole("button", { name: "完成确认" }).click();
  expect((await consentResponse).status()).toBe(201);
  await expect(page).toHaveURL(/\/zh-CN\/today$/);
  await expect(
    page.getByRole("heading", { name: "记录此刻的状态" }),
  ).toBeVisible();
}

export async function registerAndConsent(
  page: Page,
  testLabel: string,
): Promise<void> {
  await registerWithoutConsent(page, testLabel);
  await completeConsent(page);
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
