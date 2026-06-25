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
import { zhCN } from "@/i18n/messages/zh-CN";

interface EntryAiFeedbackProps {
  entryId: string;
}

type FeedbackRequestState = "idle" | "checking" | "generating";

function getFallbackMessage(result: FeedbackResult): string {
  return zhCN.aiFeedback.fallback[getFeedbackFallbackKind(result.reasonCodes)];
}

export function EntryAiFeedback({ entryId }: EntryAiFeedbackProps) {
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
      router.replace("/zh-CN/login");
      router.refresh();
      return true;
    }

    if (error.code === "CONSENT_REQUIRED") {
      router.replace("/zh-CN/onboarding/consent");
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
      setFeedback(await generateEntryFeedbackRequest(entryId));
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
          setRequestError(zhCN.aiFeedback.errors.notFound);
          return;
        }

        if (error.code === "RATE_LIMITED") {
          setRequestError(zhCN.aiFeedback.errors.rateLimited);
          return;
        }

        if (error.code === "TIMEOUT") {
          setRequestError(zhCN.aiFeedback.errors.timeout);
          return;
        }
      }

      setRequestError(zhCN.aiFeedback.errors.generic);
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

      setRequestError(zhCN.aiFeedback.errors.consentCheck);
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
      await updateAiConsent(accepted);
      setConsentOpen(false);
      setConsentDeclined(!accepted);

      if (accepted) {
        await generateFeedback();
      }
    } catch (error) {
      if (error instanceof AiFeedbackApiError && handleAccessError(error)) {
        return;
      }

      setConsentError(zhCN.aiFeedback.errors.consentSave);
    } finally {
      setConsentSaving(false);
    }
  }

  const fallbackMessage =
    feedback?.status === "safe_fallback" ? getFallbackMessage(feedback) : null;
  const safetyRedirect = feedback ? isSafetyRedirect(feedback) : false;

  return (
    <section className="entry-detail-section ai-feedback-section">
      <div className="ai-feedback-heading">
        <div>
          <p className="eyebrow">{zhCN.aiFeedback.eyebrow}</p>
          <h2>{zhCN.aiFeedback.title}</h2>
          <p>{zhCN.aiFeedback.intro}</p>
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
            ? zhCN.aiFeedback.actions.checking
            : requestState === "generating"
              ? zhCN.aiFeedback.actions.generating
              : zhCN.aiFeedback.actions.generate}
        </button>
      </div>

      <div className="ai-feedback-disclaimer">
        <Info aria-hidden="true" size={18} />
        <p>{zhCN.aiFeedback.disclaimer}</p>
      </div>

      {consentDeclined && (
        <div className="ai-feedback-notice" role="status">
          <CircleAlert aria-hidden="true" size={20} />
          <p>{zhCN.aiFeedback.consent.declinedStatus}</p>
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
                ? zhCN.aiFeedback.status.crisis
                : feedback.status === "supportive_redirect"
                  ? zhCN.aiFeedback.status.supportive
                  : feedback.status === "safe_fallback"
                    ? zhCN.aiFeedback.status.fallback
                    : zhCN.aiFeedback.status.generated}
            </h3>
          </div>

          {fallbackMessage && (
            <p className="ai-feedback-fallback-message">{fallbackMessage}</p>
          )}
          <p className="ai-feedback-reflection">{feedback.reflection}</p>

          {feedback.suggestions.length > 0 && (
            <>
              <h4>{zhCN.aiFeedback.suggestionsTitle}</h4>
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
