import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { isHandoffHash, type AuthCodeRejection } from "./handoff";

// Stage 2 handoff — the SERVER-ONLY half.
//
// This module imports node:crypto. Importing it from a "use client" component
// fails the build, which is the point: secret generation and hashing must never
// be reachable from the browser bundle. Client components import ./handoff.ts.

/** 32 bytes = 256 bits of entropy; brute-forcing the code space is not a threat. */
const SECRET_BYTES = 32;

/** A fresh code, state nonce, or session token. Base64url so it survives a URL
 *  query string untouched (no padding, no percent-encoding). */
export function generateHandoffSecret(): string {
  return randomBytes(SECRET_BYTES).toString("base64url");
}

/** Only the digest is ever persisted. A database leak yields no usable code. */
export function hashHandoffSecret(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/** Constant-time compare of two hex digests, so a mismatch cannot be located
 *  byte-by-byte through timing. */
export function hashesMatch(left: string, right: string): boolean {
  if (!isHandoffHash(left) || !isHandoffHash(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

export type AuthCodeRecord = {
  codeHash: string;
  stateHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
};

export type AuthCodeDecision =
  | { ok: true }
  | { ok: false; reason: AuthCodeRejection };

/**
 * The TTL / single-use / state-binding rules, as a pure function.
 *
 * The authoritative check is the atomic UPDATE in `consume_desktop_auth_code`
 * (supabase/desktop-auth.sql) — only the database can make "claim it if nobody
 * else has" race-free. This mirror exists so the rules are unit-testable and
 * reviewable in one place. Keep the two in sync: the predicate order here
 * matches the SQL WHERE clause.
 */
export function evaluateAuthCode(
  record: AuthCodeRecord,
  providedStateHash: string,
  now: Date
): AuthCodeDecision {
  if (record.consumedAt !== null) return { ok: false, reason: "consumed" };
  if (record.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: "expired" };
  if (!hashesMatch(record.stateHash, providedStateHash)) {
    return { ok: false, reason: "state_mismatch" };
  }
  return { ok: true };
}
