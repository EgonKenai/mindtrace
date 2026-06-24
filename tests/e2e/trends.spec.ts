import { expect, test } from "@playwright/test";

import { registerAndConsent } from "./helpers";

interface CreatedEntry {
  localDate: string;
}

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

  const created = await page.evaluate(async (inputs) => {
    const results: CreatedEntry[] = [];

    for (const input of inputs) {
      const response = await fetch("/api/v1/entries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`Entry creation failed with ${response.status}`);
      }

      const payload = (await response.json()) as {
        data: { entry: CreatedEntry };
      };
      results.push(payload.data.entry);
    }

    return results;
  }, entries);

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
