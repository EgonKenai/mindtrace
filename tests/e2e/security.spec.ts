import { expect, test, type APIResponse } from "@playwright/test";

import {
  completeConsent,
  createEntryViaApi,
  registerAndConsent,
  registerWithoutConsent,
} from "./helpers";

const appOrigin = "http://127.0.0.1:3000";

async function expectSafeError(
  response: APIResponse,
  status: number,
  code: string,
): Promise<void> {
  expect(response.status()).toBe(status);
  expect(await response.json()).toEqual({ error: { code } });
}

test("journal and trend APIs enforce session, consent, origin, schema, and response allowlists", async ({
  page,
}) => {
  await expectSafeError(
    await page.request.get("/api/v1/entries"),
    401,
    "UNAUTHENTICATED",
  );
  await expectSafeError(
    await page.request.get("/api/v1/trends?days=7"),
    401,
    "UNAUTHENTICATED",
  );
  await expectSafeError(
    await page.request.get("/api/v1/entries/fictional-missing"),
    401,
    "UNAUTHENTICATED",
  );
  await expectSafeError(
    await page.request.post("/api/v1/entries", {
      headers: { origin: appOrigin },
      data: {},
    }),
    401,
    "UNAUTHENTICATED",
  );

  await registerWithoutConsent(page, "security-consent");
  await expectSafeError(
    await page.request.get("/api/v1/entries"),
    403,
    "CONSENT_REQUIRED",
  );
  await expectSafeError(
    await page.request.get("/api/v1/trends?days=7"),
    403,
    "CONSENT_REQUIRED",
  );
  await expectSafeError(
    await page.request.post("/api/v1/entries", {
      headers: { origin: appOrigin },
      data: {},
    }),
    403,
    "CONSENT_REQUIRED",
  );

  await page.goto("/zh-CN/onboarding/consent");
  await completeConsent(page);

  const privateText = "完全虚构且不得出现在错误响应中的正文";
  const invalidBodies = [
    {
      mood: 5,
      stress: 4,
      energy: 6,
      sleepHours: 7.5,
      sleepQuality: 8,
      eventTags: ["work"],
      note: privateText,
      occurredAt: "not-a-date",
    },
    {
      mood: 5,
      stress: 4,
      energy: 6,
      sleepHours: 7.5,
      sleepQuality: 8,
      eventTags: { work: true },
      note: privateText,
      occurredAt: new Date().toISOString(),
    },
    {
      mood: 5,
      stress: 4,
      energy: 6,
      sleepHours: 7.5,
      sleepQuality: 8,
      eventTags: ["work"],
      note: "长".repeat(5001),
      occurredAt: new Date().toISOString(),
    },
    {
      mood: 5,
      stress: 4,
      energy: 6,
      sleepHours: 7.5,
      sleepQuality: 8,
      eventTags: ["work"],
      note: privateText,
      occurredAt: new Date().toISOString(),
      ownerId: "fictional-owner",
    },
  ];

  for (const body of invalidBodies) {
    const response = await page.request.post("/api/v1/entries", {
      headers: { origin: appOrigin },
      data: body,
    });
    expect(response.status()).toBe(400);
    expect(await response.text()).not.toContain(privateText);
  }

  const invalidCursorResponse = await page.request.get(
    "/api/v1/entries?cursor=not-a-valid-cursor",
  );
  await expectSafeError(invalidCursorResponse, 400, "INVALID_REQUEST");

  const entry = await createEntryViaApi(page, {
    mood: 6,
    stress: 4,
    energy: 7,
    sleepHours: 7.25,
    sleepQuality: 8,
    eventTags: ["work"],
    note: "完全虚构的白名单检查记录。",
    occurredAt: new Date().toISOString(),
  });
  const detailResponse = await page.request.get(`/api/v1/entries/${entry.id}`);
  const detailBody = (await detailResponse.json()) as {
    data: { entry: Record<string, unknown> };
  };

  expect(Object.keys(detailBody.data.entry).sort()).toEqual(
    [
      "createdAt",
      "energy",
      "eventTags",
      "id",
      "localDate",
      "mood",
      "note",
      "occurredAt",
      "revision",
      "sleepHours",
      "sleepQuality",
      "stress",
      "timeZone",
      "updatedAt",
    ].sort(),
  );

  for (const request of [
    page.request.post("/api/v1/entries", {
      headers: { origin: "https://untrusted.example" },
      data: {},
    }),
    page.request.patch(`/api/v1/entries/${entry.id}`, {
      headers: { origin: "https://untrusted.example" },
      data: { mood: 8 },
    }),
    page.request.delete(`/api/v1/entries/${entry.id}`, {
      headers: { origin: "https://untrusted.example" },
    }),
  ]) {
    await expectSafeError(await request, 403, "INVALID_ORIGIN");
  }

  const forbiddenPatch = await page.request.patch(
    `/api/v1/entries/${entry.id}`,
    {
      headers: { origin: appOrigin },
      data: {
        mood: 8,
        uid: "fictional-owner",
        revision: 99,
        localDate: "2000-01-01",
        timeZone: "UTC",
      },
    },
  );
  expect(forbiddenPatch.status()).toBe(400);
  expect(await forbiddenPatch.text()).not.toContain("fictional-owner");
});

test("another user's entry IDs and trend data remain indistinguishable and isolated", async ({
  page,
}) => {
  await registerAndConsent(page, "security-user-b");
  const userBEntry = await createEntryViaApi(page, {
    mood: 10,
    stress: 1,
    energy: 10,
    sleepHours: 9,
    sleepQuality: 10,
    eventTags: ["other"],
    note: "完全虚构的用户 B 隔离记录。",
    occurredAt: new Date().toISOString(),
  });

  await page.goto("/zh-CN/settings");
  await page.getByRole("button", { name: "退出登录" }).click();
  await expect(page).toHaveURL(/\/zh-CN\/login$/);
  await registerAndConsent(page, "security-user-a");

  const missingId = "fictional-missing-entry";
  for (const entryId of [userBEntry.id, missingId]) {
    await expectSafeError(
      await page.request.get(`/api/v1/entries/${entryId}`),
      404,
      "NOT_FOUND",
    );
    await expectSafeError(
      await page.request.patch(`/api/v1/entries/${entryId}`, {
        headers: { origin: appOrigin },
        data: { mood: 7 },
      }),
      404,
      "NOT_FOUND",
    );
    await expectSafeError(
      await page.request.delete(`/api/v1/entries/${entryId}`, {
        headers: { origin: appOrigin },
      }),
      404,
      "NOT_FOUND",
    );
    await expectSafeError(
      await page.request.post(`/api/v1/entries/${entryId}/feedback`, {
        headers: { origin: appOrigin },
      }),
      404,
      "NOT_FOUND",
    );
  }

  const trendsResponse = await page.request.get("/api/v1/trends?days=7");
  const trendsBody = (await trendsResponse.json()) as {
    data: {
      points: Array<{ entryCount: number; mood: number | null }>;
      totalEntries: number;
    };
  };
  expect(trendsBody.data.totalEntries).toBe(0);
  expect(
    trendsBody.data.points.every(
      (point) => point.entryCount === 0 && point.mood === null,
    ),
  ).toBe(true);
});
