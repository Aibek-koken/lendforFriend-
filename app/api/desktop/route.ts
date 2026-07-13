import { NextResponse } from "next/server";
import {
  readBearerToken,
  validateDesktopSession,
  type DesktopSessionRecord,
} from "@/lib/desktop-auth/session";
import { hashHandoffSecret } from "@/lib/desktop-auth/secrets";
import {
  decideCrmStatusTransition,
  isRequestedCrmStatus,
  type CrmConnectionRecord,
  type RequestedCrmStatus,
} from "@/lib/signup/crmCompletion";
import { captureAnalyticsEvent } from "@/lib/analytics";
import {
  adminConfigProblem,
  createAdminClient,
  isAdminConfigured,
} from "@/lib/supabase/admin";
import { authorizeDesktopSession } from "@/lib/desktop-auth/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failure(errorCode: string, status: number) {
  return NextResponse.json({ ok: false, errorCode }, { status });
}

function authFailure(
  code: "missing" | "invalid" | "expired" | "revoked" | "no_company"
) {
  if (code === "no_company") return failure("workspace_required", 403);
  if (code === "expired") return failure("session_expired", 401);
  if (code === "revoked") return failure("session_revoked", 401);
  return failure("unauthorized", 401);
}

function crmFailure(
  code: "missing_connection" | "wrong_company" | "wrong_provider" | "not_allowed"
) {
  if (code === "not_allowed") return failure("crm_transition_not_allowed", 403);
  return failure("crm_not_authorized", 403);
}

// The desktop's status reconciliation body (Doc/25 Phase 4). Both fields are
// optional so the original body-less "mark my amoCRM row connected" contract
// keeps working for already-shipped callers.
function parseRequestedTransition(
  body: unknown
): { provider: string; status: RequestedCrmStatus } | { invalid: true } {
  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const provider =
    typeof record.provider === "string" ? record.provider : "amocrm";

  const status = record.status === undefined ? "connected" : record.status;
  if (!isRequestedCrmStatus(status)) return { invalid: true };

  return { provider, status };
}

/**
 * The desktop's read of its workspace's CRM situation.
 *
 * Returns ONLY non-secret metadata — the same columns the web account page
 * renders. There is no code path from here to crm_connection_secrets, so a
 * compromised desktop session cannot yield a client_secret or a token; the worst
 * it can learn is which amoCRM account the workspace is attached to.
 *
 * This is what replaced the desktop's own amoCRM connect form: the app reads
 * status, it does not own it.
 */
export async function GET(request: Request) {
  const auth = await authorizeDesktopSession(request);
  if (!auth.ok) return auth.response;

  const connection = await auth.admin
    .from("crm_connections")
    .select(
      "provider, status, subdomain, domain_zone, external_account_id, connected_at, last_error_code, last_error_at"
    )
    .eq("company_id", auth.companyId)
    .maybeSingle<{
      provider: string;
      status: string;
      subdomain: string | null;
      domain_zone: string | null;
      external_account_id: string | null;
      connected_at: string | null;
      last_error_code: string | null;
      last_error_at: string | null;
    }>();

  if (connection.error) {
    console.error("desktop api: crm_connections lookup failed", {
      code: connection.error.code,
      message: connection.error.message,
    });
    return failure("server_error", 500);
  }

  const company = await auth.admin
    .from("companies")
    .select("name, mode")
    .eq("id", auth.companyId)
    .maybeSingle<{ name: string; mode: string }>();

  const row = connection.data;

  return NextResponse.json(
    {
      ok: true,
      workspace: {
        companyId: auth.companyId,
        companyName: company.data?.name ?? null,
        mode: company.data?.mode ?? null,
        crmProvider: row?.provider ?? null,
        crmStatus: row?.status ?? null,
        crmSubdomain: row?.subdomain ?? null,
        crmDomainZone: row?.domain_zone ?? null,
        crmAccountId: row?.external_account_id ?? null,
        crmConnectedAt: row?.connected_at ?? null,
        crmLastErrorCode: row?.last_error_code ?? null,
        crmLastErrorAt: row?.last_error_at ?? null,
      },
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const sessionToken = readBearerToken(request.headers.get("authorization"));
  if (!sessionToken) return failure("unauthorized", 401);

  if (!isAdminConfigured()) {
    console.error("desktop crm status: not configured —", adminConfigProblem());
    return failure("not_configured", 503);
  }

  const configProblem = adminConfigProblem();
  if (configProblem) {
    console.error("desktop crm status: misconfigured —", configProblem);
  }

  // A body-less POST (the original completion contract) means
  // provider=amocrm, status=connected.
  const body = await request.json().catch(() => null);
  const transition = parseRequestedTransition(body);
  if ("invalid" in transition) return failure("invalid_status", 400);
  if (transition.provider !== "amocrm") return failure("crm_not_authorized", 403);

  try {
    const admin = createAdminClient();

    const sessionLookup = await admin
      .from("desktop_sessions")
      .select("user_id, company_id, expires_at, revoked_at")
      .eq("token_hash", hashHandoffSecret(sessionToken))
      .maybeSingle<{
        user_id: string;
        company_id: string | null;
        expires_at: string;
        revoked_at: string | null;
      }>();

    if (sessionLookup.error) {
      console.error("desktop crm status: desktop_sessions lookup failed", {
        code: sessionLookup.error.code,
        message: sessionLookup.error.message,
        hint: sessionLookup.error.hint,
      });
      return failure("server_error", 500);
    }

    const sessionValidation = validateDesktopSession(
      sessionLookup.data
        ? ({
            userId: sessionLookup.data.user_id,
            companyId: sessionLookup.data.company_id,
            expiresAt: sessionLookup.data.expires_at,
            revokedAt: sessionLookup.data.revoked_at,
          } satisfies DesktopSessionRecord)
        : null,
      new Date()
    );

    if (!sessionValidation.ok) {
      return authFailure(sessionValidation.code);
    }

    const companyId = sessionValidation.session.companyId;
    const connectionLookup = await admin
      .from("crm_connections")
      .select("id, company_id, provider, status")
      .eq("company_id", companyId)
      .maybeSingle<{
        id: string;
        company_id: string;
        provider: string;
        status: string;
      }>();

    if (connectionLookup.error) {
      console.error("desktop crm status: crm_connections lookup failed", {
        code: connectionLookup.error.code,
        message: connectionLookup.error.message,
        hint: connectionLookup.error.hint,
      });
      return failure("server_error", 500);
    }

    const decision = decideCrmStatusTransition(
      connectionLookup.data
        ? ({
            companyId: connectionLookup.data.company_id,
            provider: connectionLookup.data.provider,
            status: connectionLookup.data.status,
          } satisfies CrmConnectionRecord)
        : null,
      companyId,
      transition.status
    );

    if (!decision.ok) {
      return crmFailure(decision.code);
    }

    if (decision.changed) {
      const update = await admin
        .from("crm_connections")
        .update({ status: decision.nextStatus })
        .eq("id", connectionLookup.data!.id)
        .eq("company_id", companyId)
        .select("provider, status")
        .maybeSingle<{ provider: string; status: string }>();

      if (update.error || !update.data) {
        console.error("desktop crm status: crm_connections update failed", {
          code: update.error?.code,
          message: update.error?.message,
          hint: update.error?.hint,
        });
        return failure("server_error", 500);
      }

      // crm_connected fires ONLY here: the database row genuinely moved to
      // `connected`. Idempotent retries (decision.changed === false) and
      // disconnects never emit it, so one real connection produces exactly
      // one event. Payload stays within the sanitized safe-property set.
      if (decision.nextStatus === "connected") {
        await captureAnalyticsEvent({
          distinctId: sessionValidation.session.userId,
          event: "crm_connected",
          properties: {
            company_id: companyId,
            crm_provider: "amocrm",
            mode: "real",
            source: "desktop",
          },
        });
      }
    }

    return NextResponse.json(
      {
        ok: true,
        workspace: {
          crmProvider: "amocrm",
          crmStatus: decision.nextStatus,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (cause) {
    console.error(
      "desktop crm status: could not reach Supabase",
      cause instanceof Error ? cause.message : cause
    );
    return failure("server_error", 500);
  }
}
