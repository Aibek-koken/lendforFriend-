import { NextResponse } from "next/server";
import { hashHandoffSecret } from "./secrets";
import {
  readBearerToken,
  validateDesktopSession,
  type DesktopSessionRecord,
} from "./session";
import {
  adminConfigProblem,
  createAdminClient,
  isAdminConfigured,
} from "@/lib/supabase/admin";

function failure(errorCode: string, status: number) {
  return NextResponse.json({ ok: false, errorCode }, { status });
}

export type AuthorizedDesktopSession = {
  ok: true;
  userId: string;
  companyId: string;
  admin: ReturnType<typeof createAdminClient>;
};

export async function authorizeDesktopSession(
  request: Request
): Promise<AuthorizedDesktopSession | { ok: false; response: NextResponse }> {
  const sessionToken = readBearerToken(request.headers.get("authorization"));
  if (!sessionToken) return { ok: false, response: failure("unauthorized", 401) };

  if (!isAdminConfigured()) {
    console.error("desktop api: not configured —", adminConfigProblem());
    return { ok: false, response: failure("not_configured", 503) };
  }

  const admin = createAdminClient();
  const lookup = await admin
    .from("desktop_sessions")
    .select("user_id, company_id, expires_at, revoked_at")
    .eq("token_hash", hashHandoffSecret(sessionToken))
    .maybeSingle<{
      user_id: string;
      company_id: string | null;
      expires_at: string;
      revoked_at: string | null;
    }>();

  if (lookup.error) {
    console.error("desktop api: desktop_sessions lookup failed", {
      code: lookup.error.code,
      message: lookup.error.message,
    });
    return { ok: false, response: failure("server_error", 500) };
  }

  const validation = validateDesktopSession(
    lookup.data
      ? ({
          userId: lookup.data.user_id,
          companyId: lookup.data.company_id,
          expiresAt: lookup.data.expires_at,
          revokedAt: lookup.data.revoked_at,
        } satisfies DesktopSessionRecord)
      : null,
    new Date()
  );

  if (!validation.ok) {
    if (validation.code === "no_company") {
      return { ok: false, response: failure("workspace_required", 403) };
    }
    if (validation.code === "expired") {
      return { ok: false, response: failure("session_expired", 401) };
    }
    if (validation.code === "revoked") {
      return { ok: false, response: failure("session_revoked", 401) };
    }
    return { ok: false, response: failure("unauthorized", 401) };
  }

  return {
    ok: true,
    userId: validation.session.userId,
    companyId: validation.session.companyId,
    admin,
  };
}
