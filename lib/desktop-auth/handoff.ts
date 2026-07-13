// Stage 2: web -> desktop (Tauri) auth handoff — the ISOMORPHIC half.
//
// The deep link carries exactly two opaque, single-use values and nothing else:
//   liveassist://auth/callback?code=<code>&state=<state>
//
// It never carries a Supabase access_token or refresh_token. The desktop app
// trades the pair for a server-issued session over HTTPS.
//
// `state` is a nonce the DESKTOP generates before it opens the browser. The web
// app echoes it back through the deep link, and the desktop refuses any callback
// whose state it did not itself mint — that is what stops an attacker-crafted
// liveassist:// link from signing a victim's app into the attacker's workspace
// (login CSRF / session fixation). The server independently checks the same
// nonce's hash, so the binding holds even if the desktop check were bypassed.
//
// Everything here is safe to import from a client component. Anything that
// touches node:crypto lives in ./secrets.ts, which must stay server-only —
// importing it from a "use client" file breaks the build on purpose.

export const DESKTOP_SCHEME = "liveassist";
export const DESKTOP_CALLBACK_PATH = "auth/callback";

/**
 * The query param the desktop nonce travels under on WEB urls
 * (`/signup?desktop_state=…`, `/auth/callback?desktop_state=…`).
 *
 * Deliberately NOT `state`: Supabase's own OAuth round trip owns that name, and
 * a collision on `/auth/callback` would be a genuinely nasty bug. The nonce only
 * takes the name `state` once it reaches the deep link, where the desktop
 * contract requires it.
 */
export const DESKTOP_STATE_PARAM = "desktop_state";
export const DESKTOP_STATE_COOKIE = "liveassist_desktop_state";
export const DESKTOP_STATE_COOKIE_MAX_AGE_SECONDS = 10 * 60;

/** One-time code lifetime. Long enough to click a button, short enough that a
 *  leaked link (browser history, shoulder-surfing) is near-useless. */
export const AUTH_CODE_TTL_SECONDS = 300;

/** Desktop session lifetime. The desktop stores the token in the OS keychain. */
export const DESKTOP_SESSION_TTL_SECONDS = 60 * 60 * 24 * 90;

/** 32 bytes of entropy, base64url-encoded. */
const SECRET_PATTERN = /^[A-Za-z0-9_-]{22,86}$/;
const HASH_PATTERN = /^[0-9a-f]{64}$/;

export function isHandoffSecret(value: unknown): value is string {
  return typeof value === "string" && SECRET_PATTERN.test(value);
}

export function isHandoffHash(value: unknown): value is string {
  return typeof value === "string" && HASH_PATTERN.test(value);
}

export function buildDesktopDeepLink(code: string, state: string): string {
  const params = new URLSearchParams({ code, state });
  return `${DESKTOP_SCHEME}://${DESKTOP_CALLBACK_PATH}?${params.toString()}`;
}

/** The desktop hands its nonce to the browser as `/signup?desktop_state=<nonce>`.
 *  An absent or malformed value means "not desktop-initiated" — never a fatal
 *  error, since the same page also serves plain web signups. */
export function readDesktopStateParam(value: unknown): string | null {
  return isHandoffSecret(value) ? value : null;
}

/** Every rejection reason collapses to one client-facing code. The desktop is
 *  told the link is unusable, not *why* — a probing caller learns nothing about
 *  whether a code existed, had expired, or was already spent. */
export const EXCHANGE_ERROR_CODES = [
  "invalid_payload",
  "invalid_code",
  "not_configured",
  "server_error",
] as const;

export type ExchangeErrorCode = (typeof EXCHANGE_ERROR_CODES)[number];

/** Why a one-time code was refused. Never sent to a client — see above. */
export type AuthCodeRejection = "expired" | "consumed" | "state_mismatch";
