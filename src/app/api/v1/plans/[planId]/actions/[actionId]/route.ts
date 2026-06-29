import { NextResponse } from "next/server";

import { getSessionUser } from "@/server/auth/session";
import { assertSameOrigin } from "@/server/http/origin";
import { apiErrorResponse } from "@/server/http/responses";
import { updatePlanAction } from "@/server/services/plan-service";

export const runtime = "nodejs";

interface PlanActionRouteContext {
  params: Promise<{
    actionId: string;
    planId: string;
  }>;
}

export async function PATCH(request: Request, context: PlanActionRouteContext) {
  try {
    assertSameOrigin(request);
    const user = await getSessionUser();
    const { actionId, planId } = await context.params;
    const action = await updatePlanAction(
      user?.uid,
      planId,
      actionId,
      await request.json(),
    );

    return NextResponse.json({ data: { action } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
