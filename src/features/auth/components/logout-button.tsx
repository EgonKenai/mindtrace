"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCurrentLocale, useMessages } from "@/i18n/use-messages";

export function LogoutButton() {
  const locale = useCurrentLocale();
  const messages = useMessages();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function logout() {
    setSubmitting(true);

    try {
      await fetch("/api/v1/auth/session", { method: "DELETE" });
      router.replace(`/${locale}/login`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      className="secondary-button"
      disabled={submitting}
      onClick={logout}
      type="button"
    >
      <LogOut aria-hidden="true" size={17} />
      {submitting ? messages.common.loading : messages.auth.logoutAction}
    </button>
  );
}
