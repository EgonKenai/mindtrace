import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { generateEntryFeedbackMock, getSessionUserMock } = vi.hoisted(() => ({
  generateEntryFeedbackMock: vi.fn(),
  getSessionUserMock: vi.fn(),
}));

vi.mock("@/server/auth/session", () => ({
  getSessionUser: getSessionUserMock,
}));

vi.mock("@/server/services/ai-feedback-service", () => ({
  generateEntryFeedback: generateEntryFeedbackMock,
}));

import { POST } from "@/app/api/v1/entries/[entryId]/feedback/route";

const originalAppOrigin = process.env.APP_ORIGIN;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.APP_ORIGIN = "http://localhost:3000";
  getSessionUserMock.mockResolvedValue({ uid: "verified-session-user" });
  generateEntryFeedbackMock.mockResolvedValue({
    schemaVersion: "1",
    status: "safe_fallback",
    reflection: "你的记录已经保存，反馈目前不可用。",
    suggestions: [],
    disclaimer: "这不是诊断或治疗建议。",
    policyDecision: "safe_fallback",
    reasonCodes: ["PROVIDER_NOT_CONFIGURED"],
  });
});

afterEach(() => {
  process.env.APP_ORIGIN = originalAppOrigin;
});

function createRequest(origin = "http://localhost:3000"): Request {
  return new Request("http://localhost:3000/api/v1/entries/entry-1/feedback", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
    },
    body: JSON.stringify({
      uid: "attacker-controlled-user",
      ownerId: "attacker-controlled-owner",
    }),
  });
}

const context = {
  params: Promise.resolve({ entryId: "entry-1" }),
};

describe("POST entry feedback route", () => {
  it("uses the verified session uid and returns an allowlisted response", async () => {
    const response = await POST(createRequest(), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(generateEntryFeedbackMock).toHaveBeenCalledWith(
      "verified-session-user",
      "entry-1",
      {
        timingLogger: {
          record: expect.any(Function),
        },
      },
      "en",
    );
    expect(body).toEqual({
      data: {
        feedback: {
          schemaVersion: "1",
          status: "safe_fallback",
          reflection: "你的记录已经保存，反馈目前不可用。",
          suggestions: [],
          disclaimer: "这不是诊断或治疗建议。",
          policyDecision: "safe_fallback",
          reasonCodes: ["PROVIDER_NOT_CONFIGURED"],
        },
      },
    });
    expect(JSON.stringify(body)).not.toContain("attacker-controlled");
  });

  it("rejects a foreign Origin before invoking the service", async () => {
    const response = await POST(
      createRequest("https://untrusted.example"),
      context,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: { code: "INVALID_ORIGIN" },
    });
    expect(generateEntryFeedbackMock).not.toHaveBeenCalled();
  });

  it("does not expose provider errors, prompts, or journal text", async () => {
    generateEntryFeedbackMock.mockRejectedValue(
      new Error(
        "provider raw error with secret prompt and fictional journal body",
      ),
    );

    const response = await POST(createRequest(), context);
    const body = await response.text();

    expect(response.status).toBe(500);
    expect(body).toBe('{"error":{"code":"INTERNAL_ERROR"}}');
    expect(body).not.toMatch(/provider|prompt|journal|secret/i);
  });
});
