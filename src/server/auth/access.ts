import type { DecodedIdToken } from "firebase-admin/auth";
import { redirect } from "next/navigation";

import { defaultLocale, type AppLocale } from "@/i18n/config";
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

export async function requireSessionPage(
  locale: AppLocale = defaultLocale,
): Promise<DecodedIdToken> {
  const user = await getSessionUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return user;
}

export async function requireProductAccessPage(
  locale: AppLocale = defaultLocale,
): Promise<{
  access: AccessState;
  user: DecodedIdToken;
}> {
  const user = await requireSessionPage(locale);
  const access = await getAccessState(user.uid);

  if (!access.hasProductAccess) {
    redirect(`/${locale}/onboarding/consent`);
  }

  return { access, user };
}
