import { redirect } from "next/navigation";

import { AuthForm } from "@/features/auth/components/auth-form";
import { defaultLocale } from "@/i18n/config";
import { getSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await getSessionUser()) {
    redirect(`/${defaultLocale}`);
  }

  return (
    <main className="page-shell auth-shell">
      <AuthForm mode="register" />
    </main>
  );
}
