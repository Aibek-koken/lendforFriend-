import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { identifyAnalyticsUser } from "@/lib/analytics";
import {
  DESKTOP_STATE_COOKIE,
  DESKTOP_STATE_PARAM,
  readDesktopStateParam,
} from "@/lib/desktop-auth/handoff";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Carries the desktop handoff nonce across the Google round trip, so a
// desktop-initiated signup still lands on a final screen that can mint a bound
// one-time code. Note this is OUR param (`desktop_state`), never OAuth's own
// `state` — see DESKTOP_STATE_PARAM.
function signupUrl(origin: string, desktopState: string | null, authError: boolean) {
  const url = new URL("/signup", origin);
  if (authError) url.searchParams.set("auth_error", "1");
  if (desktopState) url.searchParams.set(DESKTOP_STATE_PARAM, desktopState);
  return url.toString();
}

function redirectToSignup(origin: string, desktopState: string | null, authError: boolean) {
  const response = NextResponse.redirect(signupUrl(origin, desktopState, authError));
  response.cookies.set(DESKTOP_STATE_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  const cookieStore = await cookies();
  const desktopState =
    readDesktopStateParam(url.searchParams.get(DESKTOP_STATE_PARAM)) ??
    readDesktopStateParam(cookieStore.get(DESKTOP_STATE_COOKIE)?.value);

  if (!isSupabaseConfigured() || oauthError || !code) {
    return redirectToSignup(url.origin, desktopState, true);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectToSignup(url.origin, desktopState, true);
  }

  const { data } = await supabase.auth.getUser();
  if (data.user) await identifyAnalyticsUser(data.user.id);

  return redirectToSignup(url.origin, desktopState, false);
}
