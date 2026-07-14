import { NextResponse, type NextRequest } from "next/server";
import { updateSession, updateSessionWithUser } from "@/lib/supabase/middleware";
import { decideRoute, portalRootTarget } from "@/lib/hosts";

export async function middleware(request: NextRequest) {
  const decision = decideRoute({
    host: request.headers.get("host"),
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    method: request.method,
  });

  // A portal page (GET) hit on the landing host: send it to the canonical
  // portal origin. decideRoute never returns this for /api/*, /auth/*, or
  // non-GET requests, so callbacks and POST endpoints are never rerouted.
  if (decision.kind === "cross-host-redirect") {
    return NextResponse.redirect(decision.url);
  }

  // `/` on the portal host is not a landing page: resolve it server-side by
  // auth state. 307 so browsers never cache the auth-dependent answer.
  if (decision.kind === "portal-root") {
    const { response: session, user } = await updateSessionWithUser(request);
    const url = request.nextUrl.clone();
    url.pathname = portalRootTarget(Boolean(user));
    const redirect = NextResponse.redirect(url);
    for (const cookie of session.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return updateSession(request);
}

export const config = {
  // /account and the amoCRM callback both read the Supabase session from
  // cookies, so they need the same refresh pass /signup already gets. Without
  // this, a returning customer with a stale access-token cookie would be
  // bounced to /signup from their own account page.
  //
  // "/" is matched for the domain split: the portal host resolves it by auth
  // state, the landing host serves the marketing page. Deliberately NOT a
  // catch-all matcher — unmatched routes (legal pages, downloads, desktop API)
  // must keep working untouched on both hosts.
  matcher: ["/", "/signup/:path*", "/auth/:path*", "/account/:path*", "/api/crm/:path*"],
};
