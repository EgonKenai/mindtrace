import { NextResponse } from "next/server";

import { consentSubmissionSchema } from "@/lib/validation/consent";
import { getSessionUser } from "@/server/auth/session";
import { assertSameOrigin } from "@/server/http/origin";
import { apiErrorResponse } from "@/server/http/responses";
import { recordConsent } from "@/server/services/consent-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHENTICATED" } },
        { status: 401 },
      );
    }

    const input = consentSubmissionSchema.parse(await request.json());
    await recordConsent(user.uid, input);

    return NextResponse.json(
      { data: { hasProductAccess: true } },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
