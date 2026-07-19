import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig, isSupabaseConfigured } from "./config";

export async function updateSession(request: NextRequest) {
  const { response } = await updateSessionWithUser(request);
  return response;
}

/**
 * Same session-refresh pass, but also reports who (if anyone) is signed in,
 * so the middleware can resolve `/` server-side without a second Supabase
 * round trip. Callers that answer with a redirect MUST copy this response's
 * cookies onto it — getUser() may have rotated the session cookies, and
 * dropping those Set-Cookie headers would sign the user out.
 */
export async function updateSessionWithUser(
  request: NextRequest
): Promise<{ response: NextResponse; user: User | null }> {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return { response, user: null };

  const { url, anonKey } = getSupabasePublicConfig();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  return { response, user: data.user ?? null };
}
