import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DemoReflectionShowcase } from "@/features/demo/components/demo-reflection-showcase";
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

  const copy = getMessages(locale).demo;

  return {
    title: copy.title,
    description: copy.intro,
  };
}

export default async function LocalizedDemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const appLocale: AppLocale = locale;
  const messages = getMessages(appLocale);
  const copy = messages.demo;
  const prefix = `/${appLocale}`;

  return (
    <main className="page-shell landing-page demo-page">
      <nav className="demo-topbar" aria-label={copy.navLabel}>
        <Link className="secondary-button" href={prefix}>
          {copy.productOverview}
        </Link>
        <div className="home-actions">
          <Link className="secondary-button" href={`${prefix}/login`}>
            {copy.login}
          </Link>
          <Link className="primary-button" href={`${prefix}/register`}>
            {copy.startFree}
          </Link>
        </div>
      </nav>

      <section className="landing-hero demo-hero" aria-labelledby="demo-title">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 id="demo-title">{copy.title}</h1>
          <p>{copy.intro}</p>
        </div>
      </section>

      <DemoReflectionShowcase copy={copy} locale={appLocale} />
    </main>
  );
}
