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
});
