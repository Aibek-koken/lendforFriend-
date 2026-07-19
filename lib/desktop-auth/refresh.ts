// The ACCOUNT REFRESH deep link — the second, deliberately separate way the web
// hands control back to the desktop app.
//
//   liveassist://account/refresh
//
// That is the whole link. No query string, no code, no state, no token, no
// client secret, no user id, no company id. It authorizes nothing and identifies
// nobody; it only tells an already-signed-in app "your workspace changed on the
// server — go read it again with the session you already hold in the OS
// keychain". The desktop refuses a refresh link that carries any of that
// material (src-tauri/src/desktop_auth::parse_account_refresh).
//
// Why this is NOT `buildDesktopDeepLink` (./handoff):
//
//   * The SIGN-IN handoff exists to create a session on a device that has none.
//     It carries a single-use code bound to a nonce the DESKTOP minted before it
//     opened the browser, and `issueDesktopHandoff` mints that code server-side.
//     It is one-shot, 5-minute-lived, and CSRF-bound for good reason.
//   * A CRM connect / replace / disconnect by an ALREADY signed-in user is not a
//     sign-in. There is no desktop nonce (the browser was not opened by a
//     sign-in flow), so there is nothing to bind a code to — and minting one
//     anyway would put a fresh single-use credential on the wire on every CRM
//     edit, for an operation that needs no credential at all.
//
// Collapsing the two would mean either weakening the login handoff (issuing
// codes with no nonce to bind them to) or making routine CRM management
// impossible outside a fresh sign-in. Hence two links, two meanings.

import { DESKTOP_SCHEME, readDesktopStateParam } from "./handoff";
import type { CrmAccountState } from "@/lib/crm/state";

export const DESKTOP_ACCOUNT_REFRESH_PATH = "account/refresh";

/** Takes no arguments, and that is the security property: there is no parameter
 *  through which a secret or an identifier could be added to this link. */
export function buildDesktopRefreshDeepLink(): string {
  return `${DESKTOP_SCHEME}://${DESKTOP_ACCOUNT_REFRESH_PATH}`;
}

export type DesktopOpenAction =
  /** A desktop-initiated sign-in is in flight: finish it the existing, secure
   *  way (single-use code bound to the desktop's own nonce). */
  | { kind: "auth_handoff"; desktopState: string }
  /** No sign-in is in flight: the user is managing CRM from the browser, so all
   *  the app needs is a nudge to re-read the server. */
  | { kind: "account_refresh"; deepLink: string };

export function resolveDesktopOpenAction(
  desktopState: string | null | undefined
): DesktopOpenAction {
  // A malformed value is treated exactly like an absent one — it is not a nonce
  // this desktop can have minted, so it must never reach `issueDesktopHandoff`.
  const state = readDesktopStateParam(desktopState);
  if (state) return { kind: "auth_handoff", desktopState: state };

  return { kind: "account_refresh", deepLink: buildDesktopRefreshDeepLink() };
}

/**
 * Whether this page should offer "Open LiveAssist" at all.
 *
 * The old rule was "only when a desktop_state is present", which meant the
 * button existed for a first-time desktop signup and vanished for every later
 * CRM change — exactly the flows (connect from demo, replace credentials,
 * reconnect, disconnect) where the desktop most needs to hear about it. It is
 * now offered whenever the user has just changed something the desktop caches.
 */
export function shouldOfferDesktopOpen(
  state: CrmAccountState,
  flags: { justDisconnected?: boolean } = {}
): boolean {
  if (flags.justDisconnected) return true;
  return state === "connected";
}
