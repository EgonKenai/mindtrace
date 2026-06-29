import { LongTermSummaryDashboard } from "@/features/long-term/components/long-term-summary-dashboard";
import { zhCN } from "@/i18n/messages/zh-CN";

export default function LongTermPage() {
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
