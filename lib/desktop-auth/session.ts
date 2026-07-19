import { isHandoffSecret } from "./handoff";

export type DesktopSessionRecord = {
  userId: string;
  companyId: string | null;
  expiresAt: string;
  revokedAt: string | null;
};

export type DesktopSessionValidation =
  | {
      ok: true;
      session: DesktopSessionRecord & { companyId: string };
    }
  | {
      ok: false;
      code: "missing" | "invalid" | "expired" | "revoked" | "no_company";
    };

export function readBearerToken(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1]?.trim() ?? "";
  return isHandoffSecret(token) ? token : null;
}

export function validateDesktopSession(
  session: DesktopSessionRecord | null,
  now: Date
): DesktopSessionValidation {
  if (!session) return { ok: false, code: "missing" };
  if (!session.companyId) return { ok: false, code: "no_company" };

  const expiresAt = new Date(session.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) {
    return { ok: false, code: "invalid" };
  }
  if (session.revokedAt) return { ok: false, code: "revoked" };
  if (expiresAt.getTime() <= now.getTime()) {
    return { ok: false, code: "expired" };
  }

  return { ok: true, session: { ...session, companyId: session.companyId } };
}
