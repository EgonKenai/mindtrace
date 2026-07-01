import { PlansDashboard } from "@/features/plans/components/plans-dashboard";
import {
  defaultLocale,
  isSupportedLocale,
  type AppLocale,
} from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export default async function PlansPage({
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
    <main className="page-shell journal-shell">
      <div className="content-heading">
        <p className="eyebrow">{zhCN.plans.eyebrow}</p>
        <h1>{zhCN.plans.title}</h1>
        <p>{zhCN.plans.intro}</p>
      </div>
      <PlansDashboard />
    </main>
  );
}
