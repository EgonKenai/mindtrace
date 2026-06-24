import { NextResponse } from "next/server";

import { getSessionUser } from "@/server/auth/session";
import { assertSameOrigin } from "@/server/http/origin";
import { apiErrorResponse } from "@/server/http/responses";
import {
  createJournalEntry,
  listJournalEntries,
} from "@/server/services/journal-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    const url = new URL(request.url);
    const result = await listJournalEntries(
      user?.uid,
      Object.fromEntries(url.searchParams),
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getSessionUser();
    const entry = await createJournalEntry(user?.uid, await request.json());

    return NextResponse.json({ data: { entry } }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
