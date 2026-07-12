import { NextResponse } from "next/server";
import {
  readBearerToken,
  validateDesktopSession,
  type DesktopSessionRecord,
} from "@/lib/desktop-auth/session";
import { hashHandoffSecret } from "@/lib/desktop-auth/secrets";
import {
  decideAmoCrmCompletion,
  type CrmConnectionRecord,
} from "@/lib/signup/crmCompletion";
import {
  adminConfigProblem,
  createAdminClient,
  isAdminConfigured,
} from "@/lib/supabase/admin";

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
  code:
    | "missing_connection"
    | "wrong_company"
    | "wrong_provider"
    | "not_pending"
) {
  if (code === "not_pending") return failure("crm_not_pending", 403);
  return failure("crm_not_authorized", 403);
}

export async function POST(request: Request) {
  const sessionToken = readBearerToken(request.headers.get("authorization"));
  if (!sessionToken) return failure("unauthorized", 401);

  if (!isAdminConfigured()) {
    console.error("desktop crm completion: not configured —", adminConfigProblem());
    return failure("not_configured", 503);
  }

  const configProblem = adminConfigProblem();
  if (configProblem) {
    console.error("desktop crm completion: misconfigured —", configProblem);
  }

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
      console.error("desktop crm completion: desktop_sessions lookup failed", {
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
      console.error("desktop crm completion: crm_connections lookup failed", {
        code: connectionLookup.error.code,
        message: connectionLookup.error.message,
        hint: connectionLookup.error.hint,
      });
      return failure("server_error", 500);
    }

    const decision = decideAmoCrmCompletion(
      connectionLookup.data
        ? ({
            companyId: connectionLookup.data.company_id,
            provider: connectionLookup.data.provider,
            status: connectionLookup.data.status,
          } satisfies CrmConnectionRecord)
        : null,
      companyId
    );

    if (!decision.ok) {
      return crmFailure(decision.code);
    }

    if (!decision.alreadyConnected) {
      const update = await admin
        .from("crm_connections")
        .update({ status: "connected" })
        .eq("id", connectionLookup.data!.id)
        .eq("company_id", companyId)
        .select("provider, status")
        .maybeSingle<{ provider: string; status: string }>();

      if (update.error || !update.data) {
        console.error("desktop crm completion: crm_connections update failed", {
          code: update.error?.code,
          message: update.error?.message,
          hint: update.error?.hint,
        });
        return failure("server_error", 500);
      }
    }

    return NextResponse.json(
      {
        ok: true,
        workspace: {
          crmProvider: "amocrm",
          crmStatus: "connected",
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (cause) {
    console.error(
      "desktop crm completion: could not reach Supabase",
      cause instanceof Error ? cause.message : cause
    );
    return failure("server_error", 500);
  }
}
