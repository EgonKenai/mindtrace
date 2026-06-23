import type { DecodedIdToken } from "firebase-admin/auth";
import { cookies } from "next/headers";

import {
  RECENT_SIGN_IN_SECONDS,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/server/auth/constants";
import { getAdminAuth } from "@/server/firebase/admin";

export class RecentSignInRequiredError extends Error {
  constructor() {
    super("RECENT_SIGN_IN_REQUIRED");
    this.name = "RecentSignInRequiredError";
  }
}

export async function createSessionCookie(
  idToken: string,
): Promise<{ decodedToken: DecodedIdToken; sessionCookie: string }> {
  const auth = getAdminAuth();
  const decodedToken = await auth.verifyIdToken(idToken, true);
  const signedInAt = decodedToken.auth_time;
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (nowSeconds - signedInAt > RECENT_SIGN_IN_SECONDS) {
    throw new RecentSignInRequiredError();
  }

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION_MS,
  });

  return { decodedToken, sessionCookie };
}

export async function getSessionUser(): Promise<DecodedIdToken | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    return await getAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}
