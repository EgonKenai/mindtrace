import type { ReactNode } from "react";

import { requireSessionPage } from "@/server/auth/access";

export const dynamic = "force-dynamic";

export default async function SessionLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireSessionPage();
  return children;
}
