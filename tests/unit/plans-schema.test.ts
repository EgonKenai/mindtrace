import { describe, expect, it } from "vitest";

import {
  createPlanActionInputSchema,
  createPlanInputSchema,
  updatePlanActionInputSchema,
  updatePlanInputSchema,
} from "@/lib/validation/plans";

const validPlan = {
  checkInFrequency: "weekly",
  description: "A fictional manual plan.",
  linkedTags: ["study", "sleep"],
  sourceType: "manual",
  startDate: "2026-06-24",
  targetDate: "2026-07-01",
  title: "Fictional study routine",
} as const;

describe("plan schemas", () => {
  it("accepts manual plan creation and rejects owner fields", () => {
    expect(createPlanInputSchema.parse(validPlan)).toMatchObject({
      sourceType: "manual",
      title: "Fictional study routine",
    });

    for (const field of ["uid", "ownerId", "createdAt", "updatedAt"]) {
      expect(() =>
        createPlanInputSchema.parse({
          ...validPlan,
          [field]: "client-controlled",
        }),
      ).toThrow();
    }
  });

  it("rejects invalid plan dates, tags, and unsupported AI source creation", () => {
    expect(() =>
      createPlanInputSchema.parse({ ...validPlan, startDate: "2026-02-31" }),
    ).toThrow();
    expect(() =>
      createPlanInputSchema.parse({
        ...validPlan,
        linkedTags: ["study", "study"],
      }),
    ).toThrow();
    expect(() =>
      createPlanInputSchema.parse({ ...validPlan, sourceType: "ai_suggested" }),
    ).toThrow();
  });

  it("validates plan status transitions as explicit updates", () => {
    expect(updatePlanInputSchema.parse({ status: "paused" })).toEqual({
      status: "paused",
    });
    expect(updatePlanInputSchema.parse({ status: "completed" })).toEqual({
      status: "completed",
    });
    expect(() =>
      updatePlanInputSchema.parse({ status: "diagnosed" }),
    ).toThrow();
    expect(() => updatePlanInputSchema.parse({})).toThrow();
  });

  it("validates action creation and completion updates", () => {
    expect(
      createPlanActionInputSchema.parse({
        description: "",
        dueDate: null,
        title: "Fictional action",
      }),
    ).toMatchObject({ title: "Fictional action" });
    expect(updatePlanActionInputSchema.parse({ status: "done" })).toEqual({
      status: "done",
    });
    expect(() =>
      updatePlanActionInputSchema.parse({ completedAt: "client-time" }),
    ).toThrow();
  });
});
