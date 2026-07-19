export type CrmConnectionRecord = {
  companyId: string;
  provider: string;
  status: string;
};

// Doc/25 Phase 4 (desktop CRM status reconciliation): the desktop app may
// move ITS OWN company's amoCRM row between exactly these statuses. `demo`
// and `unsupported` rows are never desktop-writable.
export type RequestedCrmStatus = "connected" | "pending" | "failed";

export const REQUESTED_CRM_STATUSES: readonly RequestedCrmStatus[] = [
  "connected",
  "pending",
  "failed",
];

export function isRequestedCrmStatus(value: unknown): value is RequestedCrmStatus {
  return (
    typeof value === "string" &&
    (REQUESTED_CRM_STATUSES as readonly string[]).includes(value)
  );
}

export type CrmStatusTransitionDecision =
  | {
      ok: true;
      /**
       * Whether the database row actually needs to move. `false` is the
       * idempotent-retry case — the caller must NOT re-emit analytics for it
       * (crm_connected fires only on a real pending/failed -> connected
       * transition, never on a retry).
       */
      changed: boolean;
      nextStatus: RequestedCrmStatus;
    }
  | {
      ok: false;
      code:
        | "missing_connection"
        | "wrong_company"
        | "wrong_provider"
        | "not_allowed";
    };

// Which current statuses each requested status may move FROM (identity is
// handled separately as the idempotent case). `demo` / `unsupported` appear
// nowhere, so a demo workspace can never be flipped by a desktop call.
const ALLOWED_TRANSITIONS: Record<RequestedCrmStatus, readonly string[]> = {
  connected: ["pending", "failed"],
  pending: ["connected", "failed"],
  failed: ["pending"],
};

export function decideCrmStatusTransition(
  connection: CrmConnectionRecord | null,
  expectedCompanyId: string,
  requestedStatus: RequestedCrmStatus
): CrmStatusTransitionDecision {
  if (!connection) return { ok: false, code: "missing_connection" };
  if (connection.companyId !== expectedCompanyId) {
    return { ok: false, code: "wrong_company" };
  }
  if (connection.provider !== "amocrm") {
    return { ok: false, code: "wrong_provider" };
  }
  if (connection.status === requestedStatus) {
    return { ok: true, changed: false, nextStatus: requestedStatus };
  }
  if (!ALLOWED_TRANSITIONS[requestedStatus].includes(connection.status)) {
    return { ok: false, code: "not_allowed" };
  }
  return { ok: true, changed: true, nextStatus: requestedStatus };
}

// --- Backward-compatible wrapper --------------------------------------------
// The original bodyless desktop completion contract: "move my amoCRM row to
// connected". Kept so existing callers/tests keep their exact shape; new code
// should use decideCrmStatusTransition directly.

export type CrmCompletionDecision =
  | { ok: true; alreadyConnected: boolean }
  | {
      ok: false;
      code:
        | "missing_connection"
        | "wrong_company"
        | "wrong_provider"
        | "not_pending";
    };

export function decideAmoCrmCompletion(
  connection: CrmConnectionRecord | null,
  expectedCompanyId: string
): CrmCompletionDecision {
  const decision = decideCrmStatusTransition(connection, expectedCompanyId, "connected");
  if (decision.ok) {
    return { ok: true, alreadyConnected: !decision.changed };
  }
  if (decision.code === "not_allowed") {
    return { ok: false, code: "not_pending" };
  }
  return { ok: false, code: decision.code };
}
