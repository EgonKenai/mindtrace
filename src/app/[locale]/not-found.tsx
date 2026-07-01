"use client";

import Link from "next/link";

import { useCurrentLocale, useMessages } from "@/i18n/use-messages";

export default function NotFoundPage() {
  const locale = useCurrentLocale();
  const zhCN = useMessages();

  return (
    <main className="page-shell narrow-shell">
      <div className="content-heading">
        <h1>{zhCN.notFound.title}</h1>
      </div>
      <Link className="primary-button" href={`/${locale}`}>
        {zhCN.notFound.action}
      </Link>
    </main>
  );
}
