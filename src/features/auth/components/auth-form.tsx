"use client";

import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { zhCN } from "@/i18n/messages/zh-CN";
import { firebaseAuth, prepareFirebaseAuth } from "@/lib/firebase/client";

type AuthMode = "login" | "register";

interface AuthFormProps {
  mode: AuthMode;
}

function mapFirebaseError(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return zhCN.auth.errors.unknown;
  }

  switch (error.code) {
    case "auth/email-already-in-use":
      return zhCN.auth.errors.emailInUse;
    case "auth/invalid-email":
      return zhCN.auth.errors.invalidEmail;
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return zhCN.auth.errors.invalidCredentials;
    case "auth/weak-password":
      return zhCN.auth.errors.weakPassword;
    default:
      return zhCN.auth.errors.unknown;
  }
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isLogin = mode === "login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      await prepareFirebaseAuth();
      const credential = isLogin
        ? await signInWithEmailAndPassword(firebaseAuth, email, password)
        : await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const idToken = await credential.user.getIdToken();
      const response = await fetch("/api/v1/auth/session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        await signOut(firebaseAuth);
        setErrorMessage(zhCN.auth.errors.sessionFailed);
        return;
      }

      await signOut(firebaseAuth);
      router.replace("/zh-CN");
      router.refresh();
    } catch (error) {
      setErrorMessage(mapFirebaseError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-panel">
      <div className="page-heading">
        <p className="eyebrow">{zhCN.brand.shortDescription}</p>
        <h1>{isLogin ? zhCN.auth.loginTitle : zhCN.auth.registerTitle}</h1>
        <p>{isLogin ? zhCN.auth.loginIntro : zhCN.auth.registerIntro}</p>
      </div>

      <form className="stack-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>{zhCN.auth.emailLabel}</span>
          <input
            autoComplete="email"
            inputMode="email"
            name="email"
            required
            type="email"
          />
        </label>

        <label className="field">
          <span>{zhCN.auth.passwordLabel}</span>
          <input
            autoComplete={isLogin ? "current-password" : "new-password"}
            minLength={8}
            name="password"
            required
            type="password"
          />
          {!isLogin && (
            <small className="field-hint">{zhCN.auth.passwordHint}</small>
          )}
        </label>

        {errorMessage && (
          <p className="form-error" role="alert">
            {errorMessage}
          </p>
        )}

        <button className="primary-button" disabled={submitting} type="submit">
          {submitting
            ? zhCN.common.loading
            : isLogin
              ? zhCN.auth.loginAction
              : zhCN.auth.registerAction}
        </button>
      </form>

      <p className="auth-switch">
        {isLogin ? zhCN.auth.noAccount : zhCN.auth.hasAccount}{" "}
        <Link href={isLogin ? "/zh-CN/register" : "/zh-CN/login"}>
          {isLogin ? zhCN.auth.goToRegister : zhCN.auth.goToLogin}
        </Link>
      </p>
    </div>
  );
}
