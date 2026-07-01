import { TodayJournal } from "@/features/journal/components/today-journal";
import {
  defaultLocale,
  isSupportedLocale,
  type AppLocale,
} from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export default async function TodayPage({
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
        <p className="eyebrow">{zhCN.journal.today.eyebrow}</p>
        <h1>{zhCN.journal.today.title}</h1>
        <p>{zhCN.journal.today.intro}</p>
      </div>
      <TodayJournal />
    </main>
  );
}
