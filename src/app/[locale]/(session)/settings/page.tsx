import Link from "next/link";

import { LogoutButton } from "@/features/auth/components/logout-button";
import type { AppLocale } from "@/i18n/config";
import { isSupportedLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { getAccessState, requireSessionPage } from "@/server/auth/access";

interface SettingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;
  const appLocale: AppLocale = isSupportedLocale(locale) ? locale : "zh-CN";
  const zhCN = getMessages(appLocale);
  const user = await requireSessionPage(appLocale);
  const access = await getAccessState(user.uid);

  return (
    <main className="page-shell narrow-shell">
      <div className="content-heading">
        <h1>{zhCN.settings.title}</h1>
      </div>
      <section aria-labelledby="account-status">
        <h2 id="account-status">{zhCN.settings.accountSection}</h2>
        <div className="settings-list">
          <div className="settings-row">
            <span>{zhCN.settings.timeZoneLabel}</span>
            <strong>{access.account?.timeZone ?? "UTC"}</strong>
          </div>
          <div className="settings-row">
            <span>{zhCN.settings.accountSection}</span>
            <strong className="status-badge">
              {access.hasProductAccess
                ? zhCN.settings.accessReady
                : zhCN.settings.accessPending}
            </strong>
          </div>
        </div>
        {!access.hasProductAccess && (
          <p>
            <Link href={`/${appLocale}/onboarding/consent`}>
              {zhCN.settings.continueConsent}
            </Link>
          </p>
        )}
        <LogoutButton />
      </section>
    </main>
  );
}
