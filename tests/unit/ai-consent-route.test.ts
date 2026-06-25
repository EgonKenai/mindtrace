import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionUserMock, recordAiProcessingConsentMock } = vi.hoisted(
  () => ({
    getSessionUserMock: vi.fn(),
    recordAiProcessingConsentMock: vi.fn(),
  }),
);

vi.mock("@/server/auth/session", () => ({
  getSessionUser: getSessionUserMock,
}));

vi.mock("@/server/services/consent-service", () => ({
  recordAiProcessingConsent: recordAiProcessingConsentMock,
}));

import { POST } from "@/app/api/v1/account/ai-consent/route";

const originalAppOrigin = process.env.APP_ORIGIN;

function createRequest(body: unknown, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/v1/account/ai-consent", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.APP_ORIGIN = "http://localhost:3000";
  getSessionUserMock.mockResolvedValue({ uid: "verified-user" });
});

afterEach(() => {
  process.env.APP_ORIGIN = originalAppOrigin;
});

describe("POST /api/v1/account/ai-consent", () => {
  it.each([true, false])(
    "records an independent AI processing decision: %s",
    async (accepted) => {
      const response = await POST(createRequest({ accepted, locale: "zh-CN" }));

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        data: { aiProcessingAccepted: accepted },
      });
      expect(recordAiProcessingConsentMock).toHaveBeenCalledWith(
        "verified-user",
        { accepted, locale: "zh-CN" },
      );
    },
  );

  it("rejects unauthenticated updates", async () => {
    getSessionUserMock.mockResolvedValue(null);

    const response = await POST(
      createRequest({ accepted: true, locale: "zh-CN" }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: { code: "UNAUTHENTICATED" },
    });
    expect(recordAiProcessingConsentMock).not.toHaveBeenCalled();
  });

  it("rejects cross-origin updates", async () => {
    const response = await POST(
      createRequest(
        { accepted: true, locale: "zh-CN" },
        "https://untrusted.example",
      ),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: { code: "INVALID_ORIGIN" },
    });
    expect(recordAiProcessingConsentMock).not.toHaveBeenCalled();
  });
});
