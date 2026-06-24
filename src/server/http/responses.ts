import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { InvalidOriginError } from "@/server/http/origin";

export class UnauthenticatedError extends Error {
  constructor() {
    super("UNAUTHENTICATED");
    this.name = "UnauthenticatedError";
  }
}

export class ProductAccessRequiredError extends Error {
  constructor() {
    super("CONSENT_REQUIRED");
    this.name = "ProductAccessRequiredError";
  }
}

export class ResourceNotFoundError extends Error {
  constructor() {
    super("NOT_FOUND");
    this.name = "ResourceNotFoundError";
  }
}

export class InvalidRequestError extends Error {
  constructor() {
    super("INVALID_REQUEST");
    this.name = "InvalidRequestError";
  }
}

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof UnauthenticatedError) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED" } },
      { status: 401 },
    );
  }

  if (error instanceof ProductAccessRequiredError) {
    return NextResponse.json(
      { error: { code: "CONSENT_REQUIRED" } },
      { status: 403 },
    );
  }

  if (error instanceof ResourceNotFoundError) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  if (error instanceof InvalidOriginError) {
    return NextResponse.json(
      { error: { code: "INVALID_ORIGIN" } },
      { status: 403 },
    );
  }

  if (
    error instanceof InvalidRequestError ||
    error instanceof ZodError ||
    error instanceof SyntaxError
  ) {
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
