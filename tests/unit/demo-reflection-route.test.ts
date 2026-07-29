import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { generateDemoReflectionMock } = vi.hoisted(() => ({
  generateDemoReflectionMock: vi.fn(),
}));

vi.mock("@/server/services/demo-feedback-service", () => ({
  generateDemoReflection: generateDemoReflectionMock,
}));

import { POST } from "@/app/api/v1/demo/reflection/route";

const originalAppOrigin = process.env.APP_ORIGIN;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.APP_ORIGIN = "http://localhost:3000";
  generateDemoReflectionMock.mockResolvedValue({
    schemaVersion: "1",
    status: "generated",
    reflection:
      "It may help to notice this as ordinary pressure rather than a fixed conclusion.",
    suggestions: ["You could consider taking one quiet pause."],
    disclaimer: "Not medical advice.",
    policyDecision: "allow_generation",
    reasonCodes: ["NORMAL_JOURNAL_CONTENT"],
  });
});

afterEach(() => {
  process.env.APP_ORIGIN = originalAppOrigin;
});

function createRequest(cookie?: string): NextRequest {
  return new NextRequest("http://localhost:3000/api/v1/demo/reflection", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify({
      locale: "en",
      note: "Today was stressful, and I want a short reflection.",
    }),
  });
}

describe("POST demo reflection route", () => {
  it("returns a reflection without requiring a signed-in user", async () => {
    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(generateDemoReflectionMock).toHaveBeenCalledWith(
      "Today was stressful, and I want a short reflection.",
      "en",
    );
    expect(body).toEqual({
      data: {
        reflection: {
          schemaVersion: "1",
          status: "generated",
          reflection:
            "It may help to notice this as ordinary pressure rather than a fixed conclusion.",
          suggestions: ["You could consider taking one quiet pause."],
          disclaimer: "Not medical advice.",
          policyDecision: "allow_generation",
          reasonCodes: ["NORMAL_JOURNAL_CONTENT"],
        },
        remaining: 2,
      },
    });
    expect(response.headers.get("set-cookie")).toContain(
      "mindtrace_demo_reflections=1",
    );
  });

  it("enforces the simple browser-session demo limit", async () => {
    const response = await POST(createRequest("mindtrace_demo_reflections=3"));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: { code: "DEMO_LIMIT_REACHED" },
    });
    expect(generateDemoReflectionMock).not.toHaveBeenCalled();
  });

  it("rejects a foreign origin before invoking the service", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/v1/demo/reflection",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://example.invalid",
        },
        body: JSON.stringify({
          locale: "en",
          note: "A short demo note.",
        }),
      },
    );
    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(generateDemoReflectionMock).not.toHaveBeenCalled();
  });
});
