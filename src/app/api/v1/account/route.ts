import { NextResponse } from "next/server";

import { getAccessState } from "@/server/auth/access";
import { getSessionUser } from "@/server/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED" } },
      { status: 401 },
    );
  }

  const access = await getAccessState(user.uid);
  return NextResponse.json({
    data: {
      hasProductAccess: access.hasProductAccess,
      locale: access.account?.locale ?? "zh-CN",
      status: access.account?.status ?? "active",
      timeZone: access.account?.timeZone ?? "UTC",
    },
  });
}
