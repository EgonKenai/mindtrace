import { NextResponse } from "next/server";

import { getAccessState } from "@/server/auth/access";
import { getSessionUser } from "@/server/auth/session";
import { hasCurrentAiProcessingConsent } from "@/server/repositories/account-repository";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED" } },
      { status: 401 },
    );
  }

  const [access, hasAiProcessingConsent] = await Promise.all([
    getAccessState(user.uid),
    hasCurrentAiProcessingConsent(user.uid),
  ]);
  return NextResponse.json({
    data: {
      hasAiProcessingConsent,
      hasProductAccess: access.hasProductAccess,
      locale: access.account?.locale ?? "zh-CN",
      status: access.account?.status ?? "active",
      timeZone: access.account?.timeZone ?? "UTC",
    },
  });
}
