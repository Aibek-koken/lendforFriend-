import { describe, expect, it, beforeAll } from "vitest";
import {
  amoCrmAuthorizeUrl,
  amoCrmRedirectUri,
  normalizeSubdomain,
  validateAmoCrmCredentials,
} from "@/lib/crm/amocrm";
import {
  allowsAmoCrmSetup,
  crmAccountLabel,
  isLiveCrmAccountState,
  resolveCrmAccountState,
  toCrmErrorCode,
  type CrmConnectionMetadata,
} from "@/lib/crm/state";
import { classifyTokenStatus, isAccessTokenFresh } from "@/lib/crm/amocrmTokens";
import { integrationStrings } from "@/lib/crm/strings";

const VALID_SECRET = "s".repeat(40);
const VALID_CLIENT_ID = "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0";

function metadata(overrides: Partial<CrmConnectionMetadata> = {}): CrmConnectionMetadata {
  return {
    mode: "real",
    provider: "amocrm",
    status: "pending",
    subdomain: null,
    domainZone: null,
    clientId: null,
    accountId: null,
    connectedAt: null,
    lastErrorCode: null,
    lastErrorAt: null,
    ...overrides,
  };
}

describe("resolveCrmAccountState", () => {
  it("routes a demo workspace to the demo state, whatever its CRM columns say", () => {
    // The demo card must never trigger a credential lookup, so mode wins over
    // every other column — including a stray provider/status left behind.
    expect(resolveCrmAccountState(metadata({ mode: "demo", provider: "none", status: "demo" }))).toBe("demo");
    expect(resolveCrmAccountState(metadata({ mode: "demo", provider: "amocrm", status: "connected" }))).toBe("demo");
  });

  it("reports no_workspace when signup never created one", () => {
    expect(resolveCrmAccountState(metadata({ mode: null }))).toBe("no_workspace");
  });

  it("reports unsupported for a real workspace on another CRM", () => {
    for (const provider of ["bitrix24", "hubspot", "other", "none", null]) {
      expect(resolveCrmAccountState(metadata({ provider }))).toBe("unsupported");
    }
  });

  it("separates 'no credentials yet' from 'credentials saved, consent pending'", () => {
    expect(resolveCrmAccountState(metadata({ status: "pending", clientId: null }))).toBe("setup_required");
    expect(resolveCrmAccountState(metadata({ status: "pending", clientId: VALID_CLIENT_ID }))).toBe(
      "authorization_required"
    );
  });

  it("reports connected and failed straight from the row", () => {
    expect(resolveCrmAccountState(metadata({ status: "connected" }))).toBe("connected");
    expect(resolveCrmAccountState(metadata({ status: "failed" }))).toBe("failed");
  });

  it("only lets the connected state perform live CRM work", () => {
    expect(isLiveCrmAccountState("connected")).toBe(true);
    for (const state of ["demo", "setup_required", "authorization_required", "failed", "unsupported", "no_workspace"] as const) {
      expect(isLiveCrmAccountState(state)).toBe(false);
    }
  });

  it("never offers the amoCRM setup form to a demo or unsupported workspace", () => {
    expect(allowsAmoCrmSetup("demo")).toBe(false);
    expect(allowsAmoCrmSetup("unsupported")).toBe(false);
    expect(allowsAmoCrmSetup("no_workspace")).toBe(false);
    expect(allowsAmoCrmSetup("setup_required")).toBe(true);
    expect(allowsAmoCrmSetup("authorization_required")).toBe(true);
    expect(allowsAmoCrmSetup("failed")).toBe(true);
    expect(allowsAmoCrmSetup("connected")).toBe(true);
  });

  it("builds an account label only when both halves are known", () => {
    expect(crmAccountLabel(metadata({ subdomain: "acme", domainZone: "amocrm.ru" }))).toBe("acme.amocrm.ru");
    expect(crmAccountLabel(metadata({ subdomain: "acme", domainZone: null }))).toBeNull();
    expect(crmAccountLabel(metadata())).toBeNull();
  });
});

describe("amoCRM credential validation", () => {
  it("accepts a well-formed set", () => {
    const result = validateAmoCrmCredentials({
      subdomain: "acme",
      domainZone: "amocrm.ru",
      clientId: VALID_CLIENT_ID,
      clientSecret: VALID_SECRET,
    });
    expect(result.ok).toBe(true);
  });

  it("rescues a pasted URL instead of failing the customer for being helpful", () => {
    expect(normalizeSubdomain("https://acme.amocrm.ru/leads")).toBe("acme");
    expect(normalizeSubdomain("  ACME  ")).toBe("acme");
  });

  it("rejects each field independently", () => {
    const result = validateAmoCrmCredentials({
      subdomain: "",
      domainZone: "example.com",
      clientId: "x",
      clientSecret: "short",
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected failure");
    expect(result.errors.subdomain).toBe("subdomain_required");
    expect(result.errors.domainZone).toBe("domain_zone_invalid");
    expect(result.errors.clientId).toBe("client_id_invalid");
    expect(result.errors.clientSecret).toBe("client_secret_invalid");
  });
});

describe("amoCRM setup copy", () => {
  it("points users to amoMarket and separates authorization code from client id", () => {
    for (const lang of ["en", "ru"] as const) {
      const copy = integrationStrings[lang];
      const joined = Object.values(copy).filter((value) => typeof value === "string").join("\n");

      expect(joined).toContain("amoMarket");
      expect(joined).toContain("Redirect URI");
      expect(joined).toContain("Client ID");
      expect(joined).not.toContain("Settings → Integrations");
      expect(joined).not.toContain("Настройки → Интеграции");
      expect(copy.authorizationCodeWarning).toMatch(/20/);
    }
  });
});

describe("amoCRM authorize URL", () => {
  it("carries the client id and state, and NEVER the client secret or redirect uri", () => {
    const url = amoCrmAuthorizeUrl({
      domainZone: "amocrm.ru",
      clientId: VALID_CLIENT_ID,
      state: "nonce-value",
    });

    expect(url.startsWith("https://www.amocrm.ru/oauth?")).toBe(true);

    const params = new URL(url).searchParams;
    expect(params.get("client_id")).toBe(VALID_CLIENT_ID);
    expect(params.get("state")).toBe("nonce-value");
    expect(params.get("mode")).toBe("popup");
    // The secret belongs in the backend-to-backend token POST, nowhere else.
    expect(url).not.toContain("client_secret");
    expect(params.get("redirect_uri")).toBeNull();
  });

  it("points the redirect uri at this web app, not the desktop or the proxy", () => {
    const uri = amoCrmRedirectUri("https://www.liveassist.tech");
    expect(uri).toBe("https://www.liveassist.tech/api/crm/amocrm/callback");
    expect(uri.startsWith("liveassist://")).toBe(false);
  });
});

describe("token failure classification", () => {
  it("treats only a real auth rejection as a credential problem", () => {
    // The distinction that matters: a 429 or a 500 must NOT wipe a working
    // connection. Only 400/401 from the token endpoint means the credentials
    // are genuinely bad.
    expect(classifyTokenStatus(400)).toBe("invalid_credentials");
    expect(classifyTokenStatus(401)).toBe("invalid_credentials");
    expect(classifyTokenStatus(429)).toBe("rate_limited");
    expect(classifyTokenStatus(500)).toBe("provider_unavailable");
    expect(classifyTokenStatus(503)).toBe("provider_unavailable");
    expect(classifyTokenStatus(418)).toBe("unknown");
  });

  it("collapses an unrecognized error code rather than echoing it back", () => {
    expect(toCrmErrorCode("rate_limited")).toBe("rate_limited");
    expect(toCrmErrorCode("<script>alert(1)</script>")).toBe("unknown");
    expect(toCrmErrorCode(null)).toBe("unknown");
  });

  it("knows when a stored access token is still usable", () => {
    const now = new Date("2026-07-13T12:00:00Z");
    expect(isAccessTokenFresh(new Date("2026-07-13T12:30:00Z"), now)).toBe(true);
    expect(isAccessTokenFresh(new Date("2026-07-13T11:30:00Z"), now)).toBe(false);
    expect(isAccessTokenFresh(null, now)).toBe(false);
  });
});

describe("CRM secret encryption", () => {
  // A 32-byte key, base64. Test-only.
  const KEY = Buffer.alloc(32, 7).toString("base64");

  beforeAll(() => {
    process.env.CRM_SECRETS_ENCRYPTION_KEY = KEY;
  });

  it("round-trips a secret", async () => {
    const { encryptSecret, decryptSecret } = await import("@/lib/crm/crypto");
    const secret = "amocrm-client-secret-value";
    const encrypted = encryptSecret(secret);

    expect(encrypted).not.toContain(secret);
    expect(encrypted.startsWith("v1.")).toBe(true);
    expect(decryptSecret(encrypted)).toBe(secret);
  });

  it("produces a different ciphertext every time (fresh IV)", async () => {
    const { encryptSecret } = await import("@/lib/crm/crypto");
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("refuses a tampered ciphertext rather than returning wrong plaintext", async () => {
    const { encryptSecret, decryptSecret } = await import("@/lib/crm/crypto");
    const encrypted = encryptSecret("amocrm-client-secret-value");
    const [version, iv, tag, ciphertext] = encrypted.split(".");

    // Flip a byte of the ciphertext. GCM's auth tag must catch it.
    const bytes = Buffer.from(ciphertext, "base64url");
    bytes[0] ^= 0xff;
    const tampered = [version, iv, tag, bytes.toString("base64url")].join(".");

    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("rejects a malformed payload", async () => {
    const { decryptSecret } = await import("@/lib/crm/crypto");
    expect(() => decryptSecret("not-encrypted")).toThrow(/Malformed/);
    expect(() => decryptSecret("v2.a.b.c")).toThrow(/Unsupported/);
  });

  it("fails loudly on a missing or wrong-length key instead of encrypting weakly", async () => {
    const { encryptSecret, isCrmSecretsConfigured } = await import("@/lib/crm/crypto");

    process.env.CRM_SECRETS_ENCRYPTION_KEY = "";
    expect(isCrmSecretsConfigured()).toBe(false);
    expect(() => encryptSecret("x")).toThrow(/not set/);

    process.env.CRM_SECRETS_ENCRYPTION_KEY = Buffer.alloc(16, 1).toString("base64");
    expect(isCrmSecretsConfigured()).toBe(false);
    expect(() => encryptSecret("x")).toThrow(/32 bytes/);

    process.env.CRM_SECRETS_ENCRYPTION_KEY = KEY;
    expect(isCrmSecretsConfigured()).toBe(true);
  });
});
