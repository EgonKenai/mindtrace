import { expect, test } from "@playwright/test";

import { zhCN } from "@/i18n/messages/zh-CN";
import { createEntryViaApi, registerAndConsent } from "./helpers";

test("user creates journal entries and views the long-term summary", async ({
  page,
}) => {
  await registerAndConsent(page, "long-term-summary");
  const currentWindowEntryTime = new Date();
  const earlierEntryTime = new Date(
    currentWindowEntryTime.getTime() - 60 * 60 * 1000,
  );

  await createEntryViaApi(page, {
    energy: 6,
    eventTags: ["study", "sleep"],
    mood: 6,
    note: "完全虚构的长期摘要端到端测试记录一。",
    occurredAt: earlierEntryTime.toISOString(),
    sleepHours: 6.5,
    sleepQuality: 6,
    stress: 5,
  });
  await createEntryViaApi(page, {
    energy: 8,
    eventTags: ["study"],
    mood: 8,
    note: "完全虚构的长期摘要端到端测试记录二。",
    occurredAt: currentWindowEntryTime.toISOString(),
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

  const insightResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().endsWith("/api/v1/long-term/insights"),
  );
  await page
    .getByRole("button", { name: zhCN.longTerm.insights.generate })
    .click();
  expect((await insightResponse).status()).toBe(200);
  await expect(
    page.getByText(zhCN.longTerm.insights.insufficientData),
  ).toBeVisible();
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

test("user handles AI plan suggestion consent, save, and dismiss flow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await registerAndConsent(page, "plan-suggestion-ui");
  await createEntryViaApi(page, {
    energy: 6,
    eventTags: ["study", "sleep"],
    mood: 6,
    note: "完全虚构的计划建议端到端测试记录。",
    occurredAt: "2026-06-24T15:30:00.000Z",
    sleepHours: 6.5,
    sleepQuality: 6,
    stress: 5,
  });

  await page.goto("/zh-CN/plans");
  const consentResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().endsWith("/api/v1/plans/suggestions"),
  );
  await page
    .getByRole("button", { name: zhCN.plans.suggestions.generate })
    .click();
  expect((await consentResponse).status()).toBe(403);
  await expect(
    page.getByText(zhCN.plans.suggestions.consentRequired),
  ).toBeVisible();

  await page.evaluate(async () => {
    const response = await fetch("/api/v1/account/ai-consent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accepted: true, locale: "zh-CN" }),
    });

    if (!response.ok) {
      throw new Error(`AI consent failed with ${response.status}`);
    }
  });

  let suggestionCounter = 0;
  await page.route("**/api/v1/plans/suggestions", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    suggestionCounter += 1;
    const id =
      suggestionCounter === 1
        ? "suggestion-save-e2e"
        : "suggestion-dismiss-e2e";
    await route.fulfill({
      contentType: "application/json",
      status: 200,
      body: JSON.stringify({
        data: {
          reasonCodes: ["NORMAL_SUMMARY_CONTENT"],
          status: "generated",
          suggestion: {
            description: "可以考虑一个低压力学习休息草稿。",
            endDate: "2026-06-24",
            generatedAt: "2026-06-24T12:00:00.000Z",
            id,
            linkedTags: ["study"],
            rationale: "看起来学习标签较常见。",
            safetyLabel: "low_risk",
            schemaVersion: 1,
            startDate: "2026-06-18",
            status: "draft",
            suggestedActions: [
              {
                description: "如果你愿意，可以做一次十分钟整理。",
                linkedTags: ["study"],
                suggestedDueInDays: 2,
                title: "温和整理任务",
              },
            ],
            summaryWindow: 7,
            title:
              suggestionCounter === 1
                ? "可以考虑的保存草稿"
                : "可以考虑的忽略草稿",
          },
        },
      }),
    });
  });
  await page.route(
    "**/api/v1/plans/suggestions/suggestion-save-e2e/accept",
    async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 200,
        body: JSON.stringify({
          data: {
            plan: {
              actions: [],
              checkInFrequency: "weekly",
              createdAt: "2026-06-24T12:00:00.000Z",
              description: "可以考虑一个低压力学习休息草稿。",
              id: "plan-from-suggestion-e2e",
              linkedTags: ["study"],
              schemaVersion: 1,
              sourceType: "ai_suggested",
              startDate: "2026-06-18",
              status: "active",
              targetDate: "2026-06-20",
              title: "可以考虑的保存草稿",
              updatedAt: "2026-06-24T12:00:00.000Z",
            },
            suggestion: {
              description: "可以考虑一个低压力学习休息草稿。",
              endDate: "2026-06-24",
              generatedAt: "2026-06-24T12:00:00.000Z",
              id: "suggestion-save-e2e",
              linkedTags: ["study"],
              rationale: "看起来学习标签较常见。",
              safetyLabel: "low_risk",
              schemaVersion: 1,
              startDate: "2026-06-18",
              status: "accepted",
              suggestedActions: [],
              summaryWindow: 7,
              title: "可以考虑的保存草稿",
            },
          },
        }),
      });
    },
  );
  await page.route(
    "**/api/v1/plans/suggestions/suggestion-dismiss-e2e/dismiss",
    async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 200,
        body: JSON.stringify({
          data: {
            suggestion: {
              description: "可以考虑一个低压力学习休息草稿。",
              endDate: "2026-06-24",
              generatedAt: "2026-06-24T12:00:00.000Z",
              id: "suggestion-dismiss-e2e",
              linkedTags: ["study"],
              rationale: "看起来学习标签较常见。",
              safetyLabel: "low_risk",
              schemaVersion: 1,
              startDate: "2026-06-18",
              status: "dismissed",
              suggestedActions: [],
              summaryWindow: 7,
              title: "可以考虑的忽略草稿",
            },
          },
        }),
      });
    },
  );

  await page
    .getByRole("button", { name: zhCN.plans.suggestions.generate })
    .click();
  await expect(
    page.getByRole("heading", { name: "可以考虑的保存草稿" }),
  ).toBeVisible();
  await page.getByRole("button", { name: zhCN.plans.suggestions.save }).click();
  await expect(
    page.getByText(zhCN.plans.suggestions.savedStatus),
  ).toBeVisible();
  await expect(
    page.locator(".plan-list").getByRole("heading", {
      name: "可以考虑的保存草稿",
    }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: zhCN.plans.suggestions.generate })
    .click();
  await expect(
    page.getByRole("heading", { name: "可以考虑的忽略草稿" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: zhCN.plans.suggestions.dismiss })
    .click();
  await expect(
    page.getByText(zhCN.plans.suggestions.dismissedStatus),
  ).toBeVisible();

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("user handles AI long-term insight consent, save, dismiss, and fallback flow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await registerAndConsent(page, "long-term-insight-ui");
  await createEntryViaApi(page, {
    energy: 6,
    eventTags: ["study", "sleep"],
    mood: 6,
    note: "完全虚构的长期洞察端到端测试记录。",
    occurredAt: "2026-06-24T15:30:00.000Z",
    sleepHours: 6.5,
    sleepQuality: 6,
    stress: 5,
  });

  await page.goto("/zh-CN/long-term");
  const consentResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().endsWith("/api/v1/long-term/insights"),
  );
  await page
    .getByRole("button", { name: zhCN.longTerm.insights.generate })
    .click();
  expect((await consentResponse).status()).toBe(403);
  await expect(
    page.getByText(zhCN.longTerm.insights.consentRequired),
  ).toBeVisible();

  await page.evaluate(async () => {
    const response = await fetch("/api/v1/account/ai-consent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accepted: true, locale: "zh-CN" }),
    });

    if (!response.ok) {
      throw new Error(`AI consent failed with ${response.status}`);
    }
  });

  let insightCounter = 0;
  await page.route("**/api/v1/long-term/insights", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    insightCounter += 1;

    if (insightCounter === 3) {
      await route.fulfill({
        contentType: "application/json",
        status: 200,
        body: JSON.stringify({
          data: {
            insight: null,
            reasonCodes: ["PROVIDER_UNAVAILABLE"],
            status: "safe_fallback",
          },
        }),
      });
      return;
    }

    const id =
      insightCounter === 1 ? "insight-save-e2e" : "insight-dismiss-e2e";
    await route.fulfill({
      contentType: "application/json",
      status: 200,
      body: JSON.stringify({
        data: {
          insight: {
            endDate: "2026-06-24",
            generatedAt: "2026-06-24T12:00:00.000Z",
            gentleSuggestions: [
              {
                description: "如果你愿意，可以考虑一次温和的学习收尾。",
                riskLevel: "low",
                suggestedActionType: "learning",
                title: "可以考虑学习收尾",
              },
            ],
            id,
            overview: "看起来这段摘要可能适合做一个低风险回顾。",
            patterns: [
              {
                confidence: "low",
                description: "可能学习和睡眠标签较常见。",
                relatedTags: ["study", "sleep"],
                title: "可能的学习睡眠线索",
              },
            ],
            planSuggestionRefs: [],
            safetyLabel: "low_risk",
            schemaVersion: 1,
            sourceSummarySnapshot: {
              endDate: "2026-06-24",
              energyAverage: 6,
              entryCount: 1,
              missingDays: [],
              moodAverage: 6,
              mostCommonTags: [{ count: 1, tag: "study" }],
              notablePatterns: ["可以考虑低风险回顾。"],
              sleepAverage: 6.5,
              sleepQualityAverage: 6,
              startDate: "2026-06-18",
              stressAverage: 5,
              summaryWindow: 7,
            },
            startDate: "2026-06-18",
            status: "draft",
            strengths: ["也许持续记录本身值得保留。"],
            summaryWindow: 7,
            title:
              insightCounter === 1
                ? "可以考虑的保存洞察草稿"
                : "可以考虑的忽略洞察草稿",
            updatedAt: "2026-06-24T12:00:00.000Z",
            watchPoints: ["可以考虑继续观察睡眠和精力。"],
          },
          reasonCodes: ["NORMAL_SUMMARY_CONTENT"],
          status: "generated",
        },
      }),
    });
  });
  await page.route(
    "**/api/v1/long-term/insights/insight-save-e2e/save",
    async (route) => {
      const requestBody = await route.request().postData();
      expect(requestBody ?? "").toBe("");
      await route.fulfill({
        contentType: "application/json",
        status: 200,
        body: JSON.stringify({
          data: {
            insight: {
              endDate: "2026-06-24",
              generatedAt: "2026-06-24T12:00:00.000Z",
              gentleSuggestions: [],
              id: "insight-save-e2e",
              overview: "看起来这段摘要可能适合做一个低风险回顾。",
              patterns: [],
              planSuggestionRefs: [],
              safetyLabel: "low_risk",
              schemaVersion: 1,
              sourceSummarySnapshot: {
                endDate: "2026-06-24",
                energyAverage: 6,
                entryCount: 1,
                missingDays: [],
                moodAverage: 6,
                mostCommonTags: [],
                notablePatterns: [],
                sleepAverage: 6.5,
                sleepQualityAverage: 6,
                startDate: "2026-06-18",
                stressAverage: 5,
                summaryWindow: 7,
              },
              startDate: "2026-06-18",
              status: "saved",
              strengths: [],
              summaryWindow: 7,
              title: "可以考虑的保存洞察草稿",
              updatedAt: "2026-06-24T12:01:00.000Z",
              watchPoints: [],
            },
          },
        }),
      });
    },
  );
  await page.route(
    "**/api/v1/long-term/insights/insight-dismiss-e2e/dismiss",
    async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 200,
        body: JSON.stringify({
          data: {
            insight: {
              endDate: "2026-06-24",
              generatedAt: "2026-06-24T12:00:00.000Z",
              gentleSuggestions: [],
              id: "insight-dismiss-e2e",
              overview: "看起来这段摘要可能适合做一个低风险回顾。",
              patterns: [],
              planSuggestionRefs: [],
              safetyLabel: "low_risk",
              schemaVersion: 1,
              sourceSummarySnapshot: {
                endDate: "2026-06-24",
                energyAverage: 6,
                entryCount: 1,
                missingDays: [],
                moodAverage: 6,
                mostCommonTags: [],
                notablePatterns: [],
                sleepAverage: 6.5,
                sleepQualityAverage: 6,
                startDate: "2026-06-18",
                stressAverage: 5,
                summaryWindow: 7,
              },
              startDate: "2026-06-18",
              status: "dismissed",
              strengths: [],
              summaryWindow: 7,
              title: "可以考虑的忽略洞察草稿",
              updatedAt: "2026-06-24T12:01:00.000Z",
              watchPoints: [],
            },
          },
        }),
      });
    },
  );

  await page
    .getByRole("button", { name: zhCN.longTerm.insights.generate })
    .click();
  await expect(
    page.getByRole("heading", { name: "可以考虑的保存洞察草稿" }),
  ).toBeVisible();
  await page
    .locator(".form-actions")
    .getByRole("button", { name: zhCN.longTerm.insights.save, exact: true })
    .click();
  await expect(
    page.getByText(zhCN.longTerm.insights.savedStatus),
  ).toBeVisible();

  await page
    .getByRole("button", { name: zhCN.longTerm.insights.generate })
    .click();
  await expect(
    page.getByRole("heading", { name: "可以考虑的忽略洞察草稿" }),
  ).toBeVisible();
  await page
    .locator(".form-actions")
    .getByRole("button", { name: zhCN.longTerm.insights.dismiss, exact: true })
    .click();
  await expect(
    page.getByText(zhCN.longTerm.insights.dismissedStatus),
  ).toBeVisible();

  await page
    .getByRole("button", { name: zhCN.longTerm.insights.generate })
    .click();
  await expect(page.getByText(zhCN.longTerm.insights.fallback)).toBeVisible();

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
