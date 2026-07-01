import { TrendsDashboard } from "@/features/trends/components/trends-dashboard";
import {
  defaultLocale,
  isSupportedLocale,
  type AppLocale,
} from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export default async function TrendsPage({
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
        <p className="eyebrow">{zhCN.trends.eyebrow}</p>
        <h1>{zhCN.trends.title}</h1>
        <p>{zhCN.trends.intro}</p>
      </div>
      <TrendsDashboard />
    </main>
  );
}
