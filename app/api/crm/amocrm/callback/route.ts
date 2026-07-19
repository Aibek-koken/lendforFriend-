import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { captureAnalyticsEvent } from "@/lib/analytics";
import { AMOCRM_STATE_COOKIE, amoCrmRedirectUri, isAmoCrmDomainZone } from "@/lib/crm/amocrm";
import { AmoCrmTokenError, exchangeAuthorizationCode } from "@/lib/crm/amocrmTokens";
import { siteOrigin } from "@/lib/crm/origin";
import {
  DESKTOP_STATE_COOKIE,
  DESKTOP_STATE_PARAM,
  readDesktopStateParam,
} from "@/lib/desktop-auth/handoff";
import {
  loadClientSecret,
  loadCrmMetadata,
  loadWorkspaceForUser,
  markCrmConnected,
  markCrmFailed,
  saveTokenPair,
} from "@/lib/crm/store";
import { toCrmErrorCode, type CrmErrorCode } from "@/lib/crm/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Where amoCRM sends the browser back after consent. This route is the ONLY
// place an authorization code is ever exchanged, and the resulting tokens never
// leave the server: they go straight into the encrypted secrets table.
//
// The desktop app is not involved. It never sees the code, the state, the
// client_secret, or the tokens — it only ever reads the resulting non-secret
// status through GET /api/desktop.

function back(lang: string, params: Record<string, string>, desktopState: string | null = null) {
  const query = new URLSearchParams({ lang, ...params });
  if (desktopState) query.set(DESKTOP_STATE_PARAM, desktopState);
  return NextResponse.redirect(`${siteOrigin()}/account/integrations?${query.toString()}`, {
    status: 303,
  });
}

function failure(lang: string, code: CrmErrorCode, desktopState: string | null = null) {
  return back(lang, { error: code }, desktopState);
}

/** Constant-time compare, so the state check cannot be probed a byte at a time. */
function statesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = url.searchParams.get("lang") === "ru" ? "ru" : "en";

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const referer = url.searchParams.get("referer");
  const denied = url.searchParams.get("error");

  // The one-shot nonce is consumed no matter how this ends, so a replayed
  // callback URL (browser history, a shared link) finds nothing to match.
  const cookieStore = cookies();
  const expectedState = cookieStore.get(AMOCRM_STATE_COOKIE)?.value ?? null;
  const desktopState = readDesktopStateParam(cookieStore.get(DESKTOP_STATE_COOKIE)?.value);
  cookieStore.delete(AMOCRM_STATE_COOKIE);

  if (denied) return failure(lang, "access_denied", desktopState);
  if (!code || !state) return failure(lang, "unknown", desktopState);

  // CSRF / mixup defence, BEFORE any network call or database write: refuse a
  // callback whose state we did not mint in this browser.
  if (!expectedState || !statesMatch(state, expectedState)) {
    return failure(lang, "state_mismatch", desktopState);
  }

  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.redirect(`${siteOrigin()}/signup?lang=${lang}`, { status: 303 });
  }

  const workspace = await loadWorkspaceForUser(authData.user.id);
  if (!workspace || workspace.mode !== "real") return failure(lang, "unknown", desktopState);

  const metadata = await loadCrmMetadata(workspace);
  if (
    metadata.provider !== "amocrm" ||
    !metadata.subdomain ||
    !isAmoCrmDomainZone(metadata.domainZone) ||
    !metadata.clientId
  ) {
    return failure(lang, "invalid_credentials", desktopState);
  }

  const clientSecret = await loadClientSecret(workspace.companyId);
  if (!clientSecret) return failure(lang, "invalid_credentials", desktopState);

  const redirectUri = amoCrmRedirectUri(siteOrigin());

  try {
    const tokens = await exchangeAuthorizationCode({
      subdomain: metadata.subdomain,
      domainZone: metadata.domainZone,
      clientId: metadata.clientId,
      clientSecret,
      code,
      redirectUri,
    });

    const stored = await saveTokenPair(workspace.companyId, tokens);
    if (!stored) {
      // The tokens are real but we cannot keep them. Saying "connected" here
      // would strand the workspace with a status it cannot act on.
      await markCrmFailed(workspace.companyId, "unknown");
      return failure(lang, "unknown", desktopState);
    }

    const connected = await markCrmConnected(workspace.companyId, referer);
    if (!connected.ok) {
      return failure(lang, "unknown", desktopState);
    }

    // crm_connected fires ONLY on a genuine move to connected — a re-authorize
    // of an already-connected workspace must not double-count.
    if (connected.changed) {
      await captureAnalyticsEvent({
        distinctId: authData.user.id,
        event: "crm_connected",
        properties: {
          company_id: workspace.companyId,
          crm_provider: "amocrm",
          mode: "real",
          source: "web",
        },
      });
    }

    return back(lang, { connected: "1" }, desktopState);
  } catch (cause) {
    const code = cause instanceof AmoCrmTokenError ? cause.code : toCrmErrorCode(null);

    // Only a genuine credential rejection marks the row failed. A rate limit or
    // an unreachable amoCRM is transient — flipping the workspace to `failed`
    // over a blip would send the customer to re-enter credentials that were
    // never wrong. (Same lesson as the desktop's TASK-R refresh fix.)
    if (code === "invalid_credentials") {
      await markCrmFailed(workspace.companyId, code);
    }

    console.error("amocrm callback: token exchange failed", { code });
    return failure(lang, code, desktopState);
  }
}
