import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildDesktopRefreshDeepLink,
  resolveDesktopOpenAction,
  shouldOfferDesktopOpen,
} from "@/lib/desktop-auth/refresh";
import { buildDesktopDeepLink } from "@/lib/desktop-auth/handoff";
import { integrationStrings } from "@/lib/crm/strings";
import type { CrmAccountState } from "@/lib/crm/state";

const SETUP_TSX = resolve(__dirname, "../app/account/integrations/AmoCrmSetup.tsx");
const setupSource = readFileSync(SETUP_TSX, "utf8");

const VALID_DESKTOP_STATE = "550e8400-e29b-41d4-a716-446655440000";

describe("the account refresh deep link", () => {
  it("is exactly liveassist://account/refresh", () => {
    expect(buildDesktopRefreshDeepLink()).toBe("liveassist://account/refresh");
  });

  it("carries no secret and no identifier — there is nowhere to put one", () => {
    const link = buildDesktopRefreshDeepLink();

    // No query string at all is the whole guarantee: a link with no parameters
    // cannot leak a token, a code, or a company id, whatever a caller does.
    expect(link).not.toContain("?");
    expect(link).not.toContain("=");
    for (const forbidden of [
      "code",
      "state",
      "token",
      "access_token",
      "refresh_token",
      "client_secret",
      "clientSecret",
      "user_id",
      "company_id",
    ]) {
      expect(link).not.toContain(forbidden);
    }
  });

  it("is not the sign-in handoff link", () => {
    // The desktop routes the two to different handlers and parses each strictly.
    // If they ever collided, a routine CRM refresh would enter the sign-in path.
    expect(buildDesktopRefreshDeepLink()).not.toContain("auth/callback");
    expect(buildDesktopDeepLink("code-value", VALID_DESKTOP_STATE)).toContain("auth/callback");
  });
});

describe("resolveDesktopOpenAction", () => {
  it("keeps the existing single-use auth handoff when a desktop sign-in is in flight", () => {
    expect(resolveDesktopOpenAction(VALID_DESKTOP_STATE)).toEqual({
      kind: "auth_handoff",
      desktopState: VALID_DESKTOP_STATE,
    });
  });

  it("uses the refresh link for a signed-in user managing CRM in the browser", () => {
    // No desktop_state => no nonce the desktop minted => nothing to bind a
    // single-use code to. Minting one anyway would be a credential on the wire
    // for an operation that needs none.
    expect(resolveDesktopOpenAction(null)).toEqual({
      kind: "account_refresh",
      deepLink: "liveassist://account/refresh",
    });
    expect(resolveDesktopOpenAction(undefined).kind).toBe("account_refresh");
    expect(resolveDesktopOpenAction("").kind).toBe("account_refresh");
  });

  it("treats a malformed desktop_state as absent rather than passing it on", () => {
    // A value this shape cannot be a nonce we minted, so it must never reach
    // issueDesktopHandoff — which would just fail with invalid_state anyway.
    expect(resolveDesktopOpenAction("short").kind).toBe("account_refresh");
    expect(resolveDesktopOpenAction("has spaces and is long enough to pass").kind).toBe(
      "account_refresh"
    );
  });
});

describe("shouldOfferDesktopOpen", () => {
  it("offers the button on the connected screen with no desktop_state", () => {
    // The bug this fixes: the CTA used to be gated on desktopState, so it only
    // existed during a first-time desktop signup — never after a connect from
    // demo, a credential replacement, a reconnect, or a disconnect.
    expect(shouldOfferDesktopOpen("connected")).toBe(true);
  });

  it("offers the button after a disconnect", () => {
    // A disconnect the desktop never hears about is exactly as stale as a
    // connect it never hears about.
    expect(shouldOfferDesktopOpen("setup_required", { justDisconnected: true })).toBe(true);
    expect(shouldOfferDesktopOpen("authorization_required", { justDisconnected: true })).toBe(true);
  });

  it("does not offer it where there is nothing for the desktop to pick up", () => {
    const quiet: CrmAccountState[] = [
      "no_workspace",
      "demo",
      "unsupported",
      "setup_required",
      "authorization_required",
      "failed",
    ];

    for (const state of quiet) {
      expect(shouldOfferDesktopOpen(state)).toBe(false);
    }
  });
});

describe("AmoCrmSetup wiring", () => {
  // Source-level assertions: there is no DOM renderer in this test setup, and
  // the thing worth protecting is structural — which flow each branch takes.

  it("no longer gates the Open LiveAssist button on desktopState", () => {
    expect(setupSource).not.toContain("if (!desktopState) return;");
    expect(setupSource).toContain("shouldOfferDesktopOpen(state, { justDisconnected })");
  });

  it("mints an auth code only on the auth_handoff branch", () => {
    // issueDesktopHandoff burns a one-time desktop auth code. It must never run
    // for a routine CRM update — that is the "do not reuse the login handoff"
    // rule, enforced here rather than left to a comment.
    const handoffCall = setupSource.indexOf("issueDesktopHandoff(");
    const refreshBranch = setupSource.indexOf('desktopAction.kind === "account_refresh"');

    expect(refreshBranch).toBeGreaterThan(-1);
    expect(handoffCall).toBeGreaterThan(refreshBranch);
    expect(setupSource).toContain("issueDesktopHandoff(desktopAction.desktopState)");
  });
});

describe("copy", () => {
  it("tells the user in both languages that the app updates itself", () => {
    expect(integrationStrings.ru.desktopRefreshBody).toBe(
      "amoCRM успешно подключена. Откройте LiveAssist — приложение автоматически обновит подключение."
    );
    expect(integrationStrings.en.desktopRefreshBody).toBe(
      "amoCRM is connected. Open LiveAssist and the app will update the connection automatically."
    );

    expect(integrationStrings.ru.openDesktop).toBe("Открыть LiveAssist");
    expect(integrationStrings.en.openDesktop).toBe("Open LiveAssist");
    expect(integrationStrings.ru.openingDesktop).toBe("Открываем LiveAssist…");
    expect(integrationStrings.en.openingDesktop).toBe("Opening LiveAssist…");

    expect(integrationStrings.ru.desktopRefreshOpenedHint).toBe(
      "LiveAssist открыт. Статус CRM обновляется автоматически."
    );
    expect(integrationStrings.en.desktopRefreshOpenedHint).toBe(
      "LiveAssist is open. The CRM status updates automatically."
    );
  });

  it("never claims the desktop app already updated — the browser cannot know that", () => {
    for (const lang of ["ru", "en"] as const) {
      const copy = integrationStrings[lang];
      for (const line of [copy.desktopRefreshBody, copy.desktopRefreshOpenedHint, copy.disconnectedBody]) {
        expect(line).not.toMatch(/updated|обновил|обновлено|синхронизировано/i);
      }
    }
  });

  it("has a disconnect result in both languages", () => {
    expect(integrationStrings.ru.disconnectedTitle).toBe("amoCRM отключена");
    expect(integrationStrings.en.disconnectedTitle).toBe("amoCRM disconnected");
    expect(integrationStrings.ru.disconnectedBody).toContain("Откройте LiveAssist");
    expect(integrationStrings.en.disconnectedBody).toContain("Open LiveAssist");
  });
});
