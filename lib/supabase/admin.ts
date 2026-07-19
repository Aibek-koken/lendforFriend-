import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client. SERVER ONLY.
//
// This client bypasses RLS, so it is used for exactly one thing: calling the
// `consume_desktop_auth_code` RPC, which is granted to service_role only.
// Never import this module from a "use client" file, and never read
// SUPABASE_SERVICE_ROLE_KEY anywhere else.
//
// The bundle guard below throws if this module is ever evaluated in a browser.
// It is a backstop, not the primary defence: the key has no NEXT_PUBLIC_ prefix,
// so Next.js does not inline it into client bundles in the first place.
function assertServerOnly() {
  if (typeof window !== "undefined") {
    throw new Error("The Supabase service-role client must never run in the browser");
  }
}

function normalizeSupabaseUrl(rawUrl?: string) {
  return rawUrl?.trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

/** `https://<ref>.supabase.co` -> `<ref>`. Used only to compare projects. */
export function projectRef(rawUrl?: string): string | null {
  const normalized = normalizeSupabaseUrl(rawUrl);
  return normalized?.match(/^https?:\/\/([^.]+)\./)?.[1] ?? null;
}

/**
 * The project the desktop exchange must talk to.
 *
 * Deliberately NEXT_PUBLIC_SUPABASE_URL, NOT SUPABASE_URL. The one-time code is
 * written by the user's *authenticated browser session*, whose cookies belong to
 * the NEXT_PUBLIC project — so a service-role client pointed anywhere else can
 * never find that code. Reading SUPABASE_URL first (as this used to) meant that
 * a stale legacy value silently sent every exchange to the wrong project, where
 * it failed as an opaque 500.
 *
 * SUPABASE_URL is left alone for the older waitlist route, which owns it.
 */
function authProjectUrl() {
  return normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function isAdminConfigured() {
  return Boolean(authProjectUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Returns a human-readable reason when the service-role setup cannot possibly
 * work, so the exchange route can log something actionable instead of a bare
 * 500. Never includes key material.
 */
export function adminConfigProblem(): string | null {
  const url = authProjectUrl();
  if (!url) return "NEXT_PUBLIC_SUPABASE_URL is not set";
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return "SUPABASE_SERVICE_ROLE_KEY is not set";

  // The classic failure: the service-role key was copied from a different (often
  // older, now-deleted) Supabase project than the one auth actually runs on.
  // Supabase answers such a key with "Invalid API key", which surfaces as a
  // useless 500 unless we say this out loud.
  const legacyRef = projectRef(process.env.SUPABASE_URL);
  const authRef = projectRef(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (legacyRef && authRef && legacyRef !== authRef) {
    return `SUPABASE_URL points at project "${legacyRef}" but auth runs on "${authRef}". SUPABASE_SERVICE_ROLE_KEY must belong to "${authRef}".`;
  }

  return null;
}

export function createAdminClient() {
  assertServerOnly();

  const url = authProjectUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service-role credentials are not configured");
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
