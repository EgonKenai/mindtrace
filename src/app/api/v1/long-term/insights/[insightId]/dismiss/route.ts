import { NextResponse } from "next/server";

import { getSessionUser } from "@/server/auth/session";
import { assertSameOrigin } from "@/server/http/origin";
import { apiErrorResponse } from "@/server/http/responses";
import { dismissLongTermInsight } from "@/server/services/long-term-insight-service";

export const runtime = "nodejs";

interface DismissInsightRouteContext {
  params: Promise<{
    insightId: string;
  }>;
}

export async function POST(
  request: Request,
  context: DismissInsightRouteContext,
) {
  try {
    assertSameOrigin(request);
    const user = await getSessionUser();
    const { insightId } = await context.params;
    const insight = await dismissLongTermInsight(user?.uid, insightId);

    return NextResponse.json({ data: { insight } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
