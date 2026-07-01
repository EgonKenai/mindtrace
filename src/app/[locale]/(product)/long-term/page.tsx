import { LongTermSummaryDashboard } from "@/features/long-term/components/long-term-summary-dashboard";
import {
  defaultLocale,
  isSupportedLocale,
  type AppLocale,
} from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export default async function LongTermPage({
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
    <main className="page-shell trends-shell">
      <div className="content-heading">
        <p className="eyebrow">{zhCN.longTerm.eyebrow}</p>
        <h1>{zhCN.longTerm.title}</h1>
        <p>{zhCN.longTerm.intro}</p>
      </div>
      <LongTermSummaryDashboard />
    </main>
  );
}
