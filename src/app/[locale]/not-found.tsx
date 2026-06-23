import Link from "next/link";

import { zhCN } from "@/i18n/messages/zh-CN";

export default function NotFoundPage() {
  return (
    <main className="page-shell narrow-shell">
      <div className="content-heading">
        <h1>{zhCN.notFound.title}</h1>
      </div>
      <Link className="primary-button" href="/zh-CN">
        {zhCN.notFound.action}
      </Link>
    </main>
  );
}
