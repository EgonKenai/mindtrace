import { NextResponse } from "next/server";

import { getSessionUser } from "@/server/auth/session";
import { apiErrorResponse } from "@/server/http/responses";
import { getLongTermSummary } from "@/server/services/long-term-summary-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    const url = new URL(request.url);
    const summary = await getLongTermSummary(
      user?.uid,
      Object.fromEntries(url.searchParams),
    );

    return NextResponse.json({ data: { summary } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
