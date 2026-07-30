import Link from "next/link";
import { redirect } from "next/navigation";

import { DemoReflectionShowcase } from "@/features/demo/components/demo-reflection-showcase";
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
  const messages = getMessages(appLocale);

  if (!user) {
    return <LandingPage locale={appLocale} messages={messages} />;
  }

  const access = await getAccessState(user.uid);

  if (!access.hasProductAccess) {
    redirect(`/${appLocale}/onboarding/consent`);
  }

  return <DashboardPage locale={appLocale} messages={messages} />;
}

function LandingPage({
  locale,
  messages,
}: {
  locale: AppLocale;
  messages: ReturnType<typeof getMessages>;
}) {
  const landing = messages.landing;

  return (
    <main className="page-shell landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div>
          <p className="eyebrow">{landing.eyebrow}</p>
          <h1 id="landing-title">{landing.title}</h1>
          <p>{landing.intro}</p>
        </div>
        <div className="landing-hero-side">
          <div className="landing-hero-visual" aria-hidden="true">
            <div className="hero-visual-header">
              <span>{landing.visualTitle}</span>
              <strong>{landing.visualPrivacy}</strong>
            </div>
            <div className="hero-visual-score-row">
              <span>{landing.visualMood}</span>
              <div className="hero-visual-meter">
                <span style={{ width: "72%" }} />
              </div>
              <strong>7.2</strong>
            </div>
            <div className="hero-visual-score-row">
              <span>{landing.visualStress}</span>
              <div className="hero-visual-meter hero-visual-meter-accent">
                <span style={{ width: "46%" }} />
              </div>
              <strong>4.6</strong>
            </div>
            <div className="hero-visual-reflection">
              <span>{landing.visualReflection}</span>
              <p>{landing.visualReflectionBody}</p>
            </div>
          </div>
          <div className="home-actions" aria-label={landing.actionsLabel}>
            <Link className="primary-button" href={`/${locale}/register`}>
              {landing.startFree}
            </Link>
            <Link className="secondary-button" href={`/${locale}/login`}>
              {landing.login}
            </Link>
          </div>
        </div>
      </section>

      <section
        className="demo-flow-section"
        aria-labelledby="landing-how-title"
      >
        <div className="section-heading">
          <h2 id="landing-how-title">{landing.howTitle}</h2>
          <p>{landing.howIntro}</p>
        </div>
        <div className="demo-flow-grid landing-how-grid">
          {landing.howSteps.map((step, index) => (
            <article className="demo-flow-card" key={step.title}>
              <span aria-hidden="true">{index + 1}</span>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <DemoReflectionShowcase copy={messages.demo} locale={locale} />

      <section className="home-info-grid" aria-label={landing.benefitsTitle}>
        {landing.benefits.map((benefit) => (
          <article className="home-info-card" key={benefit.title}>
            <h2>{benefit.title}</h2>
            <p>{benefit.body}</p>
          </article>
        ))}
      </section>

      <section className="landing-ai-demo" aria-labelledby="landing-ai-title">
        <div className="section-heading">
          <h2 id="landing-ai-title">{landing.aiDemoTitle}</h2>
          <p>{landing.aiDemoIntro}</p>
        </div>
        <div className="home-info-grid">
          {landing.aiDemoCards.map((card) => (
            <article className="home-info-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="home-safety-strip"
        aria-labelledby="landing-cta-title"
      >
        <div>
          <h2 id="landing-cta-title">{landing.ctaTitle}</h2>
          <p>{landing.ctaBody}</p>
        </div>
        <div className="home-safety-actions">
          <Link className="primary-button" href={`/${locale}/register`}>
            {landing.startFree}
          </Link>
          <Link className="secondary-button" href={`/${locale}/login`}>
            {landing.login}
          </Link>
        </div>
      </section>
    </main>
  );
}

function DashboardPage({
  locale,
  messages,
}: {
  locale: AppLocale;
  messages: ReturnType<typeof getMessages>;
}) {
  const home = messages.home;

  return (
    <main className="page-shell home-dashboard">
      <section className="home-hero" aria-labelledby="home-title">
        <p className="eyebrow">{home.eyebrow}</p>
        <h1 id="home-title">{home.title}</h1>
        <p>{home.intro}</p>
        <div className="home-actions" aria-label={home.actionsLabel}>
          <Link className="primary-button" href={`/${locale}/today`}>
            {home.primaryAction}
          </Link>
          <Link className="secondary-button" href={`/${locale}/history`}>
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
          <Link className="secondary-button" href={`/${locale}/safety`}>
            {home.safetyAction}
          </Link>
          <Link
            className="secondary-button"
            href={`/${locale}/product-boundary`}
          >
            {home.boundaryAction}
          </Link>
        </div>
      </section>
    </main>
  );
}
