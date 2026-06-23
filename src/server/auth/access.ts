import type { DecodedIdToken } from "firebase-admin/auth";
import { redirect } from "next/navigation";

import { defaultLocale } from "@/i18n/config";
import { getSessionUser } from "@/server/auth/session";
import {
  getAccount,
  hasCurrentConsent,
  type AccountRecord,
} from "@/server/repositories/account-repository";

export interface AccessState {
  account: AccountRecord | null;
  hasProductAccess: boolean;
}

export function evaluateProductAccess(
  account: AccountRecord | null,
  currentConsent: boolean,
): boolean {
  return (
    account?.status === "active" &&
    Boolean(account.adultConfirmedAt) &&
    currentConsent
  );
}

export async function getAccessState(userId: string): Promise<AccessState> {
  const [account, currentConsent] = await Promise.all([
    getAccount(userId),
    hasCurrentConsent(userId),
  ]);

  return {
    account,
    hasProductAccess: evaluateProductAccess(account, currentConsent),
  };
}

export async function requireSessionPage(): Promise<DecodedIdToken> {
  const user = await getSessionUser();

  if (!user) {
    redirect(`/${defaultLocale}/login`);
  }

  return user;
}

export async function requireProductAccessPage(): Promise<{
  access: AccessState;
  user: DecodedIdToken;
}> {
  const user = await requireSessionPage();
  const access = await getAccessState(user.uid);

  if (!access.hasProductAccess) {
    redirect(`/${defaultLocale}/onboarding/consent`);
  }

  return { access, user };
}
