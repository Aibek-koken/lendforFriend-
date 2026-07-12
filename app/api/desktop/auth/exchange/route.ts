import { NextResponse } from "next/server";
import {
  DESKTOP_SESSION_TTL_SECONDS,
  isHandoffSecret,
  type ExchangeErrorCode,
} from "@/lib/desktop-auth/handoff";
import { generateHandoffSecret, hashHandoffSecret } from "@/lib/desktop-auth/secrets";
import { adminConfigProblem, createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";

// Stage 2 exchange endpoint. The desktop app POSTs the one-time code and the
// state nonce it received through the liveassist:// deep link, and gets back a
// desktop session plus the profile/workspace snapshot it needs to start.
//
// Invariants:
//   * Never log `code`, `state`, or the issued session token. Not even
//     truncated — a prefix of a 256-bit secret is still secret material.
//   * Never return a Supabase access_token or refresh_token.
//   * Every rejection returns the same opaque `invalid_code`, so this endpoint
//     cannot be used to probe whether a code exists, has expired, or was spent.
//   * The atomic claim happens inside `consume_desktop_auth_code`; this handler
//     must not "check then update", which would race.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExchangeRequest = { code?: unknown; state?: unknown };

function failure(code: ExchangeErrorCode, status: number) {
  return NextResponse.json({ ok: false, errorCode: code }, { status });
}

export async function POST(request: Request) {
  let payload: ExchangeRequest;

  try {
    payload = (await request.json()) as ExchangeRequest;
  } catch {
    return failure("invalid_payload", 400);
  }

  const { code, state } = payload;

  if (!isHandoffSecret(code) || !isHandoffSecret(state)) {
    return failure("invalid_payload", 400);
  }

  if (!isAdminConfigured()) {
    console.error("desktop exchange: not configured —", adminConfigProblem());
    return failure("not_configured", 503);
  }

  // A key belonging to a different Supabase project than the one auth runs on
  // fails as "Invalid API key" — an opaque 500 unless we say so up front.
  const configProblem = adminConfigProblem();
  if (configProblem) {
    console.error("desktop exchange: misconfigured —", configProblem);
  }

  const sessionToken = generateHandoffSecret();

  let data: unknown;
  try {
    const admin = createAdminClient();
    const result = await admin.rpc("consume_desktop_auth_code", {
      requested_code_hash: hashHandoffSecret(code),
      requested_state_hash: hashHandoffSecret(state),
      session_token_hash: hashHandoffSecret(sessionToken),
      session_ttl_seconds: DESKTOP_SESSION_TTL_SECONDS,
    });

    // Server-side only, and safe: the RPC receives nothing but hashes, so its
    // error can carry no code, state, or token. The client still gets an opaque
    // answer — but without this, a dead project or a wrong-project service key
    // is indistinguishable from a genuine outage.
    if (result.error) {
      console.error("desktop exchange: consume_desktop_auth_code failed", {
        code: result.error.code,
        message: result.error.message,
        hint: result.error.hint,
      });
      return failure("server_error", 500);
    }
    data = result.data;
  } catch (cause) {
    console.error(
      "desktop exchange: could not reach Supabase",
      cause instanceof Error ? cause.message : cause
    );
    return failure("server_error", 500);
  }

  const outcome = (data ?? {}) as {
    ok?: boolean;
    userId?: string;
    language?: string;
    workspace?: Record<string, unknown>;
    session?: { expiresAt?: string };
  };

  // Expired, already consumed, unknown, or state-mismatched — all one answer.
  if (!outcome.ok || !outcome.userId) {
    return failure("invalid_code", 401);
  }

  return NextResponse.json(
    {
      ok: true,
      userId: outcome.userId,
      language: outcome.language === "ru" ? "ru" : "en",
      workspace: outcome.workspace ?? {},
      session: {
        token: sessionToken,
        expiresAt: outcome.session?.expiresAt ?? null,
      },
    },
    {
      status: 200,
      // The response body is a bearer credential; keep it out of every cache.
      headers: { "Cache-Control": "no-store" },
    }
  );
}
