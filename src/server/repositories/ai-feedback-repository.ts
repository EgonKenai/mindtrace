import type {
  FeedbackPolicyDecision,
  FeedbackResult,
} from "@/features/ai-feedback/model";
import type { FeedbackReasonCode } from "@/lib/validation/ai-feedback";

export interface PersistedAiFeedback {
  createdAt: Date;
  entryRevision: number;
  modelId: string | null;
  policyDecision: FeedbackPolicyDecision;
  providerType: string;
  reasonCodes: FeedbackReasonCode[];
  result: FeedbackResult;
  runtimeStatus: "ready" | "redirected" | "fallback";
  schemaVersion: "1";
}

export interface AiFeedbackRepository {
  saveValidatedFeedback(
    userId: string,
    entryId: string,
    feedback: PersistedAiFeedback,
  ): Promise<void>;
}

// Stage 3A defines the storage boundary but intentionally does not persist
// feedback. A later phase can provide a Firestore adapter without changing the
// service contract or copying raw prompts, provider errors, or journal text.
