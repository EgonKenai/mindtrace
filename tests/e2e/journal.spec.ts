import { expect, test } from "@playwright/test";

import { registerAndConsent } from "./helpers";

test("user creates, views, edits, and deletes a fictional journal entry", async ({
  page,
}) => {
  await registerAndConsent(page, "journal-crud");

  await page.getByRole("spinbutton", { name: /^情绪/ }).fill("7");
  await page.getByRole("spinbutton", { name: /^压力/ }).fill("3");
  await page.getByRole("spinbutton", { name: /^精力/ }).fill("8");
  await page.getByRole("spinbutton", { name: /^睡眠时长/ }).fill("6.5");
  await page.getByRole("spinbutton", { name: /^睡眠质量/ }).fill("7");
  await page.getByLabel("工作", { exact: true }).check();
  await page.getByLabel("睡眠", { exact: true }).check();
  await page
    .getByRole("textbox", { name: /^文字记录/ })
    .fill("完全虚构的桌面端日记测试内容。");

  const createResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().endsWith("/api/v1/entries"),
  );
  await page.getByRole("button", { name: "保存记录" }).click();
  expect((await createResponse).status()).toBe(201);
  await expect(page.getByRole("heading", { name: "记录已保存" })).toBeVisible();

  await page.getByRole("link", { name: "查看历史" }).click();
  await expect(page).toHaveURL(/\/zh-CN\/history$/);
  await expect(page.getByText("完全虚构的桌面端日记测试内容。")).toBeVisible();

  await page.getByRole("link", { name: /查看这条记录/ }).click();
  await expect(page).toHaveURL(/\/zh-CN\/entries\/[^/]+$/);
  await expect(page.getByText("完全虚构的桌面端日记测试内容。")).toBeVisible();
  await expect(page.getByText("工作", { exact: true })).toBeVisible();
  await expect(page.getByText("睡眠", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "编辑记录" }).click();
  await page.getByRole("spinbutton", { name: /^情绪/ }).fill("8");
  await page.getByLabel("睡眠", { exact: true }).uncheck();
  await page.getByLabel("社交", { exact: true }).check();
  await page
    .getByRole("textbox", { name: /^文字记录/ })
    .fill("完全虚构且已经修改的桌面端日记测试内容。");

  const updateResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      /\/api\/v1\/entries\/[^/]+$/.test(response.url()),
  );
  await page.getByRole("button", { name: "保存修改" }).click();
  expect((await updateResponse).status()).toBe(200);
  await expect(page.getByText("修改已保存")).toBeVisible();
  await expect(
    page.getByText("完全虚构且已经修改的桌面端日记测试内容。"),
  ).toBeVisible();
  await expect(page.getByText("社交", { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "记录详情" })
      .getByText("版本", { exact: true })
      .locator(".."),
  ).toContainText("2");

  await page.getByRole("link", { name: "返回历史记录" }).click();
  await expect(page).toHaveURL(/\/zh-CN\/history$/);
  await expect(
    page.getByText("完全虚构且已经修改的桌面端日记测试内容。"),
  ).toBeVisible();

  await page.getByRole("link", { name: /查看这条记录/ }).click();
  await page.getByRole("button", { name: "删除记录" }).click();
  await expect(
    page.getByRole("heading", { name: "确认删除这条记录" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "确认删除这条记录" }),
  ).not.toBeVisible();

  await page.getByRole("button", { name: "删除记录" }).click();
  await page.getByRole("button", { name: "取消" }).click();
  await expect(
    page.getByRole("heading", { name: "确认删除这条记录" }),
  ).not.toBeVisible();

  await page.getByRole("button", { name: "删除记录" }).click();
  const deleteResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" &&
      /\/api\/v1\/entries\/[^/]+$/.test(response.url()),
  );
  await page.getByRole("button", { name: "确认删除" }).click();
  expect((await deleteResponse).status()).toBe(200);

  await expect(page).toHaveURL(/\/zh-CN\/history$/);
  await expect(page.getByRole("heading", { name: "还没有记录" })).toBeVisible();
  await expect(
    page.getByText("完全虚构且已经修改的桌面端日记测试内容。"),
  ).not.toBeVisible();
});

test("unauthenticated users are redirected from journal pages", async ({
  page,
}) => {
  for (const path of [
    "/zh-CN/today",
    "/zh-CN/history",
    "/zh-CN/trends",
    "/zh-CN/entries/fictional-missing-entry",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/zh-CN\/login$/);
  }
});

test("mobile user completes a fictional journal entry flow at 360px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await registerAndConsent(page, "journal-mobile");

  await page.getByRole("spinbutton", { name: /^情绪/ }).fill("6");
  await page.getByRole("spinbutton", { name: /^压力/ }).fill("4");
  await page.getByRole("spinbutton", { name: /^精力/ }).fill("7");
  await page.getByRole("spinbutton", { name: /^睡眠时长/ }).fill("7.25");
  await page.getByRole("spinbutton", { name: /^睡眠质量/ }).fill("8");
  await page.getByLabel("社交", { exact: true }).check();
  await page
    .getByRole("textbox", { name: /^文字记录/ })
    .fill("完全虚构的手机端日记测试内容。");

  const createResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().endsWith("/api/v1/entries"),
  );
  await page.getByRole("button", { name: "保存记录" }).click();
  expect((await createResponse).status()).toBe(201);
  await expect(page.getByRole("heading", { name: "记录已保存" })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  await page.getByRole("link", { name: "查看历史" }).click();
  await expect(page.getByText("完全虚构的手机端日记测试内容。")).toBeVisible();

  await page.getByRole("link", { name: /查看这条记录/ }).click();
  await page.getByRole("button", { name: "编辑记录" }).click();
  await page.getByRole("spinbutton", { name: /^情绪/ }).fill("9");
  await page
    .getByRole("textbox", { name: /^文字记录/ })
    .fill("完全虚构且已在手机端修改的日记测试内容。");
  await page.getByRole("button", { name: "保存修改" }).click();
  await expect(
    page.getByText("完全虚构且已在手机端修改的日记测试内容。"),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "记录详情" })
      .getByText("版本", { exact: true })
      .locator(".."),
  ).toContainText("2");

  await page.getByRole("button", { name: "删除记录" }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "确认删除这条记录" }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "删除记录" }).click();
  await page.getByRole("button", { name: "确认删除" }).click();
  await expect(page).toHaveURL(/\/zh-CN\/history$/);
  await expect(page.getByRole("heading", { name: "还没有记录" })).toBeVisible();

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
