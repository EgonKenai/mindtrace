import Link from "next/link";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { zhCN } from "@/i18n/messages/zh-CN";
import { getAccessState, requireSessionPage } from "@/server/auth/access";

export default async function SettingsPage() {
  const user = await requireSessionPage();
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
            <Link href="/zh-CN/onboarding/consent">
              {zhCN.settings.continueConsent}
            </Link>
          </p>
        )}
        <LogoutButton />
      </section>
    </main>
  );
}
