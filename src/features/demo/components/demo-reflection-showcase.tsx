import type { AppLocale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

import { DemoReflectionForm } from "./demo-reflection-form";

interface DemoReflectionShowcaseProps {
  copy: Messages["demo"];
  locale: AppLocale;
}

export function DemoReflectionShowcase({
  copy,
  locale,
}: DemoReflectionShowcaseProps) {
  return (
    <section
      className="demo-showcase-section"
      aria-labelledby="demo-showcase-title"
    >
      <div className="section-heading demo-showcase-heading">
        <p className="eyebrow">{copy.showcaseEyebrow}</p>
        <h2 id="demo-showcase-title">{copy.showcaseTitle}</h2>
        <p>{copy.showcaseIntro}</p>
      </div>

      <div className="demo-experience-grid" aria-label={copy.formAriaLabel}>
        <DemoReflectionForm copy={copy} locale={locale} />

        <aside className="demo-side-note">
          <h3>{copy.limitsTitle}</h3>
          <ul>
            {copy.limits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
