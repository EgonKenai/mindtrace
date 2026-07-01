"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  defaultLocale,
  localeLabels,
  supportedLocales,
  type AppLocale,
} from "@/i18n/config";

function switchLocale(pathname: string, locale: AppLocale): string {
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = segments[0];

  if (currentLocale && supportedLocales.includes(currentLocale as AppLocale)) {
    return `/${[locale, ...segments.slice(1)].join("/")}`;
  }

  return `/${locale}`;
}

export function LanguageSwitcher() {
  const pathname = usePathname() || `/${defaultLocale}`;
  const currentLocale = pathname.split("/").filter(Boolean)[0];

  return (
    <nav aria-label="Language" className="language-switcher">
      {supportedLocales.map((locale) => (
        <Link
          aria-current={currentLocale === locale ? "page" : undefined}
          href={switchLocale(pathname, locale)}
          key={locale}
        >
          {localeLabels[locale]}
        </Link>
      ))}
    </nav>
  );
}
