import { NextResponse } from "next/server";

import { getSessionUser } from "@/server/auth/session";
import { assertSameOrigin } from "@/server/http/origin";
import { apiErrorResponse } from "@/server/http/responses";
import { createPlan, listPlans } from "@/server/services/plan-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getSessionUser();
    const plans = await listPlans(user?.uid);

    return NextResponse.json({ data: { plans } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getSessionUser();
    const plan = await createPlan(user?.uid, await request.json());

    return NextResponse.json({ data: { plan } }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
