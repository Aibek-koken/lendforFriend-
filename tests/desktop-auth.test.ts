import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  AUTH_CODE_TTL_SECONDS,
  DESKTOP_STATE_COOKIE,
  DESKTOP_STATE_COOKIE_MAX_AGE_SECONDS,
  DESKTOP_SESSION_TTL_SECONDS,
  DESKTOP_STATE_PARAM,
  buildDesktopDeepLink,
  isHandoffHash,
  isHandoffSecret,
  readDesktopStateParam,
} from "@/lib/desktop-auth/handoff";
import {
  evaluateAuthCode,
  generateHandoffSecret,
  hashHandoffSecret,
  hashesMatch,
  type AuthCodeRecord,
} from "@/lib/desktop-auth/secrets";
import { signupStrings } from "@/lib/signup/strings";

const NOW = new Date("2026-07-12T12:00:00.000Z");

function recordAt(overrides: Partial<AuthCodeRecord> = {}): AuthCodeRecord {
  return {
    codeHash: hashHandoffSecret("code-fixture"),
    stateHash: hashHandoffSecret("state-fixture"),
    expiresAt: new Date(NOW.getTime() + AUTH_CODE_TTL_SECONDS * 1000),
    consumedAt: null,
    ...overrides,
  };
}

const validStateHash = hashHandoffSecret("state-fixture");

describe("handoff secrets", () => {
  it("generates URL-safe, high-entropy, non-repeating secrets", () => {
    const first = generateHandoffSecret();
    const second = generateHandoffSecret();

    expect(first).not.toBe(second);
    expect(isHandoffSecret(first)).toBe(true);
    expect(first).toBe(encodeURIComponent(first));
  });

  it("stores only a sha256 digest, never the secret itself", () => {
    const secret = generateHandoffSecret();
    const digest = hashHandoffSecret(secret);

    expect(isHandoffHash(digest)).toBe(true);
    expect(digest).not.toContain(secret);
    expect(hashHandoffSecret(secret)).toBe(digest);
  });

  it("rejects malformed secrets instead of hashing garbage", () => {
    expect(isHandoffSecret("")).toBe(false);
    expect(isHandoffSecret("short")).toBe(false);
    expect(isHandoffSecret("has spaces and+slashes/")).toBe(false);
    expect(isHandoffSecret(null)).toBe(false);
    expect(isHandoffSecret(123)).toBe(false);
  });

  it("compares digests without leaking a mismatch position", () => {
    const digest = hashHandoffSecret("a");
    expect(hashesMatch(digest, digest)).toBe(true);
    expect(hashesMatch(digest, hashHandoffSecret("b"))).toBe(false);
    expect(hashesMatch(digest, "not-a-hash")).toBe(false);
  });
});

describe("deep link", () => {
  it("carries exactly the one-time code and the state nonce", () => {
    const link = buildDesktopDeepLink("code-value", "state-value");
    const url = new URL(link);

    expect(url.protocol).toBe("liveassist:");
    expect(`${url.host}${url.pathname}`).toBe("auth/callback");
    expect([...url.searchParams.keys()].sort()).toEqual(["code", "state"]);
    expect(url.searchParams.get("code")).toBe("code-value");
    expect(url.searchParams.get("state")).toBe("state-value");
  });

  it("carries opaque one-time secrets, never token parameters or JWTs", () => {
    const url = new URL(buildDesktopDeepLink(generateHandoffSecret(), generateHandoffSecret()));

    expect([...url.searchParams.keys()].sort()).toEqual(["code", "state"]);
    expect(url.searchParams.has("access_token")).toBe(false);
    expect(url.searchParams.has("refresh_token")).toBe(false);
    for (const value of [url.searchParams.get("code"), url.searchParams.get("state")]) {
      expect(value).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(value).not.toContain(".");
    }
  });

  it("percent-encodes secrets so a stray character cannot forge a second param", () => {
    const link = buildDesktopDeepLink("a&state=evil", "nonce");

    expect(new URL(link).searchParams.get("state")).toBe("nonce");
    expect(new URL(link).searchParams.get("code")).toBe("a&state=evil");
  });
});

describe("desktop state param", () => {
  it("uses a name that cannot collide with Supabase's own OAuth state", () => {
    expect(DESKTOP_STATE_PARAM).toBe("desktop_state");
  });

  it("uses a short-lived desktop state cookie for the external OAuth round trip", () => {
    expect(DESKTOP_STATE_COOKIE).toBe("liveassist_desktop_state");
    expect(DESKTOP_STATE_COOKIE).not.toBe("state");
    expect(DESKTOP_STATE_COOKIE_MAX_AGE_SECONDS).toBeLessThanOrEqual(600);
    expect(DESKTOP_STATE_COOKIE_MAX_AGE_SECONDS).toBeGreaterThanOrEqual(60);
  });

  it("treats an absent or malformed nonce as a plain web signup", () => {
    expect(readDesktopStateParam(undefined)).toBeNull();
    expect(readDesktopStateParam("")).toBeNull();
    expect(readDesktopStateParam("../../etc/passwd")).toBeNull();
  });

  it("passes a well-formed nonce through untouched", () => {
    const nonce = generateHandoffSecret();
    expect(readDesktopStateParam(nonce)).toBe(nonce);
  });
});

describe("one-time code: TTL, single use, replay, state binding", () => {
  it("accepts a fresh, unconsumed code with a matching state", () => {
    expect(evaluateAuthCode(recordAt(), validStateHash, NOW)).toEqual({ ok: true });
  });

  it("rejects a code past its TTL", () => {
    const expired = recordAt({ expiresAt: new Date(NOW.getTime() - 1000) });

    expect(evaluateAuthCode(expired, validStateHash, NOW)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("rejects a code at the exact expiry instant (TTL is exclusive)", () => {
    const boundary = recordAt({ expiresAt: NOW });

    expect(evaluateAuthCode(boundary, validStateHash, NOW)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("accepts a code one second before it expires", () => {
    const almost = recordAt({ expiresAt: new Date(NOW.getTime() + 1000) });

    expect(evaluateAuthCode(almost, validStateHash, NOW)).toEqual({ ok: true });
  });

  it("rejects replay: a code already consumed cannot be used again", () => {
    const consumed = recordAt({ consumedAt: new Date(NOW.getTime() - 5000) });

    expect(evaluateAuthCode(consumed, validStateHash, NOW)).toEqual({
      ok: false,
      reason: "consumed",
    });
  });

  it("prefers 'consumed' over 'expired' so a spent code never looks merely stale", () => {
    const both = recordAt({
      consumedAt: new Date(NOW.getTime() - 5000),
      expiresAt: new Date(NOW.getTime() - 1000),
    });

    expect(evaluateAuthCode(both, validStateHash, NOW)).toEqual({
      ok: false,
      reason: "consumed",
    });
  });

  it("rejects a valid code presented with the wrong state nonce", () => {
    const attackerState = hashHandoffSecret(generateHandoffSecret());

    expect(evaluateAuthCode(recordAt(), attackerState, NOW)).toEqual({
      ok: false,
      reason: "state_mismatch",
    });
  });

  it("rejects a code whose state hash is missing or malformed", () => {
    expect(evaluateAuthCode(recordAt(), "", NOW)).toEqual({
      ok: false,
      reason: "state_mismatch",
    });
  });

  it("keeps the code TTL short and the session TTL long", () => {
    expect(AUTH_CODE_TTL_SECONDS).toBeLessThanOrEqual(600);
    expect(AUTH_CODE_TTL_SECONDS).toBeGreaterThanOrEqual(60);
    expect(DESKTOP_SESSION_TTL_SECONDS).toBeGreaterThan(AUTH_CODE_TTL_SECONDS);
  });
});

describe("client/server boundary", () => {
  it("keeps node:crypto out of the isomorphic module the client component imports", async () => {
    // SignupFlow.tsx is a "use client" file and imports ./handoff. If anything in
    // that module reaches for node:crypto again, the secret-generation code lands
    // in the browser bundle and `next build` fails. Assert the split directly so
    // the failure shows up here, with an explanation, rather than as a webpack
    // UnhandledSchemeError.
    const source = await readFile(
      new URL("../lib/desktop-auth/handoff.ts", import.meta.url),
      "utf8"
    );

    expect(source).not.toMatch(/from "node:crypto"|require\("node:crypto"\)|from "crypto"/);
  });

  it("keeps the Google OAuth callback query-free and restores desktop state from a cookie", async () => {
    const signupSource = await readFile(
      new URL("../app/signup/SignupFlow.tsx", import.meta.url),
      "utf8"
    );
    const callbackSource = await readFile(
      new URL("../app/auth/callback/route.ts", import.meta.url),
      "utf8"
    );

    expect(signupSource).toContain("document.cookie");
    expect(signupSource).toContain("DESKTOP_STATE_COOKIE");
    expect(signupSource).not.toMatch(/callback\.searchParams\.set\(\s*DESKTOP_STATE_PARAM/);
    expect(callbackSource).toContain("DESKTOP_STATE_COOKIE");
    expect(callbackSource).toContain("response.cookies.set");
  });
});

describe("handoff copy", () => {
  it("no longer claims the desktop handoff is unimplemented", () => {
    for (const lang of ["en", "ru"] as const) {
      expect(signupStrings[lang].handoffNote).not.toMatch(/coming next|отдельным этапом/i);
    }
  });

  it("ships every handoff string in both languages", () => {
    const keys = ["open", "opening", "openedHint", "handoffError", "desktopFinishTitle", "desktopFinishBody", "switchAccount", "switchingAccount", "switchAccountError"] as const;

    for (const key of keys) {
      expect(signupStrings.en[key].length).toBeGreaterThan(0);
      expect(signupStrings.ru[key].length).toBeGreaterThan(0);
    }
  });

  it("keeps the brand capitalised in the name-prefixed final heading", () => {
    // The heading used to be built by lowercasing completeTitle so it could sit
    // after the user's name — which also lowercased the brand, rendering
    // "Aibek, you're ready for liveassist".
    expect(signupStrings.en.completeTitleNamed).toContain("LiveAssist");
    expect(signupStrings.en.completeTitleNamed).not.toContain("liveassist");
    expect(signupStrings.en.completeTitleNamed[0]).toBe(signupStrings.en.completeTitleNamed[0].toLowerCase());
  });
});
