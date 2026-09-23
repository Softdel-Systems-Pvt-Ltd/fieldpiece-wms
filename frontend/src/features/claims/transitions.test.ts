import type { ClaimAction, ClaimStatus, Role } from "@/types";
import {
  ACTION_META,
  allowedActions,
  isOpen,
  isTerminal,
  nextStatus,
  orderActions,
  TRANSITIONS,
} from "./transitions";

const ALL_STATUSES: ClaimStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "IN_REVIEW",
  "NEEDS_INFO",
  "APPROVED",
  "REJECTED",
  "RMA_ISSUED",
  "IN_TRANSIT",
  "RECEIVED",
  "REPAIRED",
  "REPLACED",
  "CREDITED",
  "CLOSED",
];

const actionsFor = (status: ClaimStatus, role: Role) => allowedActions(status, [role]);

describe("action metadata", () => {
  it("covers every API action with an endpoint", () => {
    expect(Object.keys(ACTION_META).sort()).toEqual(Object.keys(TRANSITIONS).sort());
    expect(ACTION_META.startReview.path).toBe("start-review");
    expect(ACTION_META.requestInfo.path).toBe("request-info");
  });

  it("puts the primary action last", () => {
    expect(orderActions(["approve", "reject", "requestInfo"])).toEqual(["reject", "requestInfo", "approve"]);
  });
});

describe("server table mirror", () => {
  it("walks the claim-endpoint happy path", () => {
    const path: [ClaimStatus, ClaimAction, ClaimStatus][] = [
      ["DRAFT", "submit", "SUBMITTED"],
      ["SUBMITTED", "startReview", "IN_REVIEW"],
      ["IN_REVIEW", "approve", "APPROVED"],
      ["REPAIRED", "close", "CLOSED"],
    ];
    path.forEach(([from, action, to]) => expect(nextStatus(from, action)).toBe(to));
  });

  it("loops NEEDS_INFO back to IN_REVIEW", () => {
    expect(nextStatus("IN_REVIEW", "requestInfo")).toBe("NEEDS_INFO");
    expect(nextStatus("NEEDS_INFO", "respond")).toBe("IN_REVIEW");
  });

  it("returns null for an invalid action and never leaves CLOSED", () => {
    expect(nextStatus("DRAFT", "approve")).toBeNull();
    for (const action of Object.keys(TRANSITIONS) as ClaimAction[])
      expect(nextStatus("CLOSED", action)).toBeNull();
  });

  it("only targets known statuses", () => {
    Object.values(TRANSITIONS).forEach((t) => {
      expect(ALL_STATUSES).toContain(t.to);
      t.from.forEach((s) => expect(ALL_STATUSES).toContain(s));
    });
  });
});

describe("allowed actions per role", () => {
  it("lets technicians submit and respond, but never review", () => {
    expect(actionsFor("DRAFT", "technician")).toEqual(["submit"]);
    expect(actionsFor("NEEDS_INFO", "technician")).toEqual(["respond"]);
    expect(actionsFor("IN_REVIEW", "technician")).toEqual([]);
  });

  it("gives claims agents the review decisions", () => {
    expect(actionsFor("SUBMITTED", "claims_agent")).toEqual(["startReview"]);
    expect(actionsFor("IN_REVIEW", "claims_agent")).toEqual(["requestInfo", "approve", "reject"]);
    expect(actionsFor("REJECTED", "claims_agent")).toEqual(["close"]);
  });

  it("does not let admins respond on a customer's behalf", () => {
    expect(actionsFor("NEEDS_INFO", "admin")).toEqual([]);
  });

  it("gives service centers nothing on claim endpoints (their actions live on the RMA)", () => {
    for (const status of ALL_STATUSES) expect(actionsFor(status, "service_center")).toEqual([]);
  });
});

describe("isOpen / isTerminal", () => {
  it.each<[ClaimStatus, boolean]>([
    ["DRAFT", false],
    ["SUBMITTED", true],
    ["NEEDS_INFO", true],
    ["RMA_ISSUED", true],
    ["RECEIVED", true],
    ["REJECTED", false],
    ["REPAIRED", false],
    ["CLOSED", false],
  ])("%s open -> %s", (status, open) => expect(isOpen(status)).toBe(open));

  it("treats only CLOSED as terminal", () => {
    expect(isTerminal("CLOSED")).toBe(true);
    expect(isTerminal("REJECTED")).toBe(false);
  });
});
