"use client";

import {
  CheckCircle2,
  Sparkles,
  LoaderCircle,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  ActionPlan,
  PlanAction,
  PlanSuggestionDraft,
  PlanStatus,
} from "@/features/plans/model";
import {
  acceptPlanSuggestionRequest,
  completePlanActionRequest,
  createPlanActionRequest,
  createPlanRequest,
  deletePlanRequest,
  dismissPlanSuggestionRequest,
  generatePlanSuggestionRequest,
  listPlansRequest,
  PlansApiError,
  updatePlanStatusRequest,
} from "@/features/plans/plans-api";
import type { CreatePlanActionInput } from "@/lib/validation/plans";
import { useCurrentLocale, useMessages } from "@/i18n/use-messages";

function getTodayLocalDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function replacePlan(plans: ActionPlan[], updated: ActionPlan): ActionPlan[] {
  return plans.map((plan) => (plan.id === updated.id ? updated : plan));
}

function upsertPlan(plans: ActionPlan[], updated: ActionPlan): ActionPlan[] {
  return [updated, ...plans.filter((plan) => plan.id !== updated.id)];
}

function appendUniqueAction(
  actions: PlanAction[],
  action: PlanAction,
): PlanAction[] {
  return [
    ...actions.filter((currentAction) => currentAction.id !== action.id),
    action,
  ];
}

function replaceAction(
  plan: ActionPlan,
  updatedAction: PlanAction,
): ActionPlan {
  return {
    ...plan,
    actions: plan.actions.map((action) =>
      action.id === updatedAction.id ? updatedAction : action,
    ),
  };
}

export function PlansDashboard() {
  const locale = useCurrentLocale();
  const zhCN = useMessages();
  const router = useRouter();
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [actionTitles, setActionTitles] = useState<Record<string, string>>({});
  const [suggestionWindow, setSuggestionWindow] = useState<7 | 14 | 30>(7);
  const [suggestion, setSuggestion] = useState<PlanSuggestionDraft | null>(
    null,
  );
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionSaving, setSuggestionSaving] = useState(false);
  const [suggestionDismissing, setSuggestionDismissing] = useState(false);
  const [suggestionStatus, setSuggestionStatus] = useState<string | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const hasPlans = plans.length > 0;
  const today = useMemo(() => getTodayLocalDate(), []);

  const redirectForAccessError = useCallback(
    (requestError: PlansApiError): boolean => {
      if (requestError.code === "UNAUTHENTICATED") {
        router.replace(`/${locale}/login`);
        router.refresh();
        return true;
      }

      if (requestError.code === "CONSENT_REQUIRED") {
        router.replace(`/${locale}/onboarding/consent`);
        router.refresh();
        return true;
      }

      return false;
    },
    [locale, router],
  );

  const loadPlans = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(false);

      try {
        setPlans(await listPlansRequest(signal));
      } catch (requestError) {
        if (signal?.aborted) {
          return;
        }

        if (
          requestError instanceof PlansApiError &&
          redirectForAccessError(requestError)
        ) {
          return;
        }

        setError(true);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [redirectForAccessError],
  );

  useEffect(() => {
    const controller = new AbortController();

    void listPlansRequest(controller.signal)
      .then((result) => setPlans(result))
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (
          requestError instanceof PlansApiError &&
          redirectForAccessError(requestError)
        ) {
          return;
        }

        setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [redirectForAccessError]);

  async function submitPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      const plan = await createPlanRequest({
        checkInFrequency: "none",
        description,
        linkedTags: [],
        sourceType: "manual",
        startDate: today,
        targetDate: null,
        title,
      });
      setPlans((currentPlans) => upsertPlan(currentPlans, plan));
      setTitle("");
      setDescription("");
    } catch (requestError) {
      if (
        requestError instanceof PlansApiError &&
        redirectForAccessError(requestError)
      ) {
        return;
      }

      setFormError(zhCN.plans.errors.saveFailed);
    } finally {
      setSubmitting(false);
    }
  }

  async function generateSuggestion() {
    if (suggestionLoading) {
      return;
    }

    setSuggestionLoading(true);
    setSuggestionError(null);
    setSuggestionStatus(null);

    try {
      const result = await generatePlanSuggestionRequest(
        suggestionWindow,
        locale,
      );
      setSuggestion(result.suggestion);

      if (result.status === "generated") {
        setSuggestionStatus(zhCN.plans.suggestions.generatedStatus);
      } else if (result.status === "insufficient_data") {
        setSuggestionStatus(zhCN.plans.suggestions.insufficientData);
      } else {
        setSuggestionStatus(zhCN.plans.suggestions.fallback);
      }
    } catch (requestError) {
      if (
        requestError instanceof PlansApiError &&
        redirectForAccessError(requestError)
      ) {
        return;
      }

      if (
        requestError instanceof PlansApiError &&
        requestError.code === "AI_CONSENT_REQUIRED"
      ) {
        setSuggestionStatus(zhCN.plans.suggestions.consentRequired);
        return;
      }

      setSuggestionError(zhCN.plans.suggestions.errors.generic);
    } finally {
      setSuggestionLoading(false);
    }
  }

  async function saveSuggestion() {
    if (!suggestion || suggestionSaving) {
      return;
    }

    setSuggestionSaving(true);
    setSuggestionError(null);

    try {
      const result = await acceptPlanSuggestionRequest(suggestion.id);
      setPlans((currentPlans) => upsertPlan(currentPlans, result.plan));
      setSuggestion(result.suggestion);
      setSuggestionStatus(zhCN.plans.suggestions.savedStatus);
    } catch (requestError) {
      if (
        requestError instanceof PlansApiError &&
        redirectForAccessError(requestError)
      ) {
        return;
      }

      setSuggestionError(zhCN.plans.suggestions.errors.saveFailed);
    } finally {
      setSuggestionSaving(false);
    }
  }

  async function dismissSuggestion() {
    if (!suggestion || suggestionDismissing) {
      return;
    }

    setSuggestionDismissing(true);
    setSuggestionError(null);

    try {
      const dismissed = await dismissPlanSuggestionRequest(suggestion.id);
      setSuggestion(dismissed);
      setSuggestionStatus(zhCN.plans.suggestions.dismissedStatus);
    } catch (requestError) {
      if (
        requestError instanceof PlansApiError &&
        redirectForAccessError(requestError)
      ) {
        return;
      }

      setSuggestionError(zhCN.plans.suggestions.errors.dismissFailed);
    } finally {
      setSuggestionDismissing(false);
    }
  }

  async function updateStatus(planId: string, status: PlanStatus) {
    setFormError(null);
    try {
      const updated = await updatePlanStatusRequest(planId, status);
      setPlans((currentPlans) => replacePlan(currentPlans, updated));
    } catch (requestError) {
      if (
        requestError instanceof PlansApiError &&
        redirectForAccessError(requestError)
      ) {
        return;
      }

      setFormError(zhCN.plans.errors.saveFailed);
    }
  }

  async function addAction(planId: string) {
    const actionTitle = actionTitles[planId]?.trim() ?? "";

    if (!actionTitle) {
      setFormError(zhCN.plans.errors.actionTitleRequired);
      return;
    }

    const input: CreatePlanActionInput = {
      description: "",
      dueDate: null,
      title: actionTitle,
    };

    setFormError(null);
    try {
      const action = await createPlanActionRequest(planId, input);
      setPlans((currentPlans) =>
        currentPlans.map((plan) =>
          plan.id === planId
            ? { ...plan, actions: appendUniqueAction(plan.actions, action) }
            : plan,
        ),
      );
      setActionTitles((currentTitles) => ({ ...currentTitles, [planId]: "" }));
    } catch (requestError) {
      if (
        requestError instanceof PlansApiError &&
        redirectForAccessError(requestError)
      ) {
        return;
      }

      setFormError(zhCN.plans.errors.saveFailed);
    }
  }

  async function completeAction(planId: string, actionId: string) {
    setFormError(null);
    try {
      const action = await completePlanActionRequest(planId, actionId);
      setPlans((currentPlans) =>
        currentPlans.map((plan) =>
          plan.id === planId ? replaceAction(plan, action) : plan,
        ),
      );
    } catch (requestError) {
      if (
        requestError instanceof PlansApiError &&
        redirectForAccessError(requestError)
      ) {
        return;
      }

      setFormError(zhCN.plans.errors.saveFailed);
    }
  }

  async function removePlan(planId: string) {
    setFormError(null);
    try {
      await deletePlanRequest(planId);
      setPlans((currentPlans) =>
        currentPlans.filter((plan) => plan.id !== planId),
      );
    } catch (requestError) {
      if (
        requestError instanceof PlansApiError &&
        redirectForAccessError(requestError)
      ) {
        return;
      }

      setFormError(zhCN.plans.errors.deleteFailed);
    }
  }

  return (
    <div className="plans-dashboard">
      <section
        aria-labelledby="plan-suggestion-title"
        className="plan-suggestion-panel"
      >
        <div className="ai-feedback-heading">
          <div>
            <p className="eyebrow">{zhCN.aiFeedback.eyebrow}</p>
            <h2 id="plan-suggestion-title">{zhCN.plans.suggestions.title}</h2>
            <p>{zhCN.plans.suggestions.intro}</p>
          </div>
          <button
            className="primary-button"
            disabled={suggestionLoading}
            onClick={() => void generateSuggestion()}
            type="button"
          >
            {suggestionLoading ? (
              <LoaderCircle
                aria-hidden="true"
                className="button-spinner"
                size={18}
              />
            ) : (
              <Sparkles aria-hidden="true" size={18} />
            )}
            {suggestionLoading
              ? zhCN.plans.suggestions.generating
              : zhCN.plans.suggestions.generate}
          </button>
        </div>

        <div className="plan-suggestion-controls">
          <span className="journal-field-label">
            {zhCN.plans.suggestions.windowLabel}
          </span>
          <div className="window-tabs" role="tablist">
            {([7, 14, 30] as const).map((windowDays) => (
              <button
                aria-selected={suggestionWindow === windowDays}
                className="secondary-button"
                key={windowDays}
                onClick={() => setSuggestionWindow(windowDays)}
                role="tab"
                type="button"
              >
                {zhCN.longTerm.windowLabel(windowDays)}
              </button>
            ))}
          </div>
        </div>

        <div className="ai-feedback-disclaimer">
          <Sparkles aria-hidden="true" size={18} />
          <p>{zhCN.plans.suggestions.disclaimer}</p>
        </div>

        {suggestionStatus && (
          <div className="ai-feedback-notice" role="status">
            <CheckCircle2 aria-hidden="true" size={18} />
            <p>{suggestionStatus}</p>
          </div>
        )}

        {suggestionError && (
          <div className="ai-feedback-error" role="alert">
            <RefreshCw aria-hidden="true" size={18} />
            <p>{suggestionError}</p>
          </div>
        )}

        {suggestion && (
          <article className="plan-suggestion-draft">
            <h3>{suggestion.title}</h3>
            <p>{suggestion.description}</p>
            <section>
              <h4>{zhCN.plans.suggestions.rationaleTitle}</h4>
              <p>{suggestion.rationale}</p>
            </section>
            <section>
              <h4>{zhCN.plans.suggestions.actionsTitle}</h4>
              <ul className="plan-action-list">
                {suggestion.suggestedActions.map((action) => (
                  <li key={`${action.title}-${action.suggestedDueInDays}`}>
                    <span>
                      {action.title}
                      {action.description ? ` - ${action.description}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            {suggestion.status === "draft" && (
              <div className="form-actions">
                <button
                  className="secondary-button"
                  disabled={suggestionDismissing || suggestionSaving}
                  onClick={() => void dismissSuggestion()}
                  type="button"
                >
                  {suggestionDismissing ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="button-spinner"
                      size={18}
                    />
                  ) : null}
                  {suggestionDismissing
                    ? zhCN.plans.suggestions.dismissing
                    : zhCN.plans.suggestions.dismiss}
                </button>
                <button
                  className="primary-button"
                  disabled={suggestionSaving || suggestionDismissing}
                  onClick={() => void saveSuggestion()}
                  type="button"
                >
                  {suggestionSaving ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="button-spinner"
                      size={18}
                    />
                  ) : (
                    <CheckCircle2 aria-hidden="true" size={18} />
                  )}
                  {suggestionSaving
                    ? zhCN.plans.suggestions.saving
                    : zhCN.plans.suggestions.save}
                </button>
              </div>
            )}
          </article>
        )}
      </section>

      <form className="plan-create-form" onSubmit={submitPlan}>
        <div className="journal-field">
          <label className="journal-field-label" htmlFor="plan-title">
            {zhCN.plans.form.titleLabel}
          </label>
          <input
            id="plan-title"
            maxLength={120}
            onChange={(event) => setTitle(event.target.value)}
            required
            type="text"
            value={title}
          />
        </div>
        <div className="journal-field">
          <label className="journal-field-label" htmlFor="plan-description">
            {zhCN.plans.form.descriptionLabel}
          </label>
          <textarea
            id="plan-description"
            maxLength={1000}
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
        </div>
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <div className="form-actions">
          <button
            className="primary-button"
            disabled={submitting}
            type="submit"
          >
            {submitting ? (
              <LoaderCircle
                aria-hidden="true"
                className="button-spinner"
                size={18}
              />
            ) : (
              <Plus aria-hidden="true" size={18} />
            )}
            {submitting
              ? zhCN.plans.actions.creating
              : zhCN.plans.actions.create}
          </button>
        </div>
      </form>

      {loading && (
        <div className="journal-status" role="status">
          <LoaderCircle
            aria-hidden="true"
            className="button-spinner"
            size={22}
          />
          <p>{zhCN.plans.loading}</p>
        </div>
      )}

      {!loading && error && (
        <section className="journal-empty-state" role="alert">
          <RefreshCw aria-hidden="true" size={28} />
          <h2>{zhCN.plans.errorTitle}</h2>
          <p>{zhCN.plans.errorBody}</p>
          <button
            className="secondary-button"
            onClick={() => void loadPlans()}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={18} />
            {zhCN.common.retryAction}
          </button>
        </section>
      )}

      {!loading && !error && !hasPlans && (
        <section className="journal-empty-state" role="status">
          <CheckCircle2 aria-hidden="true" size={28} />
          <h2>{zhCN.plans.emptyTitle}</h2>
          <p>{zhCN.plans.emptyBody}</p>
        </section>
      )}

      {!loading && !error && hasPlans && (
        <div className="plan-list" aria-live="polite">
          {plans.map((plan) => (
            <article className="plan-card" key={plan.id}>
              <div className="entry-card-header">
                <div>
                  <h2>{plan.title}</h2>
                  <p>{plan.description || zhCN.plans.noDescription}</p>
                  <p className="entry-time-zone">
                    {zhCN.plans.meta(
                      zhCN.plans.statuses[plan.status],
                      zhCN.plans.frequencies[plan.checkInFrequency],
                    )}
                  </p>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => void removePlan(plan.id)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={18} />
                  {zhCN.plans.actions.delete}
                </button>
              </div>

              <div className="plan-status-actions">
                {(["active", "paused", "completed", "abandoned"] as const).map(
                  (status) => (
                    <button
                      aria-pressed={plan.status === status}
                      className="secondary-button"
                      key={status}
                      onClick={() => void updateStatus(plan.id, status)}
                      type="button"
                    >
                      {zhCN.plans.statuses[status]}
                    </button>
                  ),
                )}
              </div>

              <section className="plan-actions-section">
                <h3>{zhCN.plans.actionsTitle}</h3>
                {plan.actions.length === 0 ? (
                  <p>{zhCN.plans.noActions}</p>
                ) : (
                  <ul className="plan-action-list">
                    {plan.actions.map((action) => (
                      <li key={action.id}>
                        <span>
                          {action.title} -{" "}
                          {zhCN.plans.actionStatuses[action.status]}
                        </span>
                        {action.status !== "done" && (
                          <button
                            className="secondary-button"
                            onClick={() =>
                              void completeAction(plan.id, action.id)
                            }
                            type="button"
                          >
                            <CheckCircle2 aria-hidden="true" size={18} />
                            {zhCN.plans.actions.completeAction}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="plan-action-create">
                  <label
                    className="journal-field-label"
                    htmlFor={`action-title-${plan.id}`}
                  >
                    {zhCN.plans.form.actionTitleLabel}
                  </label>
                  <input
                    id={`action-title-${plan.id}`}
                    maxLength={120}
                    onChange={(event) =>
                      setActionTitles((currentTitles) => ({
                        ...currentTitles,
                        [plan.id]: event.target.value,
                      }))
                    }
                    type="text"
                    value={actionTitles[plan.id] ?? ""}
                  />
                  <button
                    className="secondary-button"
                    onClick={() => void addAction(plan.id)}
                    type="button"
                  >
                    <Plus aria-hidden="true" size={18} />
                    {zhCN.plans.actions.addAction}
                  </button>
                </div>
              </section>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
