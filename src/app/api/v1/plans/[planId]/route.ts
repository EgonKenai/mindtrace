import { NextResponse } from "next/server";

import { getSessionUser } from "@/server/auth/session";
import { assertSameOrigin } from "@/server/http/origin";
import { apiErrorResponse } from "@/server/http/responses";
import { deletePlan, updatePlan } from "@/server/services/plan-service";

export const runtime = "nodejs";

interface PlanRouteContext {
  params: Promise<{
    planId: string;
  }>;
}

export async function PATCH(request: Request, context: PlanRouteContext) {
  try {
    assertSameOrigin(request);
    const user = await getSessionUser();
    const { planId } = await context.params;
    const plan = await updatePlan(user?.uid, planId, await request.json());

    return NextResponse.json({ data: { plan } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: PlanRouteContext) {
  try {
    assertSameOrigin(request);
    const user = await getSessionUser();
    const { planId } = await context.params;
    await deletePlan(user?.uid, planId);

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
