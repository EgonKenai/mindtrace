export const clientEnv = {
  firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo-api-key",
  firebaseAuthDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "localhost",
  firebaseProjectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "mindtrace-demo",
  firebaseAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "demo-app-id",
  useFirebaseEmulators:
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true",
} as const;
