import type { ReactNode } from "react";

import { isSupportedLocale } from "@/i18n/config";
import { requireProductAccessPage } from "@/server/auth/access";

export const dynamic = "force-dynamic";

export default async function ProductLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireProductAccessPage(isSupportedLocale(locale) ? locale : "zh-CN");
  return children;
}
