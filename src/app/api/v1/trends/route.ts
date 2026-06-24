import { NextResponse } from "next/server";

import { getSessionUser } from "@/server/auth/session";
import { apiErrorResponse } from "@/server/http/responses";
import { getRecentTrends } from "@/server/services/trends-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    const url = new URL(request.url);
    const trends = await getRecentTrends(
      user?.uid,
      Object.fromEntries(url.searchParams),
    );

    return NextResponse.json({ data: trends });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
