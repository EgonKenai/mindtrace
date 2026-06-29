import { expect, test, type Page, type Route } from "@playwright/test";

import type { FeedbackResult } from "@/features/ai-feedback/model";
import {
  acceptAiConsent,
  createEntryViaApi,
  registerAndConsent,
} from "./helpers";

const fictionalEntry = {
  mood: 7,
  stress: 4,
  energy: 6,
  sleepHours: 7.5,
  sleepQuality: 7,
  eventTags: ["work", "sleep"],
  note: "完全虚构的 AI 反馈界面测试记录。",
  occurredAt: "2026-06-24T12:00:00.000Z",
};

function feedbackResult(
  overrides: Partial<FeedbackResult> = {},
): FeedbackResult {
  return {
    disclaimer:
      "这是一条记录辅助信息，不是诊断、治疗或用药建议，也不能替代专业人员或紧急服务。",
    policyDecision: "allow_generation",
    reasonCodes: ["NORMAL_JOURNAL_CONTENT"],
    reflection: "这是一段完全虚构的支持性反思。",
    schemaVersion: "1",
    status: "generated",
    suggestions: ["可以考虑短暂休息并观察自己的感受。"],
    ...overrides,
  };
}

async function openEntryDetail(page: Page, testLabel: string) {
  await registerAndConsent(page, testLabel);
  const entry = await createEntryViaApi(page, fictionalEntry);
  await page.goto(`/zh-CN/entries/${entry.id}`);
  await expect(
    page.getByRole("heading", { name: "AI 支持性反馈" }),
  ).toBeVisible();
  return entry;
}

async function fulfillFeedback(route: Route, result: FeedbackResult) {
  await route.fulfill({
    contentType: "application/json",
    status: 200,
    body: JSON.stringify({ data: { feedback: result } }),
  });
}

test("AI consent is optional and declining never requests feedback", async ({
  page,
}) => {
  await openEntryDetail(page, "ai-consent-decline");
  let feedbackRequests = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      /\/api\/v1\/entries\/[^/]+\/feedback$/.test(request.url())
    ) {
      feedbackRequests += 1;
    }
  });

  await page.getByRole("button", { name: "生成 AI 反馈" }).click();
  await expect(
    page.getByRole("heading", { name: "AI 数据处理说明" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "拒绝并关闭" }).click();

  await expect(
    page.getByText(/你已拒绝 AI 数据处理。本条记录未发送/),
  ).toBeVisible();
  expect(feedbackRequests).toBe(0);

  await page.getByRole("link", { name: "返回历史记录" }).click();
  await expect(page).toHaveURL(/\/zh-CN\/history$/);
  await expect(page.getByText(fictionalEntry.note)).toBeVisible();
  await page.goto("/zh-CN/trends");
  await expect(
    page.getByRole("heading", { name: "最近 7 天趋势" }),
  ).toBeVisible();
});

test("accepted consent generates plain-text fake feedback once", async ({
  page,
}) => {
  await openEntryDetail(page, "ai-consent-accept");
  let feedbackRequests = 0;

  await page.route("**/api/v1/entries/*/feedback", async (route) => {
    feedbackRequests += 1;
    await fulfillFeedback(
      route,
      feedbackResult({
        reflection: "<strong>虚构反馈保持为纯文本</strong>",
      }),
    );
  });

  await page.getByRole("button", { name: "生成 AI 反馈" }).click();
  await acceptAiConsent(page);

  await expect(
    page.getByText("<strong>虚构反馈保持为纯文本</strong>"),
  ).toBeVisible();
  await expect(
    page.getByText("可以考虑短暂休息并观察自己的感受。"),
  ).toBeVisible();
  await expect(page.locator(".ai-feedback-result strong")).toHaveCount(0);
  expect(feedbackRequests).toBe(1);
});

test("feedback UI presents redirects, fallbacks, and request failures", async ({
  page,
}) => {
  await openEntryDetail(page, "ai-statuses");

  let response:
    | { kind: "feedback"; result: FeedbackResult }
    | { kind: "error"; code: string; status: number } = {
    kind: "feedback",
    result: feedbackResult(),
  };

  await page.route("**/api/v1/entries/*/feedback", async (route) => {
    if (response.kind === "feedback") {
      await fulfillFeedback(route, response.result);
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      status: response.status,
      body: JSON.stringify({ error: { code: response.code } }),
    });
  });

  await page.getByRole("button", { name: "生成 AI 反馈" }).click();
  await acceptAiConsent(page);
  await expect(
    page.getByRole("heading", { name: "支持性反馈", exact: true }),
  ).toBeVisible();

  for (const scenario of [
    {
      result: feedbackResult({
        policyDecision: "crisis_redirect",
        reasonCodes: ["ACUTE_DANGER"],
        reflection: "固定的虚构危机转介文案。",
        status: "crisis_redirect",
        suggestions: ["联系当地紧急服务。"],
      }),
      title: "请立即寻求紧急支持",
    },
    {
      result: feedbackResult({
        policyDecision: "supportive_redirect",
        reasonCodes: ["AMBIGUOUS_HIGH_DISTRESS"],
        reflection: "固定的虚构支持转介文案。",
        status: "supportive_redirect",
      }),
      title: "建议先获得现实支持",
    },
    {
      result: feedbackResult({
        policyDecision: "safe_fallback",
        reasonCodes: ["PROVIDER_NOT_CONFIGURED"],
        status: "safe_fallback",
      }),
      title: "暂时无法生成 AI 反馈",
      message: "AI Provider 尚未配置",
    },
    {
      result: feedbackResult({
        policyDecision: "safe_fallback",
        reasonCodes: ["PROVIDER_TIMEOUT"],
        status: "safe_fallback",
      }),
      title: "暂时无法生成 AI 反馈",
      message: "AI Provider 响应超时",
    },
    {
      result: feedbackResult({
        policyDecision: "safe_fallback",
        reasonCodes: ["PROVIDER_RATE_LIMITED"],
        status: "safe_fallback",
      }),
      title: "暂时无法生成 AI 反馈",
      message: "AI Provider 当前请求较多",
    },
  ]) {
    response = { kind: "feedback", result: scenario.result };
    await page.getByRole("button", { name: "生成 AI 反馈" }).click();
    await expect(
      page.getByRole("heading", { name: scenario.title }),
    ).toBeVisible();
    if (scenario.message) {
      await expect(page.getByText(new RegExp(scenario.message))).toBeVisible();
    }
  }

  for (const failure of [
    { code: "TIMEOUT", status: 504, text: "反馈请求超时" },
    { code: "RATE_LIMITED", status: 429, text: "反馈请求过多" },
    { code: "INTERNAL_ERROR", status: 500, text: "反馈暂时不可用" },
  ]) {
    response = { kind: "error", code: failure.code, status: failure.status };
    await page.getByRole("button", { name: "生成 AI 反馈" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: failure.text }),
    ).toBeVisible();
  }
});

test("feedback submission is single-flight and works at 360px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await openEntryDetail(page, "ai-mobile-single-flight");
  let feedbackRequests = 0;
  let releaseResponse: (() => void) | undefined;
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });

  await page.route("**/api/v1/entries/*/feedback", async (route) => {
    feedbackRequests += 1;
    await responseGate;
    await fulfillFeedback(route, feedbackResult());
  });

  await page.getByRole("button", { name: "生成 AI 反馈" }).click();
  const consentRequest = page.waitForResponse(
    (candidate) =>
      candidate.request().method() === "POST" &&
      candidate.url().endsWith("/api/v1/account/ai-consent"),
  );
  await page.getByRole("button", { name: "同意并生成" }).click();
  expect((await consentRequest).status()).toBe(200);

  const generatingButton = page.getByRole("button", {
    name: "正在生成反馈",
  });
  await expect(generatingButton).toBeDisabled();
  await generatingButton.click({ force: true });
  expect(feedbackRequests).toBe(1);

  releaseResponse?.();
  await expect(
    page.getByRole("heading", { name: "支持性反馈", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
