import { JournalHistory } from "@/features/journal/components/journal-history";
import { zhCN } from "@/i18n/messages/zh-CN";

export default function HistoryPage() {
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
