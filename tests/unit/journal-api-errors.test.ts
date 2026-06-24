import { describe, expect, it } from "vitest";

import { createJournalEntryInputSchema } from "@/lib/validation/journal";
import { apiErrorResponse } from "@/server/http/responses";

describe("journal API validation errors", () => {
  it("returns safe field names without echoing journal content", async () => {
    const privateTestText = "完全虚构且不应回显的测试正文";
    const result = createJournalEntryInputSchema.safeParse({
      mood: 11,
      stress: 4,
      energy: 6,
      sleepHours: 7.5,
      sleepQuality: 8,
      eventTags: ["work"],
      note: privateTestText,
      occurredAt: "2026-06-24T00:30:00.000Z",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    const response = apiErrorResponse(result.error);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: {
        code: "INVALID_REQUEST",
        fields: { mood: "INVALID_VALUE" },
      },
    });
    expect(JSON.stringify(body)).not.toContain(privateTestText);
  });
});
