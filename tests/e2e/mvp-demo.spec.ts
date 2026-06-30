import { expect, test, type Page } from "@playwright/test";

import { zhCN } from "@/i18n/messages/zh-CN";
import { createEntryViaApi, registerAndConsent } from "./helpers";

async function expectNoPageOverflow(page: Page): Promise<void> {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test("MVP demo path explains core flow and keeps AI optional on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await registerAndConsent(page, "mvp-demo");

  const entry = await createEntryViaApi(page, {
    energy: 4,
    eventTags: ["study", "sleep"],
    mood: 6,
    note: "完全虚构的演示记录：今天完成了学习任务，下午有点累，晚上准备早点休息。",
    occurredAt: "2026-06-30T10:30:00.000Z",
    sleepHours: 6.5,
    sleepQuality: 5,
    stress: 5,
  });

  await page.goto("/zh-CN");
  await expect(
    page.getByRole("heading", { name: zhCN.home.title }),
  ).toBeVisible();
  await expect(page.getByText(zhCN.home.aiBoundaryTitle)).toBeVisible();
  await expect(
    page.getByRole("link", { name: zhCN.home.primaryAction }),
  ).toHaveAttribute("href", "/zh-CN/today");
  await expectNoPageOverflow(page);

  await page.getByRole("link", { name: zhCN.navigation.today }).first().click();
  await expect(
    page.getByRole("heading", { name: zhCN.journal.today.title }),
  ).toBeVisible();

  await page.goto("/zh-CN/history");
  await expect(
    page.getByRole("heading", { name: zhCN.journal.history.title }),
  ).toBeVisible();
  await expect(page.getByText("完全虚构的演示记录").first()).toBeVisible();

  await page.goto("/zh-CN/trends");
  await expect(
    page.getByRole("heading", { name: zhCN.trends.title }),
  ).toBeVisible();

  await page.goto("/zh-CN/long-term");
  await expect(
    page.getByRole("heading", { name: zhCN.longTerm.title }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: zhCN.longTerm.insights.title }),
  ).toBeVisible();
  await expect(page.getByText(zhCN.longTerm.insights.disclaimer)).toBeVisible();

  await page.goto("/zh-CN/plans");
  await expect(
    page.getByRole("heading", { name: zhCN.plans.title }),
  ).toBeVisible();
  await page.getByLabel(zhCN.plans.form.titleLabel).fill("完全虚构的演示计划");
  await page
    .getByLabel(zhCN.plans.form.descriptionLabel)
    .fill("用于演示的手动计划，不由 AI 自动创建。");
  const createPlanResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().endsWith("/api/v1/plans"),
  );
  await page.getByRole("button", { name: zhCN.plans.actions.create }).click();
  expect((await createPlanResponse).status()).toBe(201);
  await expect(
    page.getByRole("heading", { name: "完全虚构的演示计划" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: zhCN.plans.suggestions.title }),
  ).toBeVisible();
  await expect(page.getByText(zhCN.plans.suggestions.disclaimer)).toBeVisible();

  let feedbackRequests = 0;
  await page.route("**/api/v1/entries/*/feedback", async (route) => {
    feedbackRequests += 1;
    await route.fallback();
  });
  await page.goto(`/zh-CN/entries/${entry.id}`);
  await page
    .getByRole("button", { name: zhCN.aiFeedback.actions.generate })
    .click();
  await expect(
    page.getByRole("dialog", { name: zhCN.aiFeedback.consent.title }),
  ).toBeVisible();
  await expect(page.getByText(zhCN.aiFeedback.consent.optional)).toBeVisible();
  await page
    .getByRole("button", { name: zhCN.aiFeedback.consent.decline })
    .click();
  await expect(
    page.getByText(zhCN.aiFeedback.consent.declinedStatus),
  ).toBeVisible();
  expect(feedbackRequests).toBe(0);
  await expectNoPageOverflow(page);

  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 820 });
    for (const path of [
      "/zh-CN",
      "/zh-CN/today",
      "/zh-CN/history",
      "/zh-CN/trends",
      "/zh-CN/long-term",
      "/zh-CN/plans",
    ]) {
      await page.goto(path);
      await expect(page.locator("main")).toBeVisible();
      await expectNoPageOverflow(page);
    }
  }
});
