import { NextResponse } from "next/server";

import { defaultLocale, isSupportedLocale } from "@/i18n/config";
import { getSessionUser } from "@/server/auth/session";
import { assertSameOrigin } from "@/server/http/origin";
import { apiErrorResponse } from "@/server/http/responses";
import { generateEntryFeedback } from "@/server/services/ai-feedback-service";

export const runtime = "nodejs";

interface FeedbackRouteContext {
  params: Promise<{
    entryId: string;
  }>;
}

export async function POST(request: Request, context: FeedbackRouteContext) {
  try {
    assertSameOrigin(request);
    const user = await getSessionUser();
    const { entryId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      locale?: unknown;
    };
    const locale =
      typeof body.locale === "string" && isSupportedLocale(body.locale)
        ? body.locale
        : defaultLocale;
    const feedback = await generateEntryFeedback(
      user?.uid,
      entryId,
      {},
      locale,
    );

    return NextResponse.json({ data: { feedback } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
