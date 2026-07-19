// The one place "what is this workspace's CRM situation?" is decided.
//
// Pure and dependency-free. The web /account page renders it, and the desktop's
// Settings > Integrations card renders the same states from the same server
// snapshot (GET /api/desktop), so the two surfaces can never disagree about
// whether a workspace is connected.
//
// Load-bearing rule, same as the desktop's resolveCrmRuntime: a REAL workspace
// never silently reads as "fine". Every non-connected outcome is an explicit,
// named state with an honest next action.

export type WorkspaceMode = "real" | "demo";

/** Non-secret CRM metadata. Mirrors public.crm_connections — no token, no secret. */
export type CrmConnectionMetadata = {
  mode: WorkspaceMode | null;
  provider: string | null;
  status: string | null;
  subdomain: string | null;
  domainZone: string | null;
  clientId: string | null;
  accountId: string | null;
  connectedAt: string | null;
  lastErrorCode: string | null;
  lastErrorAt: string | null;
};

export type CrmAccountState =
  // No workspace yet (signup never finished).
  | "no_workspace"
  // Demo workspace: built-in demo data, no CRM, no tokens, no keychain.
  // The one CTA is "Connect a real CRM", which starts a real-company signup.
  | "demo"
  // Real workspace on a CRM this beta does not implement.
  | "unsupported"
  // Real amoCRM workspace, no integration credentials saved yet.
  | "setup_required"
  // Credentials saved, but the OAuth consent round trip has not completed.
  | "authorization_required"
  // Live.
  | "connected"
  // A previous attempt failed (bad credentials, revoked refresh token, …).
  | "failed";

const SUPPORTED_PROVIDERS = new Set(["amocrm"]);

export function resolveCrmAccountState(metadata: CrmConnectionMetadata): CrmAccountState {
  if (!metadata.mode) return "no_workspace";
  if (metadata.mode === "demo") return "demo";

  // Real workspace from here on.
  if (!metadata.provider || !SUPPORTED_PROVIDERS.has(metadata.provider)) {
    return "unsupported";
  }

  if (metadata.status === "connected") return "connected";
  if (metadata.status === "failed") return "failed";

  // `pending`: the row exists (signup created it) but the connection has not
  // been completed. Distinguish "we have no credentials at all" from "we have
  // credentials and are waiting on the customer to approve consent" — those
  // need different CTAs, and collapsing them is what made the old flow
  // confusing.
  return metadata.clientId ? "authorization_required" : "setup_required";
}

/** Whether the desktop's CRM Assistant may perform live CRM operations. */
export function isLiveCrmAccountState(state: CrmAccountState): boolean {
  return state === "connected";
}

/**
 * Whether the account surface should offer the amoCRM setup form at all. A demo
 * or unsupported workspace must never see it — and, critically, must never
 * trigger a credential lookup.
 */
export function allowsAmoCrmSetup(state: CrmAccountState): boolean {
  return state === "setup_required" || state === "authorization_required" || state === "failed" || state === "connected";
}

/** `acme.amocrm.ru`, or null when the workspace has no account configured. */
export function crmAccountLabel(metadata: CrmConnectionMetadata): string | null {
  if (!metadata.subdomain || !metadata.domainZone) return null;
  return `${metadata.subdomain}.${metadata.domainZone}`;
}

/**
 * Failure codes we are willing to show a customer. Anything else collapses to
 * `unknown` — a raw provider message could echo back a client id, a code, or a
 * token fragment, and none of those belong in a rendered page or a database
 * column.
 */
export const CRM_ERROR_CODES = [
  "invalid_credentials",
  "authorization_expired",
  "state_mismatch",
  "access_denied",
  "rate_limited",
  "provider_unavailable",
  "unknown",
] as const;

export type CrmErrorCode = (typeof CRM_ERROR_CODES)[number];

export function isCrmErrorCode(value: unknown): value is CrmErrorCode {
  return typeof value === "string" && (CRM_ERROR_CODES as readonly string[]).includes(value);
}

export function toCrmErrorCode(value: unknown): CrmErrorCode {
  return isCrmErrorCode(value) ? value : "unknown";
}
