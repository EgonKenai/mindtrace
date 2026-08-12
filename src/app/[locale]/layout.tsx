import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";
import { isSupportedLocale, type AppLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    return {};
  }

  const messages = getMessages(locale);

  return {
    title: {
      default: messages.metadata.title,
      template: `%s | ${messages.metadata.title}`,
    },
    description: messages.metadata.description,
    openGraph: {
      title: messages.metadata.title,
      description: messages.metadata.description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: messages.metadata.title,
      description: messages.metadata.description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const appLocale: AppLocale = locale;

  return (
    <>
      <SiteHeader locale={appLocale} />
      {children}
    </>
  );
}
