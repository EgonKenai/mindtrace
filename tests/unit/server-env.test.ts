import { afterEach, describe, expect, it } from "vitest";

import { getServerEnv } from "@/server/env";

const originalTimeout = process.env.GEMINI_PROVIDER_TIMEOUT_MS;

afterEach(() => {
  if (originalTimeout === undefined) {
    delete process.env.GEMINI_PROVIDER_TIMEOUT_MS;
  } else {
    process.env.GEMINI_PROVIDER_TIMEOUT_MS = originalTimeout;
  }
});

describe("server environment", () => {
  it("defaults Gemini provider timeout to 30 seconds for local demos", () => {
    delete process.env.GEMINI_PROVIDER_TIMEOUT_MS;

    expect(getServerEnv().GEMINI_PROVIDER_TIMEOUT_MS).toBe(30_000);
  });

  it("allows a bounded Gemini provider timeout override", () => {
    process.env.GEMINI_PROVIDER_TIMEOUT_MS = "45000";

    expect(getServerEnv().GEMINI_PROVIDER_TIMEOUT_MS).toBe(45_000);
  });

  it("rejects an unbounded Gemini provider timeout override", () => {
    process.env.GEMINI_PROVIDER_TIMEOUT_MS = "999999";

    expect(() => getServerEnv()).toThrow();
  });
});
