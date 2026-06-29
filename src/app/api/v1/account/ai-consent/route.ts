import { NextResponse } from "next/server";

import { aiProcessingConsentSchema } from "@/lib/validation/consent";
import { getSessionUser } from "@/server/auth/session";
import { assertSameOrigin } from "@/server/http/origin";
import {
  apiErrorResponse,
  UnauthenticatedError,
} from "@/server/http/responses";
import { recordAiProcessingConsent } from "@/server/services/consent-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getSessionUser();

    if (!user) {
      throw new UnauthenticatedError();
    }

    const input = aiProcessingConsentSchema.parse(await request.json());
    await recordAiProcessingConsent(user.uid, input);

    return NextResponse.json({
      data: { aiProcessingAccepted: input.accepted },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
