import { deleteApp, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
} from "firebase/auth";
import { afterAll, describe, expect, it } from "vitest";

import { getAccessState } from "@/server/auth/access";
import { createSessionCookie } from "@/server/auth/session";
import { getAdminAuth } from "@/server/firebase/admin";
import {
  ensureAccount,
  getAccount,
} from "@/server/repositories/account-repository";
import { recordConsent } from "@/server/services/consent-service";

const clientApp = initializeApp(
  {
    apiKey: "demo-api-key",
    projectId: "mindtrace-demo",
  },
  "integration-auth-client",
);
const clientAuth = getAuth(clientApp);
connectAuthEmulator(clientAuth, "http://127.0.0.1:9099", {
  disableWarnings: true,
});

afterAll(async () => {
  await deleteApp(clientApp);
});

describe("authentication and consent with Firebase emulators", () => {
  it("creates a session before consent and grants access after consent", async () => {
    const email = `fictional-user-${Date.now()}@example.test`;
    const credential = await createUserWithEmailAndPassword(
      clientAuth,
      email,
      "Fictional-pass-2026",
    );
    const idToken = await credential.user.getIdToken();
    const { decodedToken, sessionCookie } = await createSessionCookie(idToken);

    expect(decodedToken.uid).toBe(credential.user.uid);
    await expect(
      getAdminAuth().verifySessionCookie(sessionCookie),
    ).resolves.toMatchObject({ uid: credential.user.uid });

    await ensureAccount(decodedToken.uid);
    const accountBeforeConsent = await getAccount(decodedToken.uid);

    expect(accountBeforeConsent).toMatchObject({
      locale: "zh-CN",
      status: "active",
      timeZone: "UTC",
    });
    expect(accountBeforeConsent).not.toHaveProperty("email");
    expect(accountBeforeConsent).not.toHaveProperty("emailNormalized");
    await expect(getAccessState(decodedToken.uid)).resolves.toMatchObject({
      hasProductAccess: false,
    });

    await recordConsent(decodedToken.uid, {
      adultConfirmed: true,
      aiProcessingAccepted: true,
      locale: "zh-CN",
      privacyAccepted: true,
      productBoundaryAccepted: true,
      timeZone: "Asia/Tokyo",
    });

    await expect(getAccessState(decodedToken.uid)).resolves.toMatchObject({
      hasProductAccess: true,
      account: {
        locale: "zh-CN",
        status: "active",
        timeZone: "Asia/Tokyo",
      },
    });
  });

  it("does not require AI processing consent for journal product access", async () => {
    const userId = `fictional-no-ai-${Date.now()}`;
    await ensureAccount(userId);
    await recordConsent(userId, {
      adultConfirmed: true,
      aiProcessingAccepted: false,
      locale: "zh-CN",
      privacyAccepted: true,
      productBoundaryAccepted: true,
      timeZone: "Asia/Tokyo",
    });

    await expect(getAccessState(userId)).resolves.toMatchObject({
      hasProductAccess: true,
      account: {
        status: "active",
        timeZone: "Asia/Tokyo",
      },
    });
  });
});
