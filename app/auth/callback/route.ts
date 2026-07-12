import { NextResponse } from "next/server";
import { identifyAnalyticsUser } from "@/lib/analytics";
import { DESKTOP_STATE_PARAM, readDesktopStateParam } from "@/lib/desktop-auth/handoff";
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  const desktopState = readDesktopStateParam(url.searchParams.get(DESKTOP_STATE_PARAM));

  if (!isSupabaseConfigured() || oauthError || !code) {
    return NextResponse.redirect(signupUrl(url.origin, desktopState, true));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(signupUrl(url.origin, desktopState, true));
  }

  const { data } = await supabase.auth.getUser();
  if (data.user) await identifyAnalyticsUser(data.user.id);

  return NextResponse.redirect(signupUrl(url.origin, desktopState, false));
}
