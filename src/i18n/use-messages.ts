"use client";

import { usePathname } from "next/navigation";

import { defaultLocale, isSupportedLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export function useCurrentLocale() {
  const pathname = usePathname();
  const locale = pathname.split("/").filter(Boolean)[0];

  return isSupportedLocale(locale) ? locale : defaultLocale;
}

export function useMessages() {
  return getMessages(useCurrentLocale());
}
