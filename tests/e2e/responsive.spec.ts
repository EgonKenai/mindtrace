import { expect, test } from "@playwright/test";

import { createEntryViaApi, registerAndConsent } from "./helpers";

test("stage 2 pages remain responsive with extreme fictional content", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await registerAndConsent(page, "responsive-extremes");
  const entry = await createEntryViaApi(page, {
    mood: 10,
    stress: 1,
    energy: 10,
    sleepHours: 24,
    sleepQuality: 1,
    eventTags: ["work", "study", "family", "social", "travel"],
    note: "长".repeat(5000),
    occurredAt: new Date().toISOString(),
  });

  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });

    for (const path of [
      "/zh-CN/today",
      "/zh-CN/history",
      `/zh-CN/entries/${entry.id}`,
      "/zh-CN/trends",
    ]) {
      const trendsResponse =
        path === "/zh-CN/trends"
          ? page.waitForResponse(
              (response) =>
                response.url().endsWith("/api/v1/trends?days=7") &&
                response.request().method() === "GET",
            )
          : null;

      await page.goto(path);
      await expect(page.locator("main")).toBeVisible();

      if (trendsResponse) {
        expect((await trendsResponse).status()).toBe(200);
        await expect(
          page.getByRole("region", {
            name: "最近 7 天趋势数据表，可横向滚动",
          }),
        ).toBeVisible();
      }

      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }

    const tableDimensions = await page.evaluate(() => {
      const tableRegion = document.querySelector<HTMLElement>(
        ".trend-table-scroll",
      );

      return tableRegion
        ? {
            clientWidth: tableRegion.clientWidth,
            pageWidth: document.documentElement.scrollWidth,
            scrollWidth: tableRegion.scrollWidth,
          }
        : null;
    });
    expect(tableDimensions).not.toBeNull();
    expect(tableDimensions?.pageWidth).toBeLessThanOrEqual(width);
    if (width === 360) {
      expect(tableDimensions?.scrollWidth).toBeGreaterThan(
        tableDimensions?.clientWidth ?? 0,
      );
    }
  }

  await page.goto("/zh-CN/today");
  const unlabeledControls = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >("main input, main textarea, main select"),
    )
      .filter((control) => control.type !== "hidden")
      .filter((control) => {
        const labels = control.labels;
        return !labels || labels.length === 0;
      })
      .map((control) => control.name || control.id || control.type),
  );

  expect(unlabeledControls).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
