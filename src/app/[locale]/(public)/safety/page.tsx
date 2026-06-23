import { zhCN } from "@/i18n/messages/zh-CN";

export default function SafetyPage() {
  return (
    <main className="page-shell">
      <div className="content-heading">
        <h1>{zhCN.safety.title}</h1>
        <p>{zhCN.safety.availability}</p>
      </div>
      <div className="info-grid">
        <section className="info-card safety-alert">
          <h2>{zhCN.safety.urgentTitle}</h2>
          <p>{zhCN.safety.urgentBody}</p>
        </section>
        <section className="info-card">
          <h2>{zhCN.safety.contactTitle}</h2>
          <p>{zhCN.safety.contactBody}</p>
        </section>
        <section className="info-card">
          <h2>{zhCN.safety.professionalTitle}</h2>
          <p>{zhCN.safety.professionalBody}</p>
        </section>
      </div>
    </main>
  );
}
