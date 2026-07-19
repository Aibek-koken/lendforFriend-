// amoCRM connection primitives. Pure and dependency-free — no node:crypto, no
// Supabase, no fetch — so this module is safe to import from a client component
// (the setup form validates against exactly the rules the server enforces) and
// is fully unit-testable.
//
// The network/token half lives in lib/crm/amocrmTokens.ts, which is server-only.

export const AMOCRM_DOMAIN_ZONES = ["amocrm.ru", "amocrm.com", "kommo.com"] as const;
export type AmoCrmDomainZone = (typeof AMOCRM_DOMAIN_ZONES)[number];

export function isAmoCrmDomainZone(value: unknown): value is AmoCrmDomainZone {
  return typeof value === "string" && (AMOCRM_DOMAIN_ZONES as readonly string[]).includes(value);
}

/**
 * amoCRM subdomains are the account's own DNS label: lowercase alphanumerics and
 * hyphens. Validated identically here and in the SQL check constraint, so a
 * value that passes the form can never be rejected by the database.
 */
const SUBDOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;

export function normalizeSubdomain(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  // People paste the whole URL. Take the first label of the host and drop any
  // scheme/path around it, rather than failing them for being helpful.
  const withoutScheme = trimmed.replace(/^https?:\/\//, "");
  return withoutScheme.split("/")[0]?.split(".")[0] ?? "";
}

export function isValidSubdomain(value: string): boolean {
  return SUBDOMAIN_PATTERN.test(value);
}

/**
 * The integration's client id. amoCRM issues UUIDs, but we only assert shape
 * loosely: a wrong-but-plausible id must fail at amoCRM's own token endpoint
 * with a real error, not be silently rejected here on a guess about their format.
 */
export function isValidClientId(value: string): boolean {
  return /^[A-Za-z0-9-]{8,80}$/.test(value.trim());
}

export function isValidClientSecret(value: string): boolean {
  return value.trim().length >= 20 && value.trim().length <= 400;
}

export type AmoCrmCredentialInput = {
  subdomain: string;
  domainZone: string;
  clientId: string;
  clientSecret: string;
};

export type AmoCrmCredentialErrors = Partial<Record<keyof AmoCrmCredentialInput, string>>;

export type AmoCrmCredentialValidation =
  | {
      ok: true;
      value: {
        subdomain: string;
        domainZone: AmoCrmDomainZone;
        clientId: string;
        clientSecret: string;
      };
    }
  | { ok: false; errors: AmoCrmCredentialErrors };

export function validateAmoCrmCredentials(input: AmoCrmCredentialInput): AmoCrmCredentialValidation {
  const errors: AmoCrmCredentialErrors = {};

  const subdomain = normalizeSubdomain(input.subdomain ?? "");
  if (!subdomain) errors.subdomain = "subdomain_required";
  else if (!isValidSubdomain(subdomain)) errors.subdomain = "subdomain_invalid";

  if (!isAmoCrmDomainZone(input.domainZone)) errors.domainZone = "domain_zone_invalid";

  const clientId = (input.clientId ?? "").trim();
  if (!clientId) errors.clientId = "client_id_required";
  else if (!isValidClientId(clientId)) errors.clientId = "client_id_invalid";

  const clientSecret = (input.clientSecret ?? "").trim();
  if (!clientSecret) errors.clientSecret = "client_secret_required";
  else if (!isValidClientSecret(clientSecret)) errors.clientSecret = "client_secret_invalid";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      subdomain,
      domainZone: input.domainZone as AmoCrmDomainZone,
      clientId,
      clientSecret,
    },
  };
}

/**
 * The anti-CSRF nonce for the amoCRM consent round trip.
 *
 * Set httpOnly by the server action that mints the authorize URL, and checked by
 * the callback route before the code is exchanged. Without it, an attacker could
 * feed a victim's browser a crafted /api/crm/amocrm/callback?code=… and bind
 * THEIR amoCRM account to the victim's workspace.
 *
 * Lives here rather than beside the action that sets it because a "use server"
 * file may only export async functions.
 */
export const AMOCRM_STATE_COOKIE = "liveassist_amocrm_state";
export const AMOCRM_STATE_TTL_SECONDS = 600;

/** `https://acme.amocrm.ru` — the account's REST + token host. */
export function accountBaseUrl(subdomain: string, domainZone: AmoCrmDomainZone): string {
  return `https://${subdomain}.${domainZone}`;
}

/**
 * The redirect URI amoCRM sends the authorization code back to. It is now a
 * route on THIS web app, not the Express proxy: the code must land somewhere
 * that can exchange it for tokens and encrypt them server-side.
 *
 * The customer pastes this exact string into their amoCRM integration's
 * "Redirect URI" field, so it must be stable and byte-for-byte comparable.
 */
export const AMOCRM_CALLBACK_PATH = "/api/crm/amocrm/callback";

export function amoCrmRedirectUri(origin: string): string {
  return `${origin.replace(/\/+$/, "")}${AMOCRM_CALLBACK_PATH}`;
}

/**
 * amoCRM's consent screen. Note this is `https://www.{zone}/oauth`, NOT the
 * account host — the account host's /oauth2/authorize path only ever accepts the
 * backend's POST token exchange and answers a browser GET with a 405.
 *
 * Carries only client_id, state and mode. Never the client_secret, and never the
 * redirect_uri (that is sent backend-to-backend in the token exchange body).
 */
export function amoCrmAuthorizeUrl(params: {
  domainZone: AmoCrmDomainZone;
  clientId: string;
  state: string;
}): string {
  // mode=popup is the redirect flavour: amoCRM sends the browser back to the
  // integration's configured Redirect URI with ?code=…&state=…&referer=… .
  // mode=post_message would instead postMessage the code to an opener window,
  // which a server-side callback route has no way to receive.
  const query = new URLSearchParams({
    client_id: params.clientId,
    state: params.state,
    mode: "popup",
  });
  return `https://www.${params.domainZone}/oauth?${query.toString()}`;
}
