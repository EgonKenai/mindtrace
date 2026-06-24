import { TrendsDashboard } from "@/features/trends/components/trends-dashboard";
import { zhCN } from "@/i18n/messages/zh-CN";

export default function TrendsPage() {
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
