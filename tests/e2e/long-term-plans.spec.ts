import { expect, test } from "@playwright/test";

import { createEntryViaApi, registerAndConsent } from "./helpers";

test("user creates journal entries and views the long-term summary", async ({
  page,
}) => {
  await registerAndConsent(page, "long-term-summary");
  await createEntryViaApi(page, {
    energy: 6,
    eventTags: ["study", "sleep"],
    mood: 6,
    note: "完全虚构的长期摘要端到端测试记录一。",
    occurredAt: "2026-06-23T15:30:00.000Z",
    sleepHours: 6.5,
    sleepQuality: 6,
    stress: 5,
  });
  await createEntryViaApi(page, {
    energy: 8,
    eventTags: ["study"],
    mood: 8,
    note: "完全虚构的长期摘要端到端测试记录二。",
    occurredAt: "2026-06-24T10:30:00.000Z",
    sleepHours: 8,
    sleepQuality: 8,
    stress: 3,
  });

  await page.goto("/zh-CN/long-term");
  await expect(page.getByRole("heading", { name: "长期摘要" })).toBeVisible();
  await expect(page.getByText(/共汇总 2 条记录/)).toBeVisible();
  await expect(page.getByText("学习 x 2")).toBeVisible();
  await expect(
    page.getByText("完全虚构的长期摘要端到端测试记录一"),
  ).not.toBeVisible();
  await expect(
    page.getByRole("region", { name: /长期摘要缺失日期表/ }),
  ).toBeVisible();
});

test("long-term summary shows an insufficient data state safely", async ({
  page,
}) => {
  await registerAndConsent(page, "long-term-empty");

  await page.goto("/zh-CN/long-term");

  await expect(
    page.getByRole("heading", { name: "数据仍然不足" }),
  ).toBeVisible();
  await expect(page.getByText("无记录").first()).toBeVisible();
});

test("user creates a manual plan and completes an action item on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await registerAndConsent(page, "plans-mobile");

  await page.goto("/zh-CN/plans");
  await page.getByLabel("计划标题").fill("完全虚构的学习计划");
  await page.getByLabel("计划描述").fill("只用于端到端测试的手动计划。");
  const createPlanResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().endsWith("/api/v1/plans"),
  );
  await page.getByRole("button", { name: "创建计划" }).click();
  expect((await createPlanResponse).status()).toBe(201);
  await expect(
    page.getByRole("heading", { name: "完全虚构的学习计划" }),
  ).toBeVisible();

  await page.getByLabel("行动项标题").fill("完成一小段学习");
  const createActionResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      /\/api\/v1\/plans\/[^/]+\/actions$/.test(response.url()),
  );
  await page.getByRole("button", { name: "添加行动项" }).click();
  expect((await createActionResponse).status()).toBe(201);
  await expect(page.getByText("完成一小段学习 - 待完成")).toBeVisible();

  const completeActionResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      /\/api\/v1\/plans\/[^/]+\/actions\/[^/]+$/.test(response.url()),
  );
  await page.getByRole("button", { name: "标记完成" }).click();
  expect((await completeActionResponse).status()).toBe(200);
  await expect(page.getByText("完成一小段学习 - 已完成")).toBeVisible();

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
