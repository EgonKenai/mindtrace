import { describe, expect, it } from "vitest";
import { z } from "zod";

import { apiErrorResponse } from "@/server/http/responses";

describe("safe API errors", () => {
  it("does not expose unknown error messages or journal content", async () => {
    const privateText = "完全虚构但不应进入错误响应的日记正文";
    const response = apiErrorResponse(
      new Error(`Database failure: ${privateText}`),
    );
    const body = await response.text();

    expect(response.status).toBe(500);
    expect(body).toBe('{"error":{"code":"INTERNAL_ERROR"}}');
    expect(body).not.toContain(privateText);
  });

  it("returns only allowlisted schema field names", async () => {
    const schema = z
      .object({
        mood: z.number().min(1),
      })
      .strict();
    let validationError: unknown;

    try {
      schema.parse({ mood: 0, ownerId: "fictional-owner" });
    } catch (error) {
      validationError = error;
    }

    const response = apiErrorResponse(validationError);
    const body = await response.json();

    expect(body).toEqual({
      error: {
        code: "INVALID_REQUEST",
        fields: { mood: "INVALID_VALUE" },
      },
    });
    expect(JSON.stringify(body)).not.toContain("ownerId");
  });
});
