import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { pathToFileURL } from "node:url";

type FeedbackPolicyDecision =
  | "allow_generation"
  | "crisis_redirect"
  | "safe_fallback"
  | "supportive_redirect";

type SmokeFailureKind =
  | "feedback_result_schema_failed"
  | "input_safety_redirect"
  | "output_safety_rejected"
  | "provider_not_configured"
  | "provider_rate_limited"
  | "provider_timeout"
  | "provider_unavailable"
  | "safety_blocked"
  | "schema_validation_failed";

interface SmokeReport {
  fallbackUsed: boolean;
  failureKind: SmokeFailureKind | null;
  latencyRange: "<1s" | "1-3s" | "3-10s" | ">10s";
  policyDecision: FeedbackPolicyDecision;
  providerCalled: boolean;
  reasonCodes: string[];
  requestSucceeded: boolean;
  safetyPassed: boolean;
  schemaPassed: boolean;
}

const rootDir = process.cwd();
const emptyServerOnlyModule = pathToFileURL(
  path.join(rootDir, "node_modules", "server-only", "empty.js"),
).href;
const requiredEnvironmentVariables = [
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
] as const;
const providerTimeoutMs = 10_000;
const fictionalSmokeNote = "今天完成了学习任务，下午有点累，晚上准备早点休息。";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return {
        shortCircuit: true,
        url: emptyServerOnlyModule,
      };
    }

    if (specifier.startsWith("@/")) {
      const basePath = path.join(rootDir, "src", specifier.slice(2));
      const candidates = [
        basePath,
        `${basePath}.ts`,
        `${basePath}.tsx`,
        `${basePath}.js`,
        path.join(basePath, "index.ts"),
        path.join(basePath, "index.tsx"),
      ];
      const resolvedPath =
        candidates.find((candidate) => existsSync(candidate)) ??
        `${basePath}.ts`;

      return {
        shortCircuit: true,
        url: pathToFileURL(resolvedPath).href,
      };
    }

    return nextResolve(specifier, context);
  },
});

function latencyRange(startedAt: number): SmokeReport["latencyRange"] {
  const elapsedMs = performance.now() - startedAt;

  if (elapsedMs < 1_000) {
    return "<1s";
  }

  if (elapsedMs < 3_000) {
    return "1-3s";
  }

  if (elapsedMs < 10_000) {
    return "3-10s";
  }

  return ">10s";
}

function printReport(report: SmokeReport): void {
  console.log(JSON.stringify(report, null, 2));
}

function getMissingEnvironmentVariables(): string[] {
  return requiredEnvironmentVariables.filter(
    (name) => !process.env[name]?.trim(),
  );
}

function normalizePolicyReasonCodes(reasonCodes: string[]): string[] {
  return reasonCodes.map((code) => code.toLowerCase());
}

function providerFailureFromError(
  error: unknown,
  didTimeout: boolean,
): Pick<SmokeReport, "failureKind" | "reasonCodes"> {
  if (didTimeout) {
    return {
      failureKind: "provider_timeout",
      reasonCodes: ["provider_timeout"],
    };
  }

  const code =
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AiFeedbackProviderError" &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : null;

  if (code === "blocked") {
    return {
      failureKind: "safety_blocked",
      reasonCodes: ["safety_blocked"],
    };
  }

  if (code === "rate_limited") {
    return {
      failureKind: "provider_rate_limited",
      reasonCodes: ["provider_rate_limited"],
    };
  }

  if (code === "not_configured") {
    return {
      failureKind: "provider_not_configured",
      reasonCodes: ["provider_not_configured"],
    };
  }

  return {
    failureKind: "provider_unavailable",
    reasonCodes: ["provider_unavailable"],
  };
}

async function importProjectModule<T>(modulePath: string): Promise<T> {
  return (await import(
    pathToFileURL(path.join(rootDir, modulePath)).href
  )) as T;
}

async function runSmoke(): Promise<void> {
  const missingEnvironmentVariables = getMissingEnvironmentVariables();

  if (missingEnvironmentVariables.length > 0) {
    console.log(
      `Gemini smoke skipped: missing ${missingEnvironmentVariables.join(
        ", ",
      )}. No request was sent.`,
    );
    return;
  }

  const startedAt = performance.now();
  let providerCalled = false;

  try {
    const [
      firestoreModule,
      inputModule,
      providerModule,
      policyModule,
      outputValidationModule,
      feedbackValidationModule,
      feedbackModelModule,
      messagesModule,
    ] = await Promise.all([
      import("firebase-admin/firestore"),
      importProjectModule<typeof import("../src/server/ai/input")>(
        "src/server/ai/input.ts",
      ),
      importProjectModule<typeof import("../src/server/ai/gemini-provider")>(
        "src/server/ai/gemini-provider.ts",
      ),
      importProjectModule<typeof import("../src/server/ai/policy")>(
        "src/server/ai/policy.ts",
      ),
      importProjectModule<typeof import("../src/server/ai/output-validation")>(
        "src/server/ai/output-validation.ts",
      ),
      importProjectModule<typeof import("../src/lib/validation/ai-feedback")>(
        "src/lib/validation/ai-feedback.ts",
      ),
      importProjectModule<typeof import("../src/features/ai-feedback/model")>(
        "src/features/ai-feedback/model.ts",
      ),
      importProjectModule<typeof import("../src/i18n/messages/zh-CN")>(
        "src/i18n/messages/zh-CN.ts",
      ),
    ]);

    const timestamp = firestoreModule.Timestamp.fromDate(
      new Date("2026-06-25T12:00:00.000Z"),
    );
    const fictionalEntry = {
      createdAt: timestamp,
      energy: 4,
      eventTags: ["study", "sleep"],
      id: "fictional-smoke-entry",
      localDate: "2026-06-25",
      mood: 6,
      note: fictionalSmokeNote,
      occurredAt: timestamp,
      revision: 1,
      sleepHours: 6.5,
      sleepQuality: 5,
      stress: 5,
      timeZone: "Asia/Shanghai",
      updatedAt: timestamp,
    } satisfies import("../src/server/repositories/journal-repository").JournalEntryRecord;

    const policy = policyModule.routeFeedbackSafety(fictionalEntry.note);

    if (policy.decision !== "allow_generation") {
      printReport({
        fallbackUsed: true,
        failureKind: "input_safety_redirect",
        latencyRange: latencyRange(startedAt),
        policyDecision: policy.decision,
        providerCalled: false,
        reasonCodes: normalizePolicyReasonCodes(policy.reasonCodes),
        requestSucceeded: false,
        safetyPassed: false,
        schemaPassed: false,
      });
      process.exitCode = 1;
      return;
    }

    const provider = providerModule.createConfiguredAiFeedbackProvider();

    if (!provider) {
      printReport({
        fallbackUsed: true,
        failureKind: "provider_not_configured",
        latencyRange: latencyRange(startedAt),
        policyDecision: "safe_fallback",
        providerCalled: false,
        reasonCodes: ["provider_not_configured"],
        requestSucceeded: false,
        safetyPassed: false,
        schemaPassed: false,
      });
      process.exitCode = 1;
      return;
    }

    const controller = new AbortController();
    let didTimeout = false;
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, providerTimeoutMs);
    let rawOutput: unknown;

    try {
      providerCalled = true;
      rawOutput = await provider.generateFeedback(
        inputModule.buildAiFeedbackProviderInput(fictionalEntry),
        { signal: controller.signal },
      );
    } catch (error) {
      const providerFailure = providerFailureFromError(error, didTimeout);

      printReport({
        fallbackUsed: true,
        failureKind: providerFailure.failureKind,
        latencyRange: latencyRange(startedAt),
        policyDecision: "safe_fallback",
        providerCalled,
        reasonCodes: providerFailure.reasonCodes,
        requestSucceeded: false,
        safetyPassed: false,
        schemaPassed: false,
      });
      process.exitCode = 1;
      return;
    } finally {
      clearTimeout(timeoutId);
    }

    const validation = outputValidationModule.validateProviderOutput(
      rawOutput,
      fictionalEntry.note,
    );

    if (!validation.success) {
      printReport({
        fallbackUsed: true,
        failureKind:
          validation.reason === "invalid"
            ? "schema_validation_failed"
            : "output_safety_rejected",
        latencyRange: latencyRange(startedAt),
        policyDecision: "safe_fallback",
        providerCalled,
        reasonCodes: validation.reasonCodes,
        requestSucceeded: false,
        safetyPassed: false,
        schemaPassed: validation.reason !== "invalid",
      });
      process.exitCode = 1;
      return;
    }

    const feedbackResult =
      feedbackValidationModule.feedbackResultSchema.safeParse({
        schemaVersion: feedbackModelModule.FEEDBACK_SCHEMA_VERSION,
        status: "generated",
        reflection: validation.output.reflection,
        suggestions: validation.output.suggestions,
        disclaimer: messagesModule.zhCN.aiFeedback.disclaimer,
        policyDecision: "allow_generation",
        reasonCodes: policy.reasonCodes,
      });

    if (!feedbackResult.success) {
      printReport({
        fallbackUsed: true,
        failureKind: "feedback_result_schema_failed",
        latencyRange: latencyRange(startedAt),
        policyDecision: "safe_fallback",
        providerCalled,
        reasonCodes: ["schema_validation_failed"],
        requestSucceeded: false,
        safetyPassed: true,
        schemaPassed: false,
      });
      process.exitCode = 1;
      return;
    }

    printReport({
      fallbackUsed: false,
      failureKind: null,
      latencyRange: latencyRange(startedAt),
      policyDecision: "allow_generation",
      providerCalled,
      reasonCodes: normalizePolicyReasonCodes(policy.reasonCodes),
      requestSucceeded: true,
      safetyPassed: true,
      schemaPassed: true,
    });
  } catch {
    printReport({
      fallbackUsed: true,
      failureKind: "provider_unavailable",
      latencyRange: latencyRange(startedAt),
      policyDecision: "safe_fallback",
      providerCalled,
      reasonCodes: ["provider_unavailable"],
      requestSucceeded: false,
      safetyPassed: false,
      schemaPassed: false,
    });
    process.exitCode = 1;
  }
}

await runSmoke();
