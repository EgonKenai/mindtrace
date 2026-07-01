import Link from "next/link";
import { redirect } from "next/navigation";

import {
  defaultLocale,
  isSupportedLocale,
  type AppLocale,
} from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { getAccessState } from "@/server/auth/access";
import { getSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appLocale: AppLocale = isSupportedLocale(locale)
    ? locale
    : defaultLocale;
  const user = await getSessionUser();

  if (!user) {
    redirect(`/${appLocale}/login`);
  }

  const access = await getAccessState(user.uid);

  if (!access.hasProductAccess) {
    redirect(`/${appLocale}/onboarding/consent`);
  }

  const zhCN = getMessages(appLocale);
  const home = zhCN.home;

  return (
    <main className="page-shell home-dashboard">
      <section className="home-hero" aria-labelledby="home-title">
        <p className="eyebrow">{home.eyebrow}</p>
        <h1 id="home-title">{home.title}</h1>
        <p>{home.intro}</p>
        <div className="home-actions" aria-label={home.actionsLabel}>
          <Link className="primary-button" href={`/${appLocale}/today`}>
            {home.primaryAction}
          </Link>
          <Link className="secondary-button" href={`/${appLocale}/history`}>
            {home.secondaryAction}
          </Link>
        </div>
      </section>

      <section className="demo-flow-section" aria-labelledby="demo-flow-title">
        <div className="section-heading">
          <h2 id="demo-flow-title">{home.demoTitle}</h2>
          <p>{home.demoIntro}</p>
        </div>
        <div className="demo-flow-grid">
          {home.demoSteps.map((step, index) => (
            <Link className="demo-flow-card" href={step.href} key={step.href}>
              <span aria-hidden="true">{index + 1}</span>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-info-grid" aria-label={home.infoAriaLabel}>
        {home.infoCards.map((card) => (
          <article className="home-info-card" key={card.title}>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </section>

      <section className="home-safety-strip" aria-labelledby="home-ai-title">
        <div>
          <h2 id="home-ai-title">{home.aiBoundaryTitle}</h2>
          <p>{home.aiBoundaryBody}</p>
        </div>
        <div className="home-safety-actions">
          <Link className="secondary-button" href={`/${appLocale}/safety`}>
            {home.safetyAction}
          </Link>
          <Link
            className="secondary-button"
            href={`/${appLocale}/product-boundary`}
          >
            {home.boundaryAction}
          </Link>
        </div>
      </section>
    </main>
  );
}
