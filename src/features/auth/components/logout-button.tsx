"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { zhCN } from "@/i18n/messages/zh-CN";

export function LogoutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function logout() {
    setSubmitting(true);

    try {
      await fetch("/api/v1/auth/session", { method: "DELETE" });
      router.replace("/zh-CN/login");
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
      {submitting ? zhCN.common.loading : zhCN.auth.logoutAction}
    </button>
  );
}
