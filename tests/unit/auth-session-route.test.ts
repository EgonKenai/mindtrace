import { describe, expect, it, vi } from "vitest";

import { handleCreateSession } from "@/app/api/v1/auth/session/route";

const endpoint = "http://localhost:3000/api/v1/auth/session";
const internalMessage =
  "Firebase verification failed while reading internal certificate data";

function createRequest(body: unknown): Request {
  return new Request(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

function createRejectedDependencies(code: string) {
  return {
    createSessionCookie: vi.fn().mockRejectedValue(
      Object.assign(new Error(internalMessage), {
        code,
      }),
    ),
    ensureAccount: vi.fn(),
  };
}

async function expectSafeRejection(token: string, code: string): Promise<void> {
  const dependencies = createRejectedDependencies(code);
  const response = await handleCreateSession(
    createRequest({ idToken: token }),
    dependencies,
  );
  const body = await response.json();
  const serializedBody = JSON.stringify(body);

  expect(response.status).toBe(401);
  expect(body).toEqual({ error: { code: "INVALID_ID_TOKEN" } });
  expect(response.headers.get("set-cookie")).toBeNull();
  expect(serializedBody).not.toContain(token);
  expect(serializedBody).not.toContain(internalMessage);
  expect(serializedBody).not.toContain(code);
  expect(dependencies.ensureAccount).not.toHaveBeenCalled();
}

describe("POST /api/v1/auth/session", () => {
  it("rejects an invalid ID token without creating a session cookie", async () => {
    await expectSafeRejection(
      "invalid.header.payload",
      "auth/invalid-id-token",
    );
  });

  it("rejects an expired ID token without exposing verifier details", async () => {
    await expectSafeRejection(
      "expired.header.payload",
      "auth/id-token-expired",
    );
  });

  it("rejects a revoked ID token without exposing verifier details", async () => {
    await expectSafeRejection(
      "revoked.header.payload",
      "auth/id-token-revoked",
    );
  });

  it("rejects a missing token before calling the verifier", async () => {
    const dependencies = createRejectedDependencies("auth/argument-error");
    const response = await handleCreateSession(createRequest({}), dependencies);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: { code: "INVALID_REQUEST" } });
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(JSON.stringify(body)).not.toContain(internalMessage);
    expect(dependencies.createSessionCookie).not.toHaveBeenCalled();
    expect(dependencies.ensureAccount).not.toHaveBeenCalled();
  });
});
