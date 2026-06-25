import { describe, expect, it } from "vitest";

import { consentSubmissionSchema } from "@/lib/validation/consent";

const validConsent = {
  adultConfirmed: true,
  aiProcessingAccepted: true,
  locale: "zh-CN",
  privacyAccepted: true,
  productBoundaryAccepted: true,
  timeZone: "Asia/Tokyo",
} as const;

describe("consentSubmissionSchema", () => {
  it("accepts a complete adult consent submission", () => {
    expect(consentSubmissionSchema.parse(validConsent)).toEqual(validConsent);
  });

  it("allows product access consent without optional AI processing consent", () => {
    expect(
      consentSubmissionSchema.parse({
        ...validConsent,
        aiProcessingAccepted: false,
      }),
    ).toMatchObject({
      adultConfirmed: true,
      aiProcessingAccepted: false,
      privacyAccepted: true,
      productBoundaryAccepted: true,
    });
  });

  it("rejects incomplete consent", () => {
    expect(() =>
      consentSubmissionSchema.parse({
        ...validConsent,
        adultConfirmed: false,
      }),
    ).toThrow();
  });

  it("rejects an invalid IANA time zone", () => {
    expect(() =>
      consentSubmissionSchema.parse({
        ...validConsent,
        timeZone: "Tokyo local time",
      }),
    ).toThrow();
  });
});
