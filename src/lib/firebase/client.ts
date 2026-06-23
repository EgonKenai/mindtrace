"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  inMemoryPersistence,
  setPersistence,
} from "firebase/auth";

import { clientEnv } from "@/lib/env/client";

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        apiKey: clientEnv.firebaseApiKey,
        authDomain: clientEnv.firebaseAuthDomain,
        projectId: clientEnv.firebaseProjectId,
        appId: clientEnv.firebaseAppId,
      });

export const firebaseAuth = getAuth(app);

let emulatorConnected = false;

if (clientEnv.useFirebaseEmulators && !emulatorConnected) {
  connectAuthEmulator(firebaseAuth, "http://127.0.0.1:9099", {
    disableWarnings: true,
  });
  emulatorConnected = true;
}

export async function prepareFirebaseAuth(): Promise<void> {
  await setPersistence(firebaseAuth, inMemoryPersistence);
}
