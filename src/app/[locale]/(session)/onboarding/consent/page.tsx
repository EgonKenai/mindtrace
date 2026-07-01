import { redirect } from "next/navigation";

import { ConsentForm } from "@/features/consent/components/consent-form";
import {
  defaultLocale,
  isSupportedLocale,
  type AppLocale,
} from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { getAccessState, requireSessionPage } from "@/server/auth/access";

export default async function ConsentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appLocale: AppLocale = isSupportedLocale(locale)
    ? locale
    : defaultLocale;
  const zhCN = getMessages(appLocale);
  const user = await requireSessionPage(appLocale);
  const access = await getAccessState(user.uid);

  if (access.hasProductAccess) {
    redirect(`/${appLocale}/today`);
  }

  return (
    <main className="page-shell narrow-shell">
      <div className="content-heading">
        <p className="eyebrow">{zhCN.consent.eyebrow}</p>
        <h1>{zhCN.consent.title}</h1>
        <p>{zhCN.consent.intro}</p>
      </div>
      <ConsentForm />
    </main>
  );
}
