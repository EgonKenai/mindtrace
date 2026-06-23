import {
  applicationDefault,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { getServerEnv } from "@/server/env";

function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const { FIREBASE_PROJECT_ID } = getServerEnv();
  const usingEmulator =
    Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST) ||
    Boolean(process.env.FIRESTORE_EMULATOR_HOST);

  return initializeApp({
    projectId: FIREBASE_PROJECT_ID,
    ...(usingEmulator ? {} : { credential: applicationDefault() }),
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}
