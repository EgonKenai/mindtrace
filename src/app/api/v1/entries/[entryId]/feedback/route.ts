import { NextResponse } from "next/server";

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
    const feedback = await generateEntryFeedback(user?.uid, entryId);

    return NextResponse.json({ data: { feedback } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
