import { NextResponse } from "next/server";

import { sessionRequestSchema } from "@/lib/validation/auth";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/server/auth/constants";
import { isRejectedIdTokenError } from "@/server/auth/errors";
import {
  createSessionCookie,
  RecentSignInRequiredError,
} from "@/server/auth/session";
import { getServerEnv } from "@/server/env";
import { assertSameOrigin } from "@/server/http/origin";
import { apiErrorResponse } from "@/server/http/responses";
import { ensureAccount } from "@/server/repositories/account-repository";

export const runtime = "nodejs";

interface CreateSessionDependencies {
  createSessionCookie: typeof createSessionCookie;
  ensureAccount: typeof ensureAccount;
}

const createSessionDependencies: CreateSessionDependencies = {
  createSessionCookie,
  ensureAccount,
};

export async function handleCreateSession(
  request: Request,
  dependencies: CreateSessionDependencies = createSessionDependencies,
) {
  try {
    assertSameOrigin(request);
    const body = sessionRequestSchema.parse(await request.json());
    const { decodedToken, sessionCookie } =
      await dependencies.createSessionCookie(body.idToken);

    await dependencies.ensureAccount(decodedToken.uid);

    const response = NextResponse.json({ data: { authenticated: true } });
    const { NODE_ENV } = getServerEnv();
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
      path: "/",
      sameSite: "lax",
      secure: NODE_ENV === "production",
    });
    return response;
  } catch (error) {
    if (error instanceof RecentSignInRequiredError) {
      return NextResponse.json(
        { error: { code: "RECENT_SIGN_IN_REQUIRED" } },
        { status: 401 },
      );
    }

    if (isRejectedIdTokenError(error)) {
      return NextResponse.json(
        { error: { code: "INVALID_ID_TOKEN" } },
        { status: 401 },
      );
    }

    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  return handleCreateSession(request);
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const response = NextResponse.json({ data: { authenticated: false } });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      expires: new Date(0),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: getServerEnv().NODE_ENV === "production",
    });
    return response;
  } catch (error) {
    return apiErrorResponse(error);
  }
}
