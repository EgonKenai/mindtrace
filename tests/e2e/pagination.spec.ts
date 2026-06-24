import { expect, test } from "@playwright/test";

import { createEntryViaApi, registerAndConsent } from "./helpers";

test("history appends a stable second page without replacing existing entries", async ({
  page,
}) => {
  await registerAndConsent(page, "history-pagination");
  const baseTime = new Date("2026-06-24T08:00:00.000Z").getTime();

  for (let index = 0; index < 12; index += 1) {
    await createEntryViaApi(page, {
      mood: (index % 10) + 1,
      stress: 5,
      energy: 6,
      sleepHours: 7.5,
      sleepQuality: 8,
      eventTags: ["study"],
      note: `完全虚构的分页记录-${index.toString().padStart(2, "0")}`,
      occurredAt: new Date(baseTime + index * 60_000).toISOString(),
    });
  }

  await page.goto("/zh-CN/history");
  const cards = page.locator(".entry-card");
  await expect(cards).toHaveCount(10);
  await expect(page.getByText("完全虚构的分页记录-11")).toBeVisible();
  await expect(page.getByText("完全虚构的分页记录-00")).not.toBeVisible();

  await page.getByRole("button", { name: "加载更多" }).click();
  await expect(cards).toHaveCount(12);
  await expect(page.getByText("完全虚构的分页记录-11")).toBeVisible();
  await expect(page.getByText("完全虚构的分页记录-00")).toBeVisible();
  await expect(page.getByText("已经显示全部记录。")).toBeVisible();
});
