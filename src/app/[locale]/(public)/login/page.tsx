import { redirect } from "next/navigation";

import { AuthForm } from "@/features/auth/components/auth-form";
import {
  defaultLocale,
  isSupportedLocale,
  type AppLocale,
} from "@/i18n/config";
import { getSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appLocale: AppLocale = isSupportedLocale(locale)
    ? locale
    : defaultLocale;

  if (await getSessionUser()) {
    redirect(`/${appLocale}`);
  }

  return (
    <main className="page-shell auth-shell">
      <AuthForm mode="login" />
    </main>
  );
}
