import {
  defaultLocale,
  isSupportedLocale,
  type AppLocale,
} from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export default async function SafetyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appLocale: AppLocale = isSupportedLocale(locale)
    ? locale
    : defaultLocale;
  const zhCN = getMessages(appLocale);

  return (
    <main className="page-shell">
      <div className="content-heading">
        <h1>{zhCN.safety.title}</h1>
        <p>{zhCN.safety.availability}</p>
      </div>
      <div className="info-grid">
        <section className="info-card safety-alert">
          <h2>{zhCN.safety.urgentTitle}</h2>
          <p>{zhCN.safety.urgentBody}</p>
        </section>
        <section className="info-card">
          <h2>{zhCN.safety.contactTitle}</h2>
          <p>{zhCN.safety.contactBody}</p>
        </section>
        <section className="info-card">
          <h2>{zhCN.safety.professionalTitle}</h2>
          <p>{zhCN.safety.professionalBody}</p>
        </section>
      </div>
    </main>
  );
}
