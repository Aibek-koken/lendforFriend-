"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { isCrmSecretsConfigured } from "@/lib/crm/crypto";
import {
  AMOCRM_STATE_COOKIE,
  AMOCRM_STATE_TTL_SECONDS,
  amoCrmAuthorizeUrl,
  validateAmoCrmCredentials,
  type AmoCrmCredentialErrors,
  type AmoCrmCredentialInput,
} from "@/lib/crm/amocrm";
import { siteOrigin } from "@/lib/crm/origin";
import { allowsAmoCrmSetup, resolveCrmAccountState } from "@/lib/crm/state";
import {
  disconnectCrm,
  loadCrmMetadata,
  loadWorkspaceForUser,
  saveAmoCrmCredentials,
  selectAmoCrmForWorkspace,
} from "@/lib/crm/store";
import {
  DESKTOP_STATE_COOKIE,
  DESKTOP_STATE_COOKIE_MAX_AGE_SECONDS,
  readDesktopStateParam,
} from "@/lib/desktop-auth/handoff";

export type SaveAmoCrmResult =
  | { ok: true; authorizeUrl: string }
  | {
      ok: false;
      code: "unauthorized" | "invalid_input" | "not_allowed" | "not_configured" | "server_error";
      errors?: AmoCrmCredentialErrors;
    };

async function authenticatedUser() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

/**
 * Saves the integration credentials and returns the amoCRM consent URL.
 *
 * The client_secret arrives here in the server action's payload (over HTTPS, in
 * a POST body), is encrypted, and is written straight to the service-role-only
 * secrets table. It is never echoed back, never put in the returned URL, and
 * never reaches the desktop app.
 */
export async function saveAmoCrmSetup(
  input: AmoCrmCredentialInput,
  desktopState?: string | null
): Promise<SaveAmoCrmResult> {
  if (!isCrmSecretsConfigured()) {
    console.error("saveAmoCrmSetup: CRM_SECRETS_ENCRYPTION_KEY is not configured");
    return { ok: false, code: "not_configured" };
  }

  const user = await authenticatedUser();
  if (!user) return { ok: false, code: "unauthorized" };

  const validation = validateAmoCrmCredentials(input);
  if (!validation.ok) return { ok: false, code: "invalid_input", errors: validation.errors };

  const workspace = await loadWorkspaceForUser(user.id);
  if (!workspace) return { ok: false, code: "unauthorized" };

  // A demo workspace, or a real one on another provider, may not store an
  // amoCRM secret at all — checked here against the workspace's OWN row, not
  // against anything the browser sent.
  const metadata = await loadCrmMetadata(workspace);
  if (!allowsAmoCrmSetup(resolveCrmAccountState(metadata))) {
    return { ok: false, code: "not_allowed" };
  }

  const saved = await saveAmoCrmCredentials(workspace, validation.value);
  if (!saved.ok) {
    return { ok: false, code: saved.code === "not_found" ? "not_allowed" : "server_error" };
  }

  const state = randomBytes(32).toString("base64url");
  const cookieStore = cookies();
  cookieStore.set(AMOCRM_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: siteOrigin().startsWith("https://"),
    path: "/",
    maxAge: AMOCRM_STATE_TTL_SECONDS,
  });
  const validDesktopState = readDesktopStateParam(desktopState);
  if (validDesktopState) {
    cookieStore.set(DESKTOP_STATE_COOKIE, validDesktopState, {
      httpOnly: true,
      sameSite: "lax",
      secure: siteOrigin().startsWith("https://"),
      path: "/",
      maxAge: DESKTOP_STATE_COOKIE_MAX_AGE_SECONDS,
    });
  }

  revalidatePath("/account/integrations");

  return {
    ok: true,
    authorizeUrl: amoCrmAuthorizeUrl({
      domainZone: validation.value.domainZone,
      clientId: validation.value.clientId,
      state,
    }),
  };
}

export type SelectAmoCrmResult = { ok: true } | { ok: false; code: "unauthorized" | "not_allowed" | "server_error" };

export async function selectAmoCrm(): Promise<SelectAmoCrmResult> {
  const user = await authenticatedUser();
  if (!user) return { ok: false, code: "unauthorized" };

  const workspace = await loadWorkspaceForUser(user.id);
  if (!workspace || workspace.mode !== "real") return { ok: false, code: "not_allowed" };

  const ok = await selectAmoCrmForWorkspace(workspace.companyId);
  if (!ok) return { ok: false, code: "server_error" };

  revalidatePath("/account");
  revalidatePath("/account/integrations");
  return { ok: true };
}

export type DisconnectResult = { ok: true } | { ok: false; code: "unauthorized" | "server_error" };

export async function disconnectAmoCrm(): Promise<DisconnectResult> {
  const user = await authenticatedUser();
  if (!user) return { ok: false, code: "unauthorized" };

  const workspace = await loadWorkspaceForUser(user.id);
  if (!workspace) return { ok: false, code: "unauthorized" };

  try {
    await disconnectCrm(workspace.companyId);
  } catch (cause) {
    console.error("disconnectAmoCrm failed", cause instanceof Error ? cause.message : cause);
    return { ok: false, code: "server_error" };
  }

  revalidatePath("/account");
  revalidatePath("/account/integrations");
  return { ok: true };
}
