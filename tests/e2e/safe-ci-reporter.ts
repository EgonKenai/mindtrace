import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

interface SafeTestResult {
  durationMs: number;
  status: TestResult["status"];
  title: string;
}

class SafeCiReporter implements Reporter {
  private readonly results: SafeTestResult[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    this.results.push({
      durationMs: result.duration,
      status: result.status,
      title: test.titlePath().join(" > "),
    });
  }

  onEnd(result: FullResult): void {
    const outputPath = "playwright-report/summary.json";
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(
      outputPath,
      `${JSON.stringify(
        {
          status: result.status,
          tests: this.results,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
  }
}

export default SafeCiReporter;
