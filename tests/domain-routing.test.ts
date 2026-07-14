import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LANDING_HOSTNAME,
  PORTAL_ROOT_SIGNED_IN,
  PORTAL_ROOT_SIGNED_OUT,
  decideRoute,
  hostnameOf,
  isLandingHost,
  landingOrigin,
  portalRootTarget,
  portalSignupUrl,
  type RouteDecision,
} from "@/lib/hosts";

const WWW = "www.liveassist.tech";
const APEX = "liveassist.tech";
const PREVIEW = "liveassist-git-branch-user.vercel.app";

function route(host: string, pathname: string, method = "GET", search = ""): RouteDecision {
  return decideRoute({ host, pathname, search, method });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("portal root (/)", () => {
  it("resolves / on the portal host by auth state, never rendering the landing", () => {
    expect(route(WWW, "/")).toEqual({ kind: "portal-root" });
    expect(route(WWW, "/").kind).not.toBe("pass");
  });

  it("treats previews and localhost as portal hosts too", () => {
    expect(route(PREVIEW, "/")).toEqual({ kind: "portal-root" });
    expect(route("localhost:3000", "/")).toEqual({ kind: "portal-root" });
  });

  it("sends a signed-out visitor to /signup", () => {
    expect(portalRootTarget(false)).toBe(PORTAL_ROOT_SIGNED_OUT);
    expect(PORTAL_ROOT_SIGNED_OUT).toBe("/signup");
  });

  it("sends an authenticated user to /account", () => {
    expect(portalRootTarget(true)).toBe(PORTAL_ROOT_SIGNED_IN);
    expect(PORTAL_ROOT_SIGNED_IN).toBe("/account");
  });

  it("still serves the landing at / on the landing host", () => {
    expect(route(APEX, "/")).toEqual({ kind: "pass" });
  });

  it("never redirects a non-GET request to /", () => {
    expect(route(WWW, "/", "POST")).toEqual({ kind: "pass" });
    expect(route(WWW, "/", "OPTIONS")).toEqual({ kind: "pass" });
  });
});

describe("public portal pages stay reachable", () => {
  it("passes /signup and /auth/callback through on the portal host", () => {
    expect(route(WWW, "/signup")).toEqual({ kind: "pass" });
    expect(route(WWW, "/signup", "GET", "?lang=ru&desktop_state=abc")).toEqual({ kind: "pass" });
    expect(route(WWW, "/auth/callback")).toEqual({ kind: "pass" });
  });

  it("passes /account through on the portal host (its own page enforces auth)", () => {
    expect(route(WWW, "/account")).toEqual({ kind: "pass" });
    expect(route(WWW, "/account/integrations")).toEqual({ kind: "pass" });
  });
});

describe("technical routes are never redirected, on any host or method", () => {
  const technical = [
    "/api/desktop/auth/exchange",
    "/api/desktop",
    "/api/desktop/crm",
    "/api/crm/amocrm/callback",
    "/api/download/mac-arm64",
    "/api/analytics",
    "/api/waitlist",
    "/auth/callback",
  ];

  it.each(technical)("%s passes on both hosts for GET and POST", (pathname) => {
    for (const host of [WWW, APEX, PREVIEW]) {
      expect(route(host, pathname, "GET")).toEqual({ kind: "pass" });
      expect(route(host, pathname, "POST")).toEqual({ kind: "pass" });
    }
  });

  it("never rewrites the host of an OAuth callback (it must finish where it started)", () => {
    expect(route(WWW, "/auth/callback", "GET", "?code=secret&state=abc")).toEqual({
      kind: "pass",
    });
    expect(route(APEX, "/auth/callback", "GET", "?code=secret&state=abc")).toEqual({
      kind: "pass",
    });
  });

  it("leaves the legacy proxy path /amocrm/callback untouched on both hosts", () => {
    // The legacy amoCRM callback lives on the Express proxy deployment, not
    // this app — but even if the path is ever hit here, it must not redirect.
    expect(route(WWW, "/amocrm/callback")).toEqual({ kind: "pass" });
    expect(route(APEX, "/amocrm/callback")).toEqual({ kind: "pass" });
  });
});

describe("landing host redirects portal pages to the portal origin", () => {
  it("sends GET /signup on the apex to www, preserving the query", () => {
    expect(route(APEX, "/signup", "GET", "?lang=ru")).toEqual({
      kind: "cross-host-redirect",
      url: "https://www.liveassist.tech/signup?lang=ru",
    });
  });

  it("sends GET /account pages on the apex to www", () => {
    expect(route(APEX, "/account")).toEqual({
      kind: "cross-host-redirect",
      url: "https://www.liveassist.tech/account",
    });
    expect(route(APEX, "/account/integrations", "GET", "?connected=1")).toEqual({
      kind: "cross-host-redirect",
      url: "https://www.liveassist.tech/account/integrations?connected=1",
    });
  });

  it("never cross-host-redirects a POST", () => {
    expect(route(APEX, "/signup", "POST")).toEqual({ kind: "pass" });
  });

  it("does not touch a path that merely starts with a portal prefix", () => {
    expect(route(APEX, "/signup-help")).toEqual({ kind: "pass" });
    expect(route(APEX, "/accounting")).toEqual({ kind: "pass" });
  });

  it("leaves landing content (legal pages, assets) on the landing host", () => {
    expect(route(APEX, "/privacy")).toEqual({ kind: "pass" });
    expect(route(APEX, "/terms")).toEqual({ kind: "pass" });
  });
});

describe("no redirect loops", () => {
  it("every redirect resolves to a pass on its target", () => {
    // apex /signup -> www /signup -> pass
    const cross = route(APEX, "/signup");
    expect(cross.kind).toBe("cross-host-redirect");
    if (cross.kind === "cross-host-redirect") {
      const target = new URL(cross.url);
      expect(route(target.host, target.pathname)).toEqual({ kind: "pass" });
    }

    // www / -> /signup or /account -> pass
    for (const authenticated of [true, false]) {
      expect(route(WWW, portalRootTarget(authenticated))).toEqual({ kind: "pass" });
    }
  });

  it("refuses to redirect if the portal origin is misconfigured to the landing host", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://liveassist.tech");
    expect(route(APEX, "/signup")).toEqual({ kind: "pass" });
  });
});

describe("host and URL helpers", () => {
  it("normalizes host headers", () => {
    expect(hostnameOf("WWW.LiveAssist.tech:443")).toBe("www.liveassist.tech");
    expect(hostnameOf("liveassist.tech")).toBe(LANDING_HOSTNAME);
    expect(hostnameOf(null)).toBe("");
    expect(hostnameOf("")).toBe("");
  });

  it("identifies only the apex as the landing host", () => {
    expect(isLandingHost(APEX)).toBe(true);
    expect(isLandingHost(`${APEX}:443`)).toBe(true);
    expect(isLandingHost(WWW)).toBe(false);
    expect(isLandingHost(PREVIEW)).toBe(false);
    expect(isLandingHost(null)).toBe(false);
  });

  it("builds the exact portal signup URL for landing CTAs", () => {
    expect(portalSignupUrl("en")).toBe("https://www.liveassist.tech/signup?lang=en");
    expect(portalSignupUrl("ru")).toBe("https://www.liveassist.tech/signup?lang=ru");
    expect(portalSignupUrl()).toBe("https://www.liveassist.tech/signup");
  });

  it("keeps the landing origin on the apex", () => {
    expect(landingOrigin()).toBe("https://liveassist.tech");
  });
});
