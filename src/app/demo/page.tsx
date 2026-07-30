import type { Metadata } from "next";
import Link from "next/link";

import { DemoReflectionShowcase } from "@/features/demo/components/demo-reflection-showcase";
import { en } from "@/i18n/messages/en";

export const metadata: Metadata = {
  title: "Demo AI reflection",
  description: "Try MindTrace with one free AI reflection.",
};

export default function DemoPage() {
  const copy = en.demo;

  return (
    <main className="page-shell landing-page demo-page">
      <nav className="demo-topbar" aria-label={copy.navLabel}>
        <Link className="brand-link" href="/en">
          <span>{en.brand.name}</span>
          <small>{en.brand.shortDescription}</small>
        </Link>
        <div className="home-actions">
          <Link className="secondary-button" href="/en/login">
            {copy.login}
          </Link>
          <Link className="primary-button" href="/en/register">
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

      <DemoReflectionShowcase copy={copy} locale="en" />
    </main>
  );
}
