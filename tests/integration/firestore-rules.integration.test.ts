import { readFile } from "node:fs/promises";

import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { afterAll, beforeAll, describe, it } from "vitest";

let testEnvironment: RulesTestEnvironment;

beforeAll(async () => {
  const rules = await readFile("firestore.rules", "utf8");
  testEnvironment = await initializeTestEnvironment({
    projectId: "mindtrace-demo",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules,
    },
  });
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe("Firestore client security rules", () => {
  it("denies direct reads and writes to business collections", async () => {
    const database = testEnvironment
      .authenticatedContext("fictional-user")
      .firestore();
    const accountRef = doc(database, "accounts/fictional-user");

    await assertFails(getDoc(accountRef));
    await assertFails(
      setDoc(accountRef, {
        locale: "zh-CN",
        status: "active",
      }),
    );
  });

  it("denies direct browser reads and writes to journal entries", async () => {
    const database = testEnvironment
      .authenticatedContext("fictional-user")
      .firestore();
    const journalRef = doc(database, "journals/fictional-user/entries/entry-1");

    await assertFails(getDoc(journalRef));
    await assertFails(
      setDoc(journalRef, {
        mood: 5,
        stress: 4,
        energy: 6,
      }),
    );
  });

  it("denies direct browser reads and writes to AI feedback data", async () => {
    const database = testEnvironment
      .authenticatedContext("fictional-user")
      .firestore();
    const feedbackRef = doc(
      database,
      "analyses/fictional-user/entryFeedback/feedback-1",
    );
    const planSuggestionRef = doc(
      database,
      "analyses/fictional-user/planSuggestions/suggestion-1",
    );
    const longTermInsightRef = doc(
      database,
      "analyses/fictional-user/longTermInsights/insight-1",
    );

    await assertFails(getDoc(feedbackRef));
    await assertFails(
      setDoc(feedbackRef, {
        status: "ready",
        reflection: "不应由浏览器写入的虚构反馈。",
      }),
    );
    await assertFails(getDoc(planSuggestionRef));
    await assertFails(
      setDoc(planSuggestionRef, {
        status: "accepted",
        title: "client forged suggestion",
      }),
    );
    await assertFails(getDoc(longTermInsightRef));
    await assertFails(
      setDoc(longTermInsightRef, {
        status: "saved",
        title: "client forged insight",
      }),
    );
  });

  it("denies direct browser reads and writes to long-term summaries and plans", async () => {
    const database = testEnvironment
      .authenticatedContext("fictional-user")
      .firestore();
    const summaryRef = doc(
      database,
      "longTermSummaries/fictional-user/summaries/window-7",
    );
    const planRef = doc(database, "plans/fictional-user/items/plan-1");
    const actionRef = doc(
      database,
      "plans/fictional-user/items/plan-1/actions/action-1",
    );

    await assertFails(getDoc(summaryRef));
    await assertFails(setDoc(summaryRef, { entryCount: 1 }));
    await assertFails(getDoc(planRef));
    await assertFails(setDoc(planRef, { title: "client write" }));
    await assertFails(getDoc(actionRef));
    await assertFails(setDoc(actionRef, { title: "client write" }));
  });
});
