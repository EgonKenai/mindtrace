"use client";

import {
  CircleAlert,
  Info,
  LoaderCircle,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { AiConsentDialog } from "@/features/ai-feedback/components/ai-consent-dialog";
import {
  AiFeedbackApiError,
  generateEntryFeedbackRequest,
  getAiConsentStatus,
  updateAiConsent,
} from "@/features/ai-feedback/feedback-api";
import type { FeedbackResult } from "@/features/ai-feedback/model";
import {
  getFeedbackFallbackKind,
  isSafetyRedirect,
} from "@/features/ai-feedback/presentation";
import type { Messages } from "@/i18n/messages";
import { useCurrentLocale, useMessages } from "@/i18n/use-messages";

interface EntryAiFeedbackProps {
  entryId: string;
}

type FeedbackRequestState = "idle" | "checking" | "generating";

function getFallbackMessage(
  result: FeedbackResult,
  messages: Messages,
): string {
  return messages.aiFeedback.fallback[
    getFeedbackFallbackKind(result.reasonCodes)
  ];
}

export function EntryAiFeedback({ entryId }: EntryAiFeedbackProps) {
  const locale = useCurrentLocale();
  const messages = useMessages();
  const router = useRouter();
  const requestInFlightRef = useRef(false);
  const [requestState, setRequestState] =
    useState<FeedbackRequestState>("idle");
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [consentDeclined, setConsentDeclined] = useState(false);

  const busy = requestState !== "idle" || consentSaving;

  function handleAccessError(error: AiFeedbackApiError): boolean {
    if (error.code === "UNAUTHENTICATED") {
      router.replace(`/${locale}/login`);
      router.refresh();
      return true;
    }

    if (error.code === "CONSENT_REQUIRED") {
      router.replace(`/${locale}/onboarding/consent`);
      router.refresh();
      return true;
    }

    return false;
  }

  async function generateFeedback() {
    if (requestInFlightRef.current) {
      return;
    }

    requestInFlightRef.current = true;
    setRequestState("generating");
    setRequestError(null);
    setFeedback(null);

    try {
      setFeedback(await generateEntryFeedbackRequest(entryId, locale));
    } catch (error) {
      if (error instanceof AiFeedbackApiError) {
        if (handleAccessError(error)) {
          return;
        }

        if (error.code === "AI_CONSENT_REQUIRED") {
          setConsentOpen(true);
          return;
        }

        if (error.code === "NOT_FOUND") {
          setRequestError(messages.aiFeedback.errors.notFound);
          return;
        }

        if (error.code === "RATE_LIMITED") {
          setRequestError(messages.aiFeedback.errors.rateLimited);
          return;
        }

        if (error.code === "TIMEOUT") {
          setRequestError(messages.aiFeedback.errors.timeout);
          return;
        }
      }

      setRequestError(messages.aiFeedback.errors.generic);
    } finally {
      requestInFlightRef.current = false;
      setRequestState("idle");
    }
  }

  async function handleGenerate() {
    if (busy || requestInFlightRef.current) {
      return;
    }

    requestInFlightRef.current = true;
    setRequestState("checking");
    setRequestError(null);

    try {
      const hasConsent = await getAiConsentStatus();

      if (!hasConsent) {
        setConsentError(null);
        setConsentOpen(true);
        return;
      }
    } catch (error) {
      if (error instanceof AiFeedbackApiError && handleAccessError(error)) {
        return;
      }

      setRequestError(messages.aiFeedback.errors.consentCheck);
      return;
    } finally {
      requestInFlightRef.current = false;
      setRequestState("idle");
    }

    await generateFeedback();
  }

  async function handleConsent(accepted: boolean) {
    if (consentSaving) {
      return;
    }

    setConsentSaving(true);
    setConsentError(null);

    try {
      await updateAiConsent(accepted, locale);
      setConsentOpen(false);
      setConsentDeclined(!accepted);

      if (accepted) {
        await generateFeedback();
      }
    } catch (error) {
      if (error instanceof AiFeedbackApiError && handleAccessError(error)) {
        return;
      }

      setConsentError(messages.aiFeedback.errors.consentSave);
    } finally {
      setConsentSaving(false);
    }
  }

  const fallbackMessage =
    feedback?.status === "safe_fallback"
      ? getFallbackMessage(feedback, messages)
      : null;
  const safetyRedirect = feedback ? isSafetyRedirect(feedback) : false;

  return (
    <section className="entry-detail-section ai-feedback-section">
      <div className="ai-feedback-heading">
        <div>
          <p className="eyebrow">{messages.aiFeedback.eyebrow}</p>
          <h2>{messages.aiFeedback.title}</h2>
          <p>{messages.aiFeedback.intro}</p>
        </div>
        <button
          className="primary-button"
          disabled={busy}
          onClick={() => void handleGenerate()}
          type="button"
        >
          {busy ? (
            <LoaderCircle
              aria-hidden="true"
              className="button-spinner"
              size={18}
            />
          ) : (
            <Sparkles aria-hidden="true" size={18} />
          )}
          {requestState === "checking"
            ? messages.aiFeedback.actions.checking
            : requestState === "generating"
              ? messages.aiFeedback.actions.generating
              : messages.aiFeedback.actions.generate}
        </button>
      </div>

      <div className="ai-feedback-disclaimer">
        <Info aria-hidden="true" size={18} />
        <p>{messages.aiFeedback.disclaimer}</p>
      </div>

      {consentDeclined && (
        <div className="ai-feedback-notice" role="status">
          <CircleAlert aria-hidden="true" size={20} />
          <p>{messages.aiFeedback.consent.declinedStatus}</p>
        </div>
      )}

      {requestError && (
        <div className="ai-feedback-error" role="alert">
          <TriangleAlert aria-hidden="true" size={20} />
          <p>{requestError}</p>
        </div>
      )}

      {feedback && (
        <div
          className={`ai-feedback-result ai-feedback-result-${feedback.status}`}
          role={safetyRedirect ? "alert" : "status"}
        >
          <div className="ai-feedback-result-title">
            {feedback.status === "crisis_redirect" ? (
              <ShieldAlert aria-hidden="true" size={22} />
            ) : feedback.status === "supportive_redirect" ? (
              <CircleAlert aria-hidden="true" size={22} />
            ) : (
              <Sparkles aria-hidden="true" size={22} />
            )}
            <h3>
              {feedback.status === "crisis_redirect"
                ? messages.aiFeedback.status.crisis
                : feedback.status === "supportive_redirect"
                  ? messages.aiFeedback.status.supportive
                  : feedback.status === "safe_fallback"
                    ? messages.aiFeedback.status.fallback
                    : messages.aiFeedback.status.generated}
            </h3>
          </div>

          {fallbackMessage && (
            <p className="ai-feedback-fallback-message">{fallbackMessage}</p>
          )}
          <p className="ai-feedback-reflection">{feedback.reflection}</p>

          {feedback.suggestions.length > 0 && (
            <>
              <h4>{messages.aiFeedback.suggestionsTitle}</h4>
              <ul>
                {feedback.suggestions.map((suggestion) => (
                  <li key={suggestion}>{suggestion}</li>
                ))}
              </ul>
            </>
          )}

          <p className="ai-feedback-result-disclaimer">{feedback.disclaimer}</p>
        </div>
      )}

      <AiConsentDialog
        errorMessage={consentError}
        onAccept={() => void handleConsent(true)}
        onDecline={() => void handleConsent(false)}
        open={consentOpen}
        saving={consentSaving}
      />
    </section>
  );
}
