import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // /account and the amoCRM callback both read the Supabase session from
  // cookies, so they need the same refresh pass /signup already gets. Without
  // this, a returning customer with a stale access-token cookie would be
  // bounced to /signup from their own account page.
  matcher: ["/signup/:path*", "/auth/:path*", "/account/:path*", "/api/crm/:path*"],
};
