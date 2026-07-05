import type { ReactNode } from "react";

import { defaultLocale, isSupportedLocale } from "@/i18n/config";
import { requireSessionPage } from "@/server/auth/access";

export const dynamic = "force-dynamic";

export default async function SessionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireSessionPage(isSupportedLocale(locale) ? locale : defaultLocale);
  return children;
}
