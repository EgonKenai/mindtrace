"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { defaultLocale } from "@/i18n/config";
import { zhCN } from "@/i18n/messages/zh-CN";

export function ConsentForm() {
  const router = useRouter();
  const defaultTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    [],
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      adultConfirmed: formData.get("adultConfirmed") === "on",
      productBoundaryAccepted: formData.get("productBoundaryAccepted") === "on",
      privacyAccepted: formData.get("privacyAccepted") === "on",
      aiProcessingAccepted: formData.get("aiProcessingAccepted") === "on",
      locale: defaultLocale,
      timeZone: String(formData.get("timeZone") ?? ""),
    };

    if (
      !payload.adultConfirmed ||
      !payload.productBoundaryAccepted ||
      !payload.privacyAccepted
    ) {
      setErrorMessage(zhCN.consent.errors.incomplete);
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/v1/account/consents", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setErrorMessage(
          response.status === 400
            ? zhCN.consent.errors.invalidTimeZone
            : zhCN.consent.errors.saveFailed,
        );
        return;
      }

      router.replace("/zh-CN/today");
      router.refresh();
    } catch {
      setErrorMessage(zhCN.consent.errors.saveFailed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="consent-form" onSubmit={handleSubmit}>
      <section className="consent-section">
        <h2>{zhCN.consent.adultTitle}</h2>
        <p>{zhCN.consent.adultBody}</p>
        <label className="checkbox-field">
          <input name="adultConfirmed" required type="checkbox" />
          <span>{zhCN.consent.adultCheckbox}</span>
        </label>
      </section>

      <section className="consent-section">
        <h2>{zhCN.consent.boundaryTitle}</h2>
        <p>{zhCN.consent.boundaryBody}</p>
        <label className="checkbox-field">
          <input name="productBoundaryAccepted" required type="checkbox" />
          <span>{zhCN.consent.boundaryCheckbox}</span>
        </label>
      </section>

      <section className="consent-section">
        <h2>{zhCN.consent.privacyTitle}</h2>
        <p>{zhCN.consent.privacyBody}</p>
        <label className="checkbox-field">
          <input name="privacyAccepted" required type="checkbox" />
          <span>{zhCN.consent.privacyCheckbox}</span>
        </label>
      </section>

      <section className="consent-section">
        <h2>{zhCN.consent.aiTitle}</h2>
        <p>{zhCN.consent.aiBody}</p>
        <label className="checkbox-field">
          <input name="aiProcessingAccepted" type="checkbox" />
          <span>{zhCN.consent.aiCheckbox}</span>
        </label>
        <small className="field-hint">{zhCN.consent.aiOptionalHint}</small>
      </section>

      <label className="field">
        <span>{zhCN.consent.timeZoneLabel}</span>
        <input
          defaultValue={defaultTimeZone}
          name="timeZone"
          required
          type="text"
        />
        <small className="field-hint">{zhCN.consent.timeZoneHint}</small>
      </label>

      {errorMessage && (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      )}

      <button className="primary-button" disabled={submitting} type="submit">
        {submitting ? zhCN.common.loading : zhCN.consent.submit}
      </button>
    </form>
  );
}
