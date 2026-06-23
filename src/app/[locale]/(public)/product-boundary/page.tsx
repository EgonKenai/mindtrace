import { zhCN } from "@/i18n/messages/zh-CN";

export default function ProductBoundaryPage() {
  return (
    <main className="page-shell">
      <div className="content-heading">
        <h1>{zhCN.boundary.title}</h1>
        <p>{zhCN.boundary.intro}</p>
      </div>
      <div className="info-grid">
        <section className="info-card">
          <h2>{zhCN.boundary.notTherapyTitle}</h2>
          <p>{zhCN.boundary.notTherapyBody}</p>
        </section>
        <section className="info-card">
          <h2>{zhCN.boundary.uncertaintyTitle}</h2>
          <p>{zhCN.boundary.uncertaintyBody}</p>
        </section>
        <section className="info-card">
          <h2>{zhCN.boundary.controlTitle}</h2>
          <p>{zhCN.boundary.controlBody}</p>
        </section>
      </div>
    </main>
  );
}
