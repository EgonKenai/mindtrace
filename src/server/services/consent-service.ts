import { FieldValue } from "firebase-admin/firestore";

import type { ConsentSubmission } from "@/lib/validation/consent";
import {
  CONSENT_VERSIONS,
  CURRENT_CONSENT_ID,
} from "@/server/consent/constants";
import { getAdminFirestore } from "@/server/firebase/admin";

export async function recordConsent(
  userId: string,
  input: ConsentSubmission,
): Promise<void> {
  const db = getAdminFirestore();
  const accountRef = db.collection("accounts").doc(userId);
  const consentRef = accountRef.collection("consents").doc(CURRENT_CONSENT_ID);
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
    aiProcessingAccepted: input.aiProcessingAccepted,
    aiProcessingVersion: CONSENT_VERSIONS.aiProcessing,
    locale: input.locale,
    privacyAccepted: input.privacyAccepted,
    privacyVersion: CONSENT_VERSIONS.privacy,
    productBoundaryAccepted: input.productBoundaryAccepted,
    productBoundaryVersion: CONSENT_VERSIONS.productBoundary,
  });

  await batch.commit();
}
