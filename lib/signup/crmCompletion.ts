export type CrmConnectionRecord = {
  companyId: string;
  provider: string;
  status: string;
};

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
  if (!connection) return { ok: false, code: "missing_connection" };
  if (connection.companyId !== expectedCompanyId) {
    return { ok: false, code: "wrong_company" };
  }
  if (connection.provider !== "amocrm") {
    return { ok: false, code: "wrong_provider" };
  }
  if (connection.status === "connected") {
    return { ok: true, alreadyConnected: true };
  }
  if (connection.status !== "pending") {
    return { ok: false, code: "not_pending" };
  }
  return { ok: true, alreadyConnected: false };
}
