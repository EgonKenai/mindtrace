import { FieldValue, type Timestamp } from "firebase-admin/firestore";

import { defaultLocale } from "@/i18n/config";
import { CURRENT_CONSENT_ID } from "@/server/consent/constants";
import { getAdminFirestore } from "@/server/firebase/admin";

export interface AccountRecord {
  adultConfirmedAt?: Timestamp;
  createdAt?: Timestamp;
  displayName?: string | null;
  locale: string;
  safetyRegion?: string | null;
  status: "active" | "deletion_requested";
  timeZone: string;
  updatedAt?: Timestamp;
}

export async function ensureAccount(userId: string): Promise<void> {
  const db = getAdminFirestore();
  const accountRef = db.collection("accounts").doc(userId);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(accountRef);

    if (!snapshot.exists) {
      transaction.create(accountRef, {
        displayName: null,
        locale: defaultLocale,
        safetyRegion: null,
        status: "active",
        timeZone: "UTC",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      } satisfies Omit<AccountRecord, "createdAt" | "updatedAt"> & {
        createdAt: FieldValue;
        updatedAt: FieldValue;
      });
    }
  });
}

export async function getAccount(
  userId: string,
): Promise<AccountRecord | null> {
  const snapshot = await getAdminFirestore()
    .collection("accounts")
    .doc(userId)
    .get();

  return snapshot.exists ? (snapshot.data() as AccountRecord) : null;
}

export async function hasCurrentConsent(userId: string): Promise<boolean> {
  const snapshot = await getAdminFirestore()
    .collection("accounts")
    .doc(userId)
    .collection("consents")
    .doc(CURRENT_CONSENT_ID)
    .get();

  return snapshot.exists;
}
