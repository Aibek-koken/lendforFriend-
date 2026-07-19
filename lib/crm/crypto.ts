import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Application-level encryption for CRM secrets (client_secret, access_token,
// refresh_token). SERVER ONLY.
//
// Supabase RLS already makes public.crm_connection_secrets unreadable to every
// browser client (RLS on, no policy, grants revoked). This module is the second
// layer: a leaked database dump, a mis-scoped backup, or a future accidental
// policy still yields only ciphertext, because the key lives in the deployment
// environment and never in Postgres.
//
// Format: "v1.<iv>.<tag>.<ciphertext>", each part base64url. The version prefix
// exists so a key rotation or algorithm change can be rolled out by teaching
// `decryptSecret` a second prefix while `encryptSecret` only ever writes the
// newest one.

const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12; // 96-bit nonce, the GCM standard.
const TAG_BYTES = 16;

export class CrmSecretsConfigError extends Error {}

function assertServerOnly() {
  if (typeof window !== "undefined") {
    throw new Error("CRM secrets must never be encrypted or decrypted in the browser");
  }
}

/**
 * The 32-byte key, from CRM_SECRETS_ENCRYPTION_KEY (base64 or base64url).
 *
 * Generate one with:  openssl rand -base64 32
 *
 * Deliberately no default and no fallback: a silently-empty key would encrypt
 * every customer's amoCRM secret under a value an attacker could guess. Missing
 * config must be a loud failure at the call site, not a weak cipher.
 */
function encryptionKey(): Buffer {
  const raw = process.env.CRM_SECRETS_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new CrmSecretsConfigError("CRM_SECRETS_ENCRYPTION_KEY is not set");
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_BYTES) {
    throw new CrmSecretsConfigError(
      `CRM_SECRETS_ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes (got ${key.length}). Generate one with: openssl rand -base64 32`
    );
  }

  return key;
}

/** Whether secret storage can work at all. Checked before a setup form is shown. */
export function isCrmSecretsConfigured(): boolean {
  try {
    encryptionKey();
    return true;
  } catch {
    return false;
  }
}

export function encryptSecret(plaintext: string): string {
  assertServerOnly();
  if (!plaintext) throw new Error("Refusing to encrypt an empty secret");

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

/**
 * Reverses `encryptSecret`. Throws on a malformed payload, an unknown version,
 * or a failed authentication tag — GCM makes tampering a decrypt failure rather
 * than a silently wrong plaintext, so a modified ciphertext can never be used.
 */
export function decryptSecret(payload: string): string {
  assertServerOnly();

  const parts = payload.split(".");
  if (parts.length !== 4) {
    throw new Error("Malformed encrypted secret");
  }

  const [version, ivPart, tagPart, ciphertextPart] = parts;
  if (version !== VERSION) {
    throw new Error(`Unsupported encrypted secret version: ${version}`);
  }

  const iv = Buffer.from(ivPart, "base64url");
  const tag = Buffer.from(tagPart, "base64url");
  const ciphertext = Buffer.from(ciphertextPart, "base64url");

  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
    throw new Error("Malformed encrypted secret");
  }

  const decipher = createDecipheriv(ALGORITHM, encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/**
 * A secret's last 4 characters, for "the secret ending in …abcd" UI. Everything
 * else about the secret stays server-side; this is the ONLY derived form that
 * may be rendered, and it is computed at write time, never by decrypting for
 * display.
 */
export function secretHint(plaintext: string): string {
  const tail = plaintext.trim().slice(-4);
  return tail.length === 4 ? tail : "";
}
