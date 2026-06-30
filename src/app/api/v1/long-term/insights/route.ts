import { NextResponse } from "next/server";

import { getSessionUser } from "@/server/auth/session";
import { assertSameOrigin } from "@/server/http/origin";
import { apiErrorResponse } from "@/server/http/responses";
import {
  generateLongTermInsight,
  listLongTermInsights,
} from "@/server/services/long-term-insight-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getSessionUser();
    const insights = await listLongTermInsights(user?.uid);

    return NextResponse.json({ data: { insights } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getSessionUser();
    const result = await generateLongTermInsight(
      user?.uid,
      await request.json(),
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
