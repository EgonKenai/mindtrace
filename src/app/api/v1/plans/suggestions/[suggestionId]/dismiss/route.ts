import { NextResponse } from "next/server";

import { getSessionUser } from "@/server/auth/session";
import { assertSameOrigin } from "@/server/http/origin";
import { apiErrorResponse } from "@/server/http/responses";
import { dismissPlanSuggestion } from "@/server/services/plan-suggestion-service";

export const runtime = "nodejs";

interface DismissSuggestionRouteContext {
  params: Promise<{
    suggestionId: string;
  }>;
}

export async function POST(
  request: Request,
  context: DismissSuggestionRouteContext,
) {
  try {
    assertSameOrigin(request);
    const user = await getSessionUser();
    const { suggestionId } = await context.params;
    const suggestion = await dismissPlanSuggestion(user?.uid, suggestionId);

    return NextResponse.json({ data: { suggestion } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
