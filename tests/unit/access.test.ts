import type { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";

import { evaluateProductAccess } from "@/server/auth/access";
import type { AccountRecord } from "@/server/repositories/account-repository";

const activeAdultAccount: AccountRecord = {
  adultConfirmedAt: {} as Timestamp,
  locale: "zh-CN",
  status: "active",
  timeZone: "Asia/Tokyo",
};

describe("evaluateProductAccess", () => {
  it("allows an active adult with the current consent", () => {
    expect(evaluateProductAccess(activeAdultAccount, true)).toBe(true);
  });

  it("blocks access before adult confirmation", () => {
    expect(
      evaluateProductAccess(
        { ...activeAdultAccount, adultConfirmedAt: undefined },
        true,
      ),
    ).toBe(false);
  });

  it("blocks access before current consent", () => {
    expect(evaluateProductAccess(activeAdultAccount, false)).toBe(false);
  });

  it("blocks a deletion-requested account", () => {
    expect(
      evaluateProductAccess(
        { ...activeAdultAccount, status: "deletion_requested" },
        true,
      ),
    ).toBe(false);
  });
});
