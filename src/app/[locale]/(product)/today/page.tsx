import { zhCN } from "@/i18n/messages/zh-CN";

export default function TodayPage() {
  return (
    <main className="page-shell narrow-shell">
      <div className="content-heading">
        <h1>{zhCN.home.todayTitle}</h1>
      </div>
      <section className="info-card">
        <h2>{zhCN.home.readyTitle}</h2>
        <p>{zhCN.home.pendingFeature}</p>
      </section>
    </main>
  );
}
