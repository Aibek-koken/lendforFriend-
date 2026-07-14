import { siteOrigin } from "./crm/origin";

/**
 * The two-domain split, in one place.
 *
 * `liveassist.tech` (the apex) is the PUBLIC LANDING host: it serves the
 * marketing page and nothing account-shaped. `www.liveassist.tech` (whatever
 * `siteOrigin()` resolves to) is the PRIVATE PORTAL host: signup, account,
 * CRM setup, desktop auth. One Vercel deployment serves both hosts, so every
 * routing decision here is made from the request's Host header — never from
 * a hardcoded assumption about which domain a request arrived on.
 *
 * Everything in this module is pure so `middleware.ts` stays a thin adapter
 * and the redirect matrix (including the no-loop property) is unit-testable.
 */
export const LANDING_HOSTNAME = "liveassist.tech";

/** The public landing origin. CTAs on the portal that point "back to the site" use this. */
export function landingOrigin(): string {
  return `https://${LANDING_HOSTNAME}`;
}

/** Where `/` on the portal host sends a signed-out visitor. */
export const PORTAL_ROOT_SIGNED_OUT = "/signup";
/** Where `/` on the portal host sends an authenticated user. */
export const PORTAL_ROOT_SIGNED_IN = "/account";

export function portalRootTarget(isAuthenticated: boolean): string {
  return isAuthenticated ? PORTAL_ROOT_SIGNED_IN : PORTAL_ROOT_SIGNED_OUT;
}

/**
 * The exact URL landing CTAs must use. Absolute on purpose: the landing lives
 * on the apex, and a relative `/signup` there would resolve to the apex — one
 * extra redirect at best, a broken flow if the apex ever stops forwarding.
 */
export function portalSignupUrl(lang?: string): string {
  const query = lang ? `?lang=${encodeURIComponent(lang)}` : "";
  return `${siteOrigin()}${PORTAL_ROOT_SIGNED_OUT}${query}`;
}

/** Lowercased hostname from a Host header (port stripped, IPv6-safe). */
export function hostnameOf(hostHeader: string | null | undefined): string {
  const raw = (hostHeader ?? "").trim();
  if (!raw) return "";
  try {
    return new URL(`http://${raw}`).hostname.toLowerCase();
  } catch {
    return raw.split(":")[0].toLowerCase();
  }
}

export function isLandingHost(hostHeader: string | null | undefined): boolean {
  return hostnameOf(hostHeader) === LANDING_HOSTNAME;
}

/**
 * Portal PAGE paths: when a browser GETs one of these on the landing host, it
 * is sent to the same path on the portal origin. Pages only — the technical
 * prefixes below are excluded before this list is ever consulted.
 */
const PORTAL_PAGE_PREFIXES = ["/signup", "/account"] as const;

/**
 * Technical routes that must never be host- or root-redirected: Supabase
 * OAuth (`/auth/callback`), the desktop auth exchange and CRM runtime
 * (`/api/desktop*`), the amoCRM OAuth callback (`/api/crm/amocrm/callback`),
 * downloads, analytics, waitlist. A redirect here would break a state-cookie
 * or bearer-token flow that is pinned to one exact host.
 */
const TECHNICAL_PREFIXES = ["/api/", "/auth/"] as const;

function isPortalPagePath(pathname: string): boolean {
  return PORTAL_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isTechnicalPath(pathname: string): boolean {
  return TECHNICAL_PREFIXES.some(
    (prefix) => pathname.startsWith(prefix) || pathname === prefix.slice(0, -1)
  );
}

export type RouteDecision =
  /** Let the request through untouched (render / existing session refresh). */
  | { kind: "pass" }
  /** `/` on the portal host: redirect by auth state (signed in → /account, out → /signup). */
  | { kind: "portal-root" }
  /** A portal page hit on the landing host: send to the portal origin. */
  | { kind: "cross-host-redirect"; url: string };

export function decideRoute(input: {
  host: string | null | undefined;
  pathname: string;
  search?: string;
  method: string;
}): RouteDecision {
  const method = input.method.toUpperCase();
  // Only page loads are ever redirected. POST bodies, CORS preflights, and
  // webhook-style calls must reach their handler on whichever host they hit.
  if (method !== "GET" && method !== "HEAD") return { kind: "pass" };

  if (isTechnicalPath(input.pathname)) return { kind: "pass" };

  if (isLandingHost(input.host)) {
    if (isPortalPagePath(input.pathname)) {
      const portal = siteOrigin();
      // Misconfiguration guard: if the portal origin were ever pointed at the
      // landing host itself, redirecting would loop. Serve in place instead.
      if (hostnameOf(new URL(portal).host) === hostnameOf(input.host)) {
        return { kind: "pass" };
      }
      return {
        kind: "cross-host-redirect",
        url: `${portal}${input.pathname}${input.search ?? ""}`,
      };
    }
    // The landing itself (`/`), legal pages, static assets.
    return { kind: "pass" };
  }

  // Portal host (www, previews, localhost): the root is not a landing page.
  if (input.pathname === "/") return { kind: "portal-root" };

  return { kind: "pass" };
}
