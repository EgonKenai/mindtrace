"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import type { FeedbackResult } from "@/features/ai-feedback/model";
import type { AppLocale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { MAX_DEMO_REFLECTION_NOTE_CHARACTERS } from "@/lib/validation/demo-feedback";

interface DemoReflectionFormProps {
  copy: Messages["demo"];
  locale: AppLocale;
}

interface DemoReflectionResponse {
  data?: {
    reflection: FeedbackResult;
    remaining: number;
  };
  error?: {
    code: string;
  };
}

function mapErrorMessage(code: string | undefined, copy: Messages["demo"]) {
  switch (code) {
    case "DEMO_LIMIT_REACHED":
      return copy.errors.limitReached;
    case "INVALID_ORIGIN":
    case "INVALID_REQUEST":
      return copy.errors.invalid;
    default:
      return copy.errors.generic;
  }
}

function formatTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce(
    (formatted, [key, value]) =>
      formatted.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function DemoReflectionForm({ copy, locale }: DemoReflectionFormProps) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setResult(null);

    if (!note.trim()) {
      setErrorMessage(copy.errors.required);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/v1/demo/reflection", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          locale,
          note,
        }),
      });
      const body = (await response.json()) as DemoReflectionResponse;

      if (!response.ok || !body.data) {
        setErrorMessage(mapErrorMessage(body.error?.code, copy));
        return;
      }

      setResult(body.data.reflection);
      setRemaining(body.data.remaining);
    } catch {
      setErrorMessage(copy.errors.generic);
    } finally {
      setSubmitting(false);
    }
  }

  const characterCount = Array.from(note).length;

  return (
    <div className="demo-reflection-panel">
      <form className="stack-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>{copy.inputLabel}</span>
          <textarea
            maxLength={MAX_DEMO_REFLECTION_NOTE_CHARACTERS}
            name="note"
            onChange={(event) => setNote(event.target.value)}
            placeholder={copy.placeholder}
            rows={7}
            value={note}
          />
          <small className="field-hint">
            {formatTemplate(copy.characterCount, {
              current: characterCount,
              maximum: MAX_DEMO_REFLECTION_NOTE_CHARACTERS,
            })}
          </small>
        </label>

        <p className="field-hint">{copy.privacyNotice}</p>

        {errorMessage && (
          <p className="form-error" role="alert">
            {errorMessage}
          </p>
        )}

        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? copy.generating : copy.generate}
        </button>
      </form>

      {result && (
        <section className="demo-reflection-result" aria-live="polite">
          <div className="section-heading">
            <p className="eyebrow">{copy.resultEyebrow}</p>
            <h2>{copy.resultTitle}</h2>
            <p>{result.disclaimer}</p>
          </div>

          <div className="home-info-card">
            <h3>{copy.reflectionTitle}</h3>
            <p>
              {result.status === "safe_fallback"
                ? copy.fallbackReflection
                : result.reflection}
            </p>
          </div>

          {result.suggestions.length > 0 && (
            <div className="home-info-card">
              <h3>{copy.suggestionsTitle}</h3>
              <ul className="demo-suggestion-list">
                {result.suggestions.map((suggestion) => (
                  <li key={suggestion}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {remaining !== null && (
            <p className="field-hint">
              {formatTemplate(copy.remaining, { count: remaining })}
            </p>
          )}

          <div className="home-actions">
            <Link className="primary-button" href={`/${locale}/register`}>
              {copy.createAccount}
            </Link>
            <Link className="secondary-button" href={`/${locale}/login`}>
              {copy.login}
            </Link>
            <Link className="secondary-button" href={`/${locale}`}>
              {copy.productOverview}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
