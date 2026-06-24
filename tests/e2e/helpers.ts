import { expect, type Page } from "@playwright/test";

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

export async function registerAndConsent(
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
