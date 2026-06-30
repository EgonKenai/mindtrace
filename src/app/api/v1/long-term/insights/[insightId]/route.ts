import { NextResponse } from "next/server";

import { getSessionUser } from "@/server/auth/session";
import { apiErrorResponse } from "@/server/http/responses";
import { getLongTermInsight } from "@/server/services/long-term-insight-service";

export const runtime = "nodejs";

interface InsightRouteContext {
  params: Promise<{
    insightId: string;
  }>;
}

export async function GET(_request: Request, context: InsightRouteContext) {
  try {
    const user = await getSessionUser();
    const { insightId } = await context.params;
    const insight = await getLongTermInsight(user?.uid, insightId);

    return NextResponse.json({ data: { insight } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
