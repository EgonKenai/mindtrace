import type { ReactNode } from "react";

import { requireProductAccessPage } from "@/server/auth/access";

export const dynamic = "force-dynamic";

export default async function ProductLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireProductAccessPage();
  return children;
}
