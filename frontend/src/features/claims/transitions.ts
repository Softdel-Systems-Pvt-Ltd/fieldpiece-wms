import type { ClaimAction, ClaimStatus, Role } from "@/types";

// Claim actions (Section 7.1). The API decides what's allowed: GET /claims/{id} returns `allowedActions`
// for the caller, and screens render exactly those. This file holds only what the UI needs per action
// (endpoint, button tone, what input to collect) plus a mirror of the server's table for the MSW mocks
// and tests. Keep TRANSITIONS in sync with backend/src/modules/claims/claim-state-machine.ts.
//
// DRAFT → SUBMITTED → IN_REVIEW ─┬→ APPROVED → RMA_ISSUED → IN_TRANSIT → RECEIVED ─┬→ REPAIRED ─┐
//                         ↑      │                                                 ├→ REPLACED ─┼→ CLOSED
//                         │      ├→ NEEDS_INFO ──(customer responds)──┐            └→ CREDITED ─┘
//                         └──────┼─────────────────────────────────────┘
//                                └→ REJECTED → CLOSED

export type ActionInput = "none" | "message" | "optionalMessage" | "approve" | "reject";

export interface ActionMeta {
  /** POST /claims/{id}/{path} */
  path: string;
  tone: "primary" | "secondary" | "danger";
  input: ActionInput;
}

export const ACTION_META: Record<ClaimAction, ActionMeta> = {
  submit: { path: "submit", tone: "primary", input: "none" },
  startReview: { path: "start-review", tone: "primary", input: "none" },
  requestInfo: { path: "request-info", tone: "secondary", input: "message" },
  respond: { path: "respond", tone: "primary", input: "message" },
  approve: { path: "approve", tone: "primary", input: "approve" },
  reject: { path: "reject", tone: "danger", input: "reject" },
  close: { path: "close", tone: "secondary", input: "optionalMessage" },
};

/** Secondary and destructive actions first, so the primary one sits on the right (Section 5.1). */
export function orderActions(actions: readonly ClaimAction[]): ClaimAction[] {
  const weight = { danger: 0, secondary: 1, primary: 2 } as const;
  return [...actions].sort((a, b) => weight[ACTION_META[a].tone] - weight[ACTION_META[b].tone]);
}

// ── Mirror of the server table (mocks and tests only) ──────────────

interface Transition {
  from: readonly ClaimStatus[];
  to: ClaimStatus;
  roles: readonly Role[];
}

export const TRANSITIONS: Record<ClaimAction, Transition> = {
  submit: { from: ["DRAFT"], to: "SUBMITTED", roles: ["technician", "distributor", "claims_agent", "admin"] },
  startReview: { from: ["SUBMITTED"], to: "IN_REVIEW", roles: ["claims_agent", "admin"] },
  requestInfo: { from: ["IN_REVIEW"], to: "NEEDS_INFO", roles: ["claims_agent", "admin"] },
  respond: { from: ["NEEDS_INFO"], to: "IN_REVIEW", roles: ["technician", "distributor"] },
  approve: { from: ["IN_REVIEW"], to: "APPROVED", roles: ["claims_agent", "admin"] },
  reject: { from: ["IN_REVIEW"], to: "REJECTED", roles: ["claims_agent", "admin"] },
  close: {
    from: ["REPAIRED", "REPLACED", "CREDITED", "REJECTED"],
    to: "CLOSED",
    roles: ["claims_agent", "admin"],
  },
};

export function allowedActions(status: ClaimStatus, roles: readonly Role[]): ClaimAction[] {
  return (Object.keys(TRANSITIONS) as ClaimAction[]).filter((action) => {
    const t = TRANSITIONS[action];
    return t.from.includes(status) && t.roles.some((role) => roles.includes(role));
  });
}

export function nextStatus(status: ClaimStatus, action: ClaimAction): ClaimStatus | null {
  const t = TRANSITIONS[action];
  return t.from.includes(status) ? t.to : null;
}

const RESOLVED: ReadonlySet<ClaimStatus> = new Set(["REPAIRED", "REPLACED", "CREDITED"]);
const NOT_OPEN: ReadonlySet<ClaimStatus> = new Set(["DRAFT", "CLOSED", "REJECTED"]);

export const isTerminal = (status: ClaimStatus) => status === "CLOSED";

/** "Open" for dashboards: submitted and not yet resolved or closed. */
export const isOpen = (status: ClaimStatus) => !NOT_OPEN.has(status) && !RESOLVED.has(status);

export const OPEN_STATUSES: ClaimStatus[] = [
  "SUBMITTED",
  "IN_REVIEW",
  "NEEDS_INFO",
  "APPROVED",
  "RMA_ISSUED",
  "IN_TRANSIT",
  "RECEIVED",
];
