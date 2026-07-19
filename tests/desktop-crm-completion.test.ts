import { describe, expect, it } from "vitest";
import {
  readBearerToken,
  validateDesktopSession,
} from "@/lib/desktop-auth/session";
import {
  decideAmoCrmCompletion,
  decideCrmStatusTransition,
  isRequestedCrmStatus,
  type RequestedCrmStatus,
} from "@/lib/signup/crmCompletion";

const NOW = new Date("2026-07-12T12:00:00.000Z");
const TOKEN =
  "2tQ4N8W4V8I5rY0wEwzwY_qhd0eB-pk6XrlwY5c2YzY";

describe("desktop CRM completion session validation", () => {
  it("accepts a bearer token in the desktop session format", () => {
    expect(readBearerToken(`Bearer ${TOKEN}`)).toBe(TOKEN);
  });

  it("rejects missing or malformed authorization headers", () => {
    expect(readBearerToken(null)).toBeNull();
    expect(readBearerToken("Basic abc123")).toBeNull();
    expect(readBearerToken("Bearer short")).toBeNull();
  });

  it("rejects an expired desktop session", () => {
    expect(
      validateDesktopSession(
        {
          userId: "user-1",
          companyId: "company-1",
          expiresAt: "2026-07-12T11:59:59.000Z",
          revokedAt: null,
        },
        NOW
      )
    ).toEqual({ ok: false, code: "expired" });
  });

  it("rejects a revoked desktop session", () => {
    expect(
      validateDesktopSession(
        {
          userId: "user-1",
          companyId: "company-1",
          expiresAt: "2026-07-12T13:00:00.000Z",
          revokedAt: "2026-07-12T11:00:00.000Z",
        },
        NOW
      )
    ).toEqual({ ok: false, code: "revoked" });
  });

  it("accepts a live desktop session bound to a company", () => {
    expect(
      validateDesktopSession(
        {
          userId: "user-1",
          companyId: "company-1",
          expiresAt: "2026-07-12T13:00:00.000Z",
          revokedAt: null,
        },
        NOW
      )
    ).toEqual({
      ok: true,
      session: {
        userId: "user-1",
        companyId: "company-1",
        expiresAt: "2026-07-12T13:00:00.000Z",
        revokedAt: null,
      },
    });
  });
});

describe("desktop CRM completion authorization", () => {
  it("allows the caller to upgrade their own pending amoCRM row", () => {
    expect(
      decideAmoCrmCompletion(
        {
          companyId: "company-1",
          provider: "amocrm",
          status: "pending",
        },
        "company-1"
      )
    ).toEqual({ ok: true, alreadyConnected: false });
  });

  it("treats an already connected amoCRM row as idempotently complete", () => {
    expect(
      decideAmoCrmCompletion(
        {
          companyId: "company-1",
          provider: "amocrm",
          status: "connected",
        },
        "company-1"
      )
    ).toEqual({ ok: true, alreadyConnected: true });
  });

  it("rejects a CRM row that belongs to another company", () => {
    expect(
      decideAmoCrmCompletion(
        {
          companyId: "company-2",
          provider: "amocrm",
          status: "pending",
        },
        "company-1"
      )
    ).toEqual({ ok: false, code: "wrong_company" });
  });

  it("rejects non-amoCRM or non-pending CRM rows", () => {
    expect(
      decideAmoCrmCompletion(
        {
          companyId: "company-1",
          provider: "hubspot",
          status: "pending",
        },
        "company-1"
      )
    ).toEqual({ ok: false, code: "wrong_provider" });

    expect(
      decideAmoCrmCompletion(
        {
          companyId: "company-1",
          provider: "amocrm",
          status: "demo",
        },
        "company-1"
      )
    ).toEqual({ ok: false, code: "not_pending" });
  });
});

// Doc/25 Phase 4: the generalized desktop status reconciliation contract.
describe("desktop CRM status transitions", () => {
  const connection = (status: string, overrides?: { companyId?: string; provider?: string }) => ({
    companyId: overrides?.companyId ?? "company-1",
    provider: overrides?.provider ?? "amocrm",
    status,
  });

  it("validates the requested status names", () => {
    expect(isRequestedCrmStatus("connected")).toBe(true);
    expect(isRequestedCrmStatus("pending")).toBe(true);
    expect(isRequestedCrmStatus("failed")).toBe(true);
    expect(isRequestedCrmStatus("demo")).toBe(false);
    expect(isRequestedCrmStatus("unsupported")).toBe(false);
    expect(isRequestedCrmStatus(42)).toBe(false);
  });

  it("moves pending -> connected as a real change (the one analytics-worthy event)", () => {
    expect(decideCrmStatusTransition(connection("pending"), "company-1", "connected")).toEqual({
      ok: true,
      changed: true,
      nextStatus: "connected",
    });
  });

  it("treats a repeated connect as idempotent — changed=false, so no duplicate analytics", () => {
    expect(decideCrmStatusTransition(connection("connected"), "company-1", "connected")).toEqual({
      ok: true,
      changed: false,
      nextStatus: "connected",
    });
  });

  it("moves connected -> pending on disconnect, idempotently", () => {
    expect(decideCrmStatusTransition(connection("connected"), "company-1", "pending")).toEqual({
      ok: true,
      changed: true,
      nextStatus: "pending",
    });
    expect(decideCrmStatusTransition(connection("pending"), "company-1", "pending")).toEqual({
      ok: true,
      changed: false,
      nextStatus: "pending",
    });
  });

  it("allows pending -> failed and failed -> connected/pending recoveries", () => {
    expect(decideCrmStatusTransition(connection("pending"), "company-1", "failed")).toEqual({
      ok: true,
      changed: true,
      nextStatus: "failed",
    });
    expect(decideCrmStatusTransition(connection("failed"), "company-1", "connected")).toEqual({
      ok: true,
      changed: true,
      nextStatus: "connected",
    });
    expect(decideCrmStatusTransition(connection("failed"), "company-1", "pending")).toEqual({
      ok: true,
      changed: true,
      nextStatus: "pending",
    });
  });

  it("never lets the desktop flip a demo or unsupported row", () => {
    const requests: RequestedCrmStatus[] = ["connected", "pending", "failed"];
    for (const status of ["demo", "unsupported"]) {
      for (const requested of requests) {
        expect(decideCrmStatusTransition(connection(status), "company-1", requested)).toEqual({
          ok: false,
          code: "not_allowed",
        });
      }
    }
  });

  it("refuses to fail a connected row (disconnect first)", () => {
    expect(decideCrmStatusTransition(connection("connected"), "company-1", "failed")).toEqual({
      ok: false,
      code: "not_allowed",
    });
  });

  it("still enforces company and provider ownership", () => {
    expect(
      decideCrmStatusTransition(connection("pending", { companyId: "company-2" }), "company-1", "connected")
    ).toEqual({ ok: false, code: "wrong_company" });
    expect(
      decideCrmStatusTransition(connection("pending", { provider: "hubspot" }), "company-1", "connected")
    ).toEqual({ ok: false, code: "wrong_provider" });
    expect(decideCrmStatusTransition(null, "company-1", "connected")).toEqual({
      ok: false,
      code: "missing_connection",
    });
  });
});
