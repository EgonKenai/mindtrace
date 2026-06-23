import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { InvalidOriginError } from "@/server/http/origin";

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof InvalidOriginError) {
    return NextResponse.json(
      { error: { code: "INVALID_ORIGIN" } },
      { status: 403 },
    );
  }

  if (error instanceof ZodError || error instanceof SyntaxError) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST" } },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR" } },
    { status: 500 },
  );
}
