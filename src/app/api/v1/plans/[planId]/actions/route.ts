import { NextResponse } from "next/server";

import { getSessionUser } from "@/server/auth/session";
import { assertSameOrigin } from "@/server/http/origin";
import { apiErrorResponse } from "@/server/http/responses";
import { createPlanAction } from "@/server/services/plan-service";

export const runtime = "nodejs";

interface PlanActionsRouteContext {
  params: Promise<{
    planId: string;
  }>;
}

export async function POST(request: Request, context: PlanActionsRouteContext) {
  try {
    assertSameOrigin(request);
    const user = await getSessionUser();
    const { planId } = await context.params;
    const action = await createPlanAction(
      user?.uid,
      planId,
      await request.json(),
    );

    return NextResponse.json({ data: { action } }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
