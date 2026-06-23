import { afterEach, describe, expect, it } from "vitest";

import { assertSameOrigin, InvalidOriginError } from "@/server/http/origin";

const originalAppOrigin = process.env.APP_ORIGIN;

afterEach(() => {
  process.env.APP_ORIGIN = originalAppOrigin;
});

describe("assertSameOrigin", () => {
  it("accepts the configured application origin", () => {
    process.env.APP_ORIGIN = "http://localhost:3000";
    const request = new Request("http://localhost:3000/api/example", {
      headers: { origin: "http://localhost:3000" },
    });

    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("rejects a missing or foreign origin", () => {
    process.env.APP_ORIGIN = "http://localhost:3000";
    const request = new Request("http://localhost:3000/api/example", {
      headers: { origin: "https://untrusted.example" },
    });

    expect(() => assertSameOrigin(request)).toThrow(InvalidOriginError);
  });
});
