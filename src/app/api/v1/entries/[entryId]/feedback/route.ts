import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { defaultLocale, isSupportedLocale } from "@/i18n/config";
import type { AiFeedbackTimingEvent } from "@/server/ai/provider";
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
  const traceId = randomUUID();
  const requestStartedAt = performance.now();
  const timingLogger = {
    record(event: AiFeedbackTimingEvent): void {
      console.info(
        "[ai-feedback timing]",
        JSON.stringify({
          traceId,
          stage: event.stage,
          totalMs: Math.round(performance.now() - requestStartedAt),
          ...(typeof event.stepMs === "number"
            ? { stepMs: Math.round(event.stepMs) }
            : {}),
          ...(typeof event.attempt === "number"
            ? { attempt: event.attempt }
            : {}),
          ...(event.providerErrorCode
            ? { providerErrorCode: event.providerErrorCode }
            : {}),
        }),
      );
    },
  };

  timingLogger.record({ stage: "request_received" });

  try {
    assertSameOrigin(request);
    timingLogger.record({ stage: "origin_checked" });

    const user = await getSessionUser();
    timingLogger.record({ stage: "session_checked" });

    const { entryId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      locale?: unknown;
    };
    const locale =
      typeof body.locale === "string" && isSupportedLocale(body.locale)
        ? body.locale
        : defaultLocale;
    timingLogger.record({ stage: "request_body_parsed" });

    const feedback = await generateEntryFeedback(
      user?.uid,
      entryId,
      { timingLogger },
      locale,
    );

    timingLogger.record({ stage: "response_returned_to_frontend" });
    return NextResponse.json({ data: { feedback } });
  } catch (error) {
    timingLogger.record({ stage: "request_failed" });
    return apiErrorResponse(error);
  }
}
