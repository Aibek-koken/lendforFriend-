"use server";

import { revalidatePath } from "next/cache";
import {
  captureAnalyticsEvent,
  identifyAnalyticsUser,
} from "@/lib/analytics";
import {
  AUTH_CODE_TTL_SECONDS,
  buildDesktopDeepLink,
  isHandoffSecret,
} from "@/lib/desktop-auth/handoff";
import { generateHandoffSecret, hashHandoffSecret } from "@/lib/desktop-auth/secrets";
import {
  validateCompanySetup,
  workspaceEventsForResult,
  type CompanySetupInput,
  type SignupMode,
  type SignupState,
} from "@/lib/signup/domain";
import type { Lang } from "@/lib/strings";
import { createClient } from "@/lib/supabase/server";

type ActionResult =
  | { ok: true; state: SignupState }
  | { ok: false; code: "unauthorized" | "invalid_input" | "server_error"; errors?: Record<string, string> };

type DesktopHandoffResult =
  | { ok: true; deepLink: string }
  | { ok: false; code: "unauthorized" | "invalid_state" | "server_error" };

function normalizeState(value: unknown): SignupState {
  const state = (value ?? {}) as Partial<SignupState>;
  return {
    authenticated: true,
    step: state.step ?? "mode",
    mode: state.mode ?? null,
    companyId: state.companyId ?? null,
    companyName: state.companyName ?? null,
    crmProvider: state.crmProvider ?? null,
    crmStatus: state.crmStatus ?? null,
  };
}

async function authenticatedClient() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, user: data.user };
}

export async function saveSignupMode(mode: SignupMode, language: Lang): Promise<ActionResult> {
  const auth = await authenticatedClient();
  if (!auth) return { ok: false, code: "unauthorized" };

  const { data, error } = await auth.supabase.rpc("save_signup_progress", {
    requested_mode: mode,
    requested_language: language,
  });

  if (error) return { ok: false, code: "server_error" };
  revalidatePath("/signup");
  return { ok: true, state: normalizeState(data) };
}

export async function createRealWorkspace(
  input: CompanySetupInput,
  language: Lang
): Promise<ActionResult> {
  const validation = validateCompanySetup(input);
  if (!validation.ok) {
    return { ok: false, code: "invalid_input", errors: validation.errors };
  }

  const auth = await authenticatedClient();
  if (!auth) return { ok: false, code: "unauthorized" };

  const { data, error } = await auth.supabase.rpc("complete_real_signup", {
    company_name: validation.value.companyName,
    manager_bucket: validation.value.managerCount,
    crm_provider: validation.value.crmProvider,
    primary_goal: validation.value.mainGoal,
    requested_language: language,
  });

  if (error) return { ok: false, code: "server_error" };

  const result = (data ?? {}) as { created?: boolean; state?: unknown };
  const state = normalizeState(result.state);
  if (workspaceEventsForResult("real", Boolean(result.created)).length && state.companyId) {
    await identifyAnalyticsUser(auth.user.id);
    await captureAnalyticsEvent({
      distinctId: auth.user.id,
      event: "signup_completed",
      properties: {
        company_id: state.companyId,
        crm_provider: state.crmProvider,
        language,
        mode: "real",
        source: "signup",
      },
    });
  }

  revalidatePath("/signup");
  return { ok: true, state };
}

/**
 * Stage 2: mint the one-time code the desktop app trades for a session.
 *
 * `desktopState` is the nonce the DESKTOP generated before it opened this page
 * (arriving as `/signup?state=…`). We store only its hash, echo the plaintext
 * back through the deep link, and the desktop refuses any callback carrying a
 * state it did not itself mint. Without that binding a crafted liveassist://
 * link could sign someone's app into an attacker's workspace.
 *
 * The returned deep link is the ONLY place the plaintext code exists after this
 * call. It is never logged, never persisted, and carries no Supabase token.
 */
export async function issueDesktopHandoff(desktopState: string): Promise<DesktopHandoffResult> {
  if (!isHandoffSecret(desktopState)) {
    return { ok: false, code: "invalid_state" };
  }

  const auth = await authenticatedClient();
  if (!auth) return { ok: false, code: "unauthorized" };

  const code = generateHandoffSecret();

  const { error } = await auth.supabase.rpc("issue_desktop_auth_code", {
    requested_code_hash: hashHandoffSecret(code),
    requested_state_hash: hashHandoffSecret(desktopState),
    ttl_seconds: AUTH_CODE_TTL_SECONDS,
  });

  if (error) {
    // Server-side only, and safe: we send the RPC nothing but hashes, so its
    // error can carry no code, state, or token. The client still gets an opaque
    // "server_error" — but without this line a missing migration looks
    // identical to a real outage, and the UI just tells the user to press the
    // button again forever. PGRST202 here means supabase/desktop-auth.sql has
    // not been applied to this project.
    console.error("issueDesktopHandoff: issue_desktop_auth_code failed", {
      code: error.code,
      message: error.message,
    });
    return { ok: false, code: "server_error" };
  }

  return { ok: true, deepLink: buildDesktopDeepLink(code, desktopState) };
}

export async function createDemoWorkspace(language: Lang): Promise<ActionResult> {
  const auth = await authenticatedClient();
  if (!auth) return { ok: false, code: "unauthorized" };

  const { data, error } = await auth.supabase.rpc("complete_demo_signup", {
    requested_language: language,
  });

  if (error) return { ok: false, code: "server_error" };

  const result = (data ?? {}) as { created?: boolean; state?: unknown };
  const state = normalizeState(result.state);
  if (workspaceEventsForResult("demo", Boolean(result.created)).length && state.companyId) {
    await identifyAnalyticsUser(auth.user.id);
    await Promise.all([
      captureAnalyticsEvent({
        distinctId: auth.user.id,
        event: "signup_completed",
        properties: { company_id: state.companyId, language, mode: "demo", source: "signup" },
      }),
      captureAnalyticsEvent({
        distinctId: auth.user.id,
        event: "demo_started",
        properties: { company_id: state.companyId, language, mode: "demo", source: "signup" },
      }),
    ]);
  }

  revalidatePath("/signup");
  return { ok: true, state };
}
