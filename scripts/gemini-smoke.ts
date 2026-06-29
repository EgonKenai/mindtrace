import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";

const rootDir = process.cwd();
const emptyServerOnlyModule = pathToFileURL(
  path.join(rootDir, "node_modules", "server-only", "empty.js"),
).href;

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

type FeedbackPolicyDecision =
  | "allow_generation"
  | "crisis_redirect"
  | "safe_fallback"
  | "supportive_redirect";

interface SmokeReport {
  fallbackUsed: boolean;
  latencyRange: "<1s" | "1-3s" | "3-10s" | ">10s";
  policyDecision: FeedbackPolicyDecision;
  providerCalled: boolean;
  requestSucceeded: boolean;
  safetyPassed: boolean;
  schemaPassed: boolean;
}

const requiredEnvironmentVariables = [
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
] as const;
const providerTimeoutMs = 10_000;
const fictionalSmokeNote = "今天只是有点累，想早点休息，明天继续学习。";

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
        latencyRange: latencyRange(startedAt),
        policyDecision: policy.decision,
        providerCalled: false,
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
        latencyRange: latencyRange(startedAt),
        policyDecision: "safe_fallback",
        providerCalled: false,
        requestSucceeded: false,
        safetyPassed: false,
        schemaPassed: false,
      });
      process.exitCode = 1;
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), providerTimeoutMs);
    let rawOutput: unknown;

    try {
      providerCalled = true;
      rawOutput = await provider.generateFeedback(
        inputModule.buildAiFeedbackProviderInput(fictionalEntry),
        { signal: controller.signal },
      );
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
        latencyRange: latencyRange(startedAt),
        policyDecision: "safe_fallback",
        providerCalled,
        requestSucceeded: false,
        safetyPassed: false,
        schemaPassed: validation.reason !== "invalid",
      });
      process.exitCode = 1;
      return;
    }

    feedbackValidationModule.feedbackResultSchema.parse({
      schemaVersion: feedbackModelModule.FEEDBACK_SCHEMA_VERSION,
      status: "generated",
      reflection: validation.output.reflection,
      suggestions: validation.output.suggestions,
      disclaimer: messagesModule.zhCN.aiFeedback.disclaimer,
      policyDecision: "allow_generation",
      reasonCodes: policy.reasonCodes,
    });

    printReport({
      fallbackUsed: false,
      latencyRange: latencyRange(startedAt),
      policyDecision: "allow_generation",
      providerCalled,
      requestSucceeded: true,
      safetyPassed: true,
      schemaPassed: true,
    });
  } catch {
    printReport({
      fallbackUsed: true,
      latencyRange: latencyRange(startedAt),
      policyDecision: "safe_fallback",
      providerCalled,
      requestSucceeded: false,
      safetyPassed: false,
      schemaPassed: false,
    });
    process.exitCode = 1;
  }
}

await runSmoke();
