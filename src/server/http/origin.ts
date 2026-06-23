import { getServerEnv } from "@/server/env";

export class InvalidOriginError extends Error {
  constructor() {
    super("INVALID_ORIGIN");
    this.name = "InvalidOriginError";
  }
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const { APP_ORIGIN } = getServerEnv();

  if (origin !== APP_ORIGIN) {
    throw new InvalidOriginError();
  }
}
