import { PlansDashboard } from "@/features/plans/components/plans-dashboard";
import { zhCN } from "@/i18n/messages/zh-CN";

export default function PlansPage() {
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
