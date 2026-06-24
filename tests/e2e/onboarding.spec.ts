import { expect, test, type Page } from "@playwright/test";

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

test("new user completes the phase 1 authentication and consent flow", async ({
  page,
}) => {
  const email = `fictional-e2e-${Date.now()}@example.test`;
  const password = "Fictional-pass-2026";

  await page.goto("/zh-CN/product-boundary");
  await expect(page.getByRole("heading", { name: "产品边界" })).toBeVisible();

  await page.goto("/zh-CN/safety");
  await expect(
    page.getByRole("heading", { name: "危机与安全资源" }),
  ).toBeVisible();

  await page.goto("/zh-CN/register");
  await page.getByLabel("邮箱").fill(email);
  await page.getByLabel("密码").fill(password);
  const registrationSession = expectSessionCreated(page);
  await page.getByRole("button", { name: "注册" }).click();
  await registrationSession;

  await expect(
    page.getByRole("heading", { name: "确认产品边界与隐私" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/zh-CN\/onboarding\/consent$/);

  await page.goto("/zh-CN/settings");
  const firstLogout = page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" &&
      response.url().endsWith("/api/v1/auth/session"),
  );
  await page.getByRole("button", { name: "退出登录" }).click();
  expect((await firstLogout).status()).toBe(200);
  await expect(page).toHaveURL(/\/zh-CN\/login$/);

  await page.getByLabel("邮箱").fill(email);
  await page.getByLabel("密码").fill(password);
  const loginSession = expectSessionCreated(page);
  await page.getByRole("button", { name: "登录" }).click();
  await loginSession;
  await expect(
    page.getByRole("heading", { name: "确认产品边界与隐私" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/zh-CN\/onboarding\/consent$/);

  await page.goto("/zh-CN/today");
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

  await expect(
    page.getByRole("heading", { name: "记录此刻的状态" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/zh-CN\/today$/);

  const protectedResponse = await page.request.get("/api/v1/personal/status");
  expect(protectedResponse.ok()).toBe(true);

  await page.goto("/zh-CN/settings");
  const finalLogout = page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" &&
      response.url().endsWith("/api/v1/auth/session"),
  );
  await page.getByRole("button", { name: "退出登录" }).click();
  expect((await finalLogout).status()).toBe(200);
  await expect
    .poll(async () =>
      (await page.context().cookies()).some(
        (cookie) => cookie.name === "mindtrace_session",
      ),
    )
    .toBe(false);
  await expect(page).toHaveURL(/\/zh-CN\/login$/);

  await page.goto("/zh-CN/today");
  await expect(page).toHaveURL(/\/zh-CN\/login$/);

  await page.goto("/zh-CN/history");
  await expect(page).toHaveURL(/\/zh-CN\/login$/);

  await page.goto("/zh-CN/entries/fictional-missing-entry");
  await expect(page).toHaveURL(/\/zh-CN\/login$/);

  await page.goto("/zh-CN/product-boundary");
  await expect(page.getByRole("heading", { name: "产品边界" })).toBeVisible();

  await page.goto("/zh-CN/safety");
  await expect(
    page.getByRole("heading", { name: "危机与安全资源" }),
  ).toBeVisible();
});
