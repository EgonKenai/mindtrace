import { TodayJournal } from "@/features/journal/components/today-journal";
import { zhCN } from "@/i18n/messages/zh-CN";

export default function TodayPage() {
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
