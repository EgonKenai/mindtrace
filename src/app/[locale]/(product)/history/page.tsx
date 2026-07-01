import { JournalHistory } from "@/features/journal/components/journal-history";
import {
  defaultLocale,
  isSupportedLocale,
  type AppLocale,
} from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export default async function HistoryPage({
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
        <p className="eyebrow">{zhCN.journal.history.eyebrow}</p>
        <h1>{zhCN.journal.history.title}</h1>
        <p>{zhCN.journal.history.intro}</p>
      </div>
      <JournalHistory />
    </main>
  );
}
