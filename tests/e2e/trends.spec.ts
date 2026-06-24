import { expect, test } from "@playwright/test";

import {
  createEntryViaApi,
  registerAndConsent,
  type CreatedEntrySummary,
} from "./helpers";

test("user sees multi-day journal records aggregated in recent trends", async ({
  page,
}) => {
  await registerAndConsent(page, "trends-multi-day");

  const now = Date.now();
  const entries = [
    {
      mood: 4,
      stress: 6,
      energy: 5,
      sleepHours: 6.25,
      sleepQuality: 5,
      eventTags: ["work"],
      note: "完全虚构的趋势测试记录一。",
      occurredAt: new Date(now).toISOString(),
    },
    {
      mood: 8,
      stress: 4,
      energy: 9,
      sleepHours: 8,
      sleepQuality: 9,
      eventTags: ["sleep"],
      note: "完全虚构的趋势测试记录二。",
      occurredAt: new Date(now).toISOString(),
    },
    {
      mood: 9,
      stress: 2,
      energy: 8,
      sleepHours: 7.5,
      sleepQuality: 8,
      eventTags: ["social"],
      note: "完全虚构的两天前趋势测试记录。",
      occurredAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const created: CreatedEntrySummary[] = [];
  for (const entry of entries) {
    created.push(await createEntryViaApi(page, entry));
  }

  expect(created[0].localDate).toBe(created[1].localDate);
  expect(created[2].localDate).not.toBe(created[0].localDate);

  await page.goto("/zh-CN/trends");
  await expect(
    page.getByRole("heading", { name: "最近 7 天趋势" }),
  ).toBeVisible();
  await expect(page.getByText(/共汇总 3 条记录/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "情绪" })).toBeVisible();

  const sameDayRow = page.locator(
    `tr[data-local-date="${created[0].localDate}"]`,
  );
  await expect(sameDayRow.locator("td").nth(0)).toHaveText("6");
  await expect(sameDayRow.locator("td").nth(5)).toHaveText("2");

  const earlierRow = page.locator(
    `tr[data-local-date="${created[2].localDate}"]`,
  );
  await expect(earlierRow.locator("td").nth(0)).toHaveText("9");
  await expect(earlierRow.locator("td").nth(5)).toHaveText("1");

  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }

  await page.goto(`/zh-CN/entries/${created[0].id}`);
  await page.getByRole("button", { name: "删除记录" }).click();
  const deleteResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" &&
      response.url().endsWith(`/api/v1/entries/${created[0].id}`),
  );
  await page.getByRole("button", { name: "确认删除" }).click();
  expect((await deleteResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/zh-CN\/history$/);
  await expect(page.getByText(entries[0].note)).not.toBeVisible();

  await page.goto("/zh-CN/trends");
  const updatedSameDayRow = page.locator(
    `tr[data-local-date="${created[1].localDate}"]`,
  );
  await expect(updatedSameDayRow.locator("td").nth(0)).toHaveText("8");
  await expect(updatedSameDayRow.locator("td").nth(5)).toHaveText("1");
  await expect(page.getByText(/共汇总 2 条记录/)).toBeVisible();
});

test("trend empty and failure states remain recoverable", async ({ page }) => {
  await registerAndConsent(page, "trends-states");
  await page.goto("/zh-CN/trends");
  await expect(
    page.getByRole("heading", { name: "最近 7 天还没有记录" }),
  ).toBeVisible();
  await expect(page.getByText("无记录").first()).toBeVisible();

  let failedOnce = false;
  await page.route("**/api/v1/trends?days=7", async (route) => {
    if (!failedOnce) {
      failedOnce = true;
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "INTERNAL_ERROR" } }),
      });
      return;
    }

    await route.continue();
  });

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "无法加载趋势" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "重试" }).click();
  await expect(
    page.getByRole("heading", { name: "最近 7 天还没有记录" }),
  ).toBeVisible();
});
