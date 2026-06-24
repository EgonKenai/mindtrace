import { NextResponse } from "next/server";

import { getSessionUser } from "@/server/auth/session";
import { assertSameOrigin } from "@/server/http/origin";
import { apiErrorResponse } from "@/server/http/responses";
import {
  deleteJournalEntry,
  getJournalEntry,
  updateJournalEntry,
} from "@/server/services/journal-service";

export const runtime = "nodejs";

interface EntryRouteContext {
  params: Promise<{
    entryId: string;
  }>;
}

export async function GET(_request: Request, context: EntryRouteContext) {
  try {
    const user = await getSessionUser();
    const { entryId } = await context.params;
    const entry = await getJournalEntry(user?.uid, entryId);

    return NextResponse.json({ data: { entry } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: EntryRouteContext) {
  try {
    assertSameOrigin(request);
    const user = await getSessionUser();
    const { entryId } = await context.params;
    const entry = await updateJournalEntry(
      user?.uid,
      entryId,
      await request.json(),
    );

    return NextResponse.json({ data: { entry } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: EntryRouteContext) {
  try {
    assertSameOrigin(request);
    const user = await getSessionUser();
    const { entryId } = await context.params;
    await deleteJournalEntry(user?.uid, entryId);

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
