import { FieldValue } from "firebase-admin/firestore";

import type {
  AiProcessingConsentSubmission,
  ConsentSubmission,
} from "@/lib/validation/consent";
import {
  CONSENT_VERSIONS,
  CURRENT_AI_PROCESSING_CONSENT_ID,
  CURRENT_PRODUCT_CONSENT_ID,
} from "@/server/consent/constants";
import { getAdminFirestore } from "@/server/firebase/admin";

function aiProcessingConsentData(
  input: AiProcessingConsentSubmission,
): Record<string, unknown> {
  return {
    accepted: input.accepted,
    aiProcessingVersion: CONSENT_VERSIONS.aiProcessing,
    decidedAt: FieldValue.serverTimestamp(),
    locale: input.locale,
  };
}

export async function recordConsent(
  userId: string,
  input: ConsentSubmission,
): Promise<void> {
  const db = getAdminFirestore();
  const accountRef = db.collection("accounts").doc(userId);
  const consentRef = accountRef
    .collection("consents")
    .doc(CURRENT_PRODUCT_CONSENT_ID);
  const aiConsentRef = accountRef
    .collection("consents")
    .doc(CURRENT_AI_PROCESSING_CONSENT_ID);
  const batch = db.batch();

  batch.set(
    accountRef,
    {
      adultConfirmedAt: FieldValue.serverTimestamp(),
      locale: input.locale,
      status: "active",
      timeZone: input.timeZone,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  batch.set(consentRef, {
    acceptedAt: FieldValue.serverTimestamp(),
    locale: input.locale,
    privacyAccepted: input.privacyAccepted,
    privacyVersion: CONSENT_VERSIONS.privacy,
    productBoundaryAccepted: input.productBoundaryAccepted,
    productBoundaryVersion: CONSENT_VERSIONS.productBoundary,
  });
  batch.set(
    aiConsentRef,
    aiProcessingConsentData({
      accepted: input.aiProcessingAccepted,
      locale: input.locale,
    }),
  );

  await batch.commit();
}

export async function recordAiProcessingConsent(
  userId: string,
  input: AiProcessingConsentSubmission,
): Promise<void> {
  await getAdminFirestore()
    .collection("accounts")
    .doc(userId)
    .collection("consents")
    .doc(CURRENT_AI_PROCESSING_CONSENT_ID)
    .set(aiProcessingConsentData(input));
}
