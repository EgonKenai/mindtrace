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

  if (!access.hasProductAccess) {
    return NextResponse.json(
      { error: { code: "CONSENT_REQUIRED" } },
      { status: 403 },
    );
  }

  return NextResponse.json({ data: { ready: true } });
}
