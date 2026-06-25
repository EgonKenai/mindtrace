import { getAccessState } from "@/server/auth/access";
import { hasCurrentAiProcessingConsent } from "@/server/repositories/account-repository";
import { isValidTimeZone } from "@/server/journal/schema";
import {
  AiProcessingConsentRequiredError,
  InvalidRequestError,
  ProductAccessRequiredError,
  UnauthenticatedError,
} from "@/server/http/responses";

export interface ProductDataAccessContext {
  timeZone: string;
  userId: string;
}

export async function requireAiProcessingConsent(
  userId: string,
): Promise<void> {
  if (!(await hasCurrentAiProcessingConsent(userId))) {
    throw new AiProcessingConsentRequiredError();
  }
}

export async function requireProductDataAccess(
  userId: string | null | undefined,
): Promise<ProductDataAccessContext> {
  if (!userId) {
    throw new UnauthenticatedError();
  }

  const access = await getAccessState(userId);

  if (!access.hasProductAccess || !access.account) {
    throw new ProductAccessRequiredError();
  }

  if (!isValidTimeZone(access.account.timeZone)) {
    throw new InvalidRequestError();
  }

  return {
    timeZone: access.account.timeZone,
    userId,
  };
}
