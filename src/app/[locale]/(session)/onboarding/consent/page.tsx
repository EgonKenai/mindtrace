import { redirect } from "next/navigation";

import { ConsentForm } from "@/features/consent/components/consent-form";
import { defaultLocale } from "@/i18n/config";
import { zhCN } from "@/i18n/messages/zh-CN";
import { getAccessState, requireSessionPage } from "@/server/auth/access";

export default async function ConsentPage() {
  const user = await requireSessionPage();
  const access = await getAccessState(user.uid);

  if (access.hasProductAccess) {
    redirect(`/${defaultLocale}/today`);
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
