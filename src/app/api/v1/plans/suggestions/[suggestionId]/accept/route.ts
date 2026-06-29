import { NextResponse } from "next/server";

import { getSessionUser } from "@/server/auth/session";
import { assertSameOrigin } from "@/server/http/origin";
import { apiErrorResponse } from "@/server/http/responses";
import { acceptPlanSuggestion } from "@/server/services/plan-suggestion-service";

export const runtime = "nodejs";

interface AcceptSuggestionRouteContext {
  params: Promise<{
    suggestionId: string;
  }>;
}

export async function POST(
  request: Request,
  context: AcceptSuggestionRouteContext,
) {
  try {
    assertSameOrigin(request);
    const user = await getSessionUser();
    const { suggestionId } = await context.params;
    const result = await acceptPlanSuggestion(user?.uid, suggestionId);

    return NextResponse.json({ data: result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
