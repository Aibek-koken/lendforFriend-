import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sanitizeAnalyticsUrl } from "@/lib/webAnalytics";

/**
 * Source-level guards for the domain split. The routing matrix itself is
 * covered by pure-function tests in domain-routing.test.ts; these pin the
 * places where a stray `href="/"` or a raw analytics URL would quietly
 * reintroduce the retired landing page or leak an OAuth parameter.
 */
function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("middleware wiring", () => {
  const middleware = source("middleware.ts");

  it("matches / so the portal root is resolved server-side", () => {
    expect(middleware).toContain('"/"');
    expect(middleware).toContain("decideRoute");
    expect(middleware).toContain("portalRootTarget");
  });

  it("is not a blanket catch-all: only the named route groups are matched", () => {
    expect(middleware).not.toContain("/((?!");
    expect(middleware).not.toContain('"/:path*"');
    expect(middleware).toContain('"/api/crm/:path*"');
    // The desktop auth exchange and desktop CRM API must stay unmatched.
    expect(middleware).not.toContain('"/api/:path*"');
    expect(middleware).not.toContain('"/api/desktop');
  });

  it("copies refreshed session cookies onto the root redirect", () => {
    expect(middleware).toContain("session.cookies.getAll()");
  });
});

describe("portal navigation never points at the retired landing route", () => {
  it("signup flow: logo reloads the signup flow, download goes to the landing origin", () => {
    const signupFlow = source("app/signup/SignupFlow.tsx");
    expect(signupFlow).not.toContain('href="/"');
    expect(signupFlow).not.toContain('href="/#download"');
    expect(signupFlow).toContain("landingOrigin()");
    expect(signupFlow).toContain("/signup?lang=${lang}");
  });

  it("account view: logo stays on /account, download goes to the landing origin", () => {
    const accountView = source("app/account/AccountView.tsx");
    expect(accountView).not.toContain('href="/"');
    expect(accountView).not.toContain('href="/#download"');
    expect(accountView).toContain("landingOrigin()");
    expect(accountView).toContain("/account?lang=${lang}");
  });

  it("sign-out lands on /signup, not the landing page", () => {
    const accountView = source("app/account/AccountView.tsx");
    expect(accountView).toContain('router.replace("/signup")');
  });
});

describe("landing CTAs use the absolute portal signup URL", () => {
  it.each(["app/page.tsx", "app/components/HeroOrbit.tsx"])(
    "%s builds CTAs via portalSignupUrl",
    (file) => {
      const contents = source(file);
      expect(contents).toContain("portalSignupUrl(");
      expect(contents).not.toContain("href={`/signup");
      expect(contents).not.toContain('href="/signup"');
    }
  );
});

describe("OAuth callback stays on the host it arrived on", () => {
  it("builds its redirects from url.origin (same www host, no cross-host hop)", () => {
    const callback = source("app/auth/callback/route.ts");
    expect(callback).toContain("url.origin");
    expect(callback).not.toContain("landingOrigin");
  });
});

describe("indexing and analytics hygiene", () => {
  it.each(["app/signup/page.tsx", "app/account/page.tsx", "app/account/integrations/page.tsx"])(
    "%s carries noindex metadata",
    (file) => {
      expect(source(file)).toContain("index: false");
    }
  );

  it("robots.txt answers per host", () => {
    const robots = source("app/robots.txt/route.ts");
    expect(robots).toContain("isLandingHost");
    expect(robots).toContain("Disallow: /");
  });

  it("the layout ships the query-stripping analytics wrapper", () => {
    expect(source("app/layout.tsx")).toContain("SiteAnalytics");
  });

  it("sanitizeAnalyticsUrl removes query strings and fragments", () => {
    expect(
      sanitizeAnalyticsUrl("https://www.liveassist.tech/signup?desktop_state=abc&lang=ru")
    ).toBe("https://www.liveassist.tech/signup");
    expect(
      sanitizeAnalyticsUrl("https://www.liveassist.tech/auth/callback?code=secret&state=xyz#frag")
    ).toBe("https://www.liveassist.tech/auth/callback");
    expect(sanitizeAnalyticsUrl("/account/integrations?connected=1")).toBe(
      "/account/integrations"
    );
  });
});
