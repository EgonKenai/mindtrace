import { redirect } from "next/navigation";

import { defaultLocale } from "@/i18n/config";
import { getAccessState } from "@/server/auth/access";
import { getSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function LocaleHomePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect(`/${defaultLocale}/login`);
  }

  const access = await getAccessState(user.uid);
  redirect(
    access.hasProductAccess
      ? `/${defaultLocale}/today`
      : `/${defaultLocale}/onboarding/consent`,
  );
}
