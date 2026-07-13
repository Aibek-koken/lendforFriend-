import type { Metadata } from "next";
import { SignupFlow } from "./SignupFlow";
import { DESKTOP_STATE_PARAM, readDesktopStateParam } from "@/lib/desktop-auth/handoff";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { SignupState } from "@/lib/signup/domain";
import type { Lang } from "@/lib/strings";

export const metadata: Metadata = {
  title: "Get started · LiveAssist AI",
  description: "Create your LiveAssist AI workspace with Google.",
};

const signedOutState: SignupState = {
  authenticated: false,
  step: "auth",
  mode: null,
  companyId: null,
  companyName: null,
  crmProvider: null,
  crmStatus: null,
};

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

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { lang?: string; auth_error?: string; upgrade?: string; [DESKTOP_STATE_PARAM]?: string };
}) {
  const configured = isSupabaseConfigured();
  const initialLang: Lang = searchParams.lang === "ru" ? "ru" : "en";
  // Present only when the desktop app started this signup. It is the nonce the
  // final screen binds the one-time code to.
  const desktopState = readDesktopStateParam(searchParams[DESKTOP_STATE_PARAM]);

  if (!configured) {
    return (
      <SignupFlow
        configured={false}
        desktopState={desktopState}
        forceRealSetup={searchParams.upgrade === "real"}
        initialLang={initialLang}
        initialState={signedOutState}
        oauthError={Boolean(searchParams.auth_error)}
      />
    );
  }

  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return (
      <SignupFlow
        configured
        desktopState={desktopState}
        forceRealSetup={searchParams.upgrade === "real"}
        initialLang={initialLang}
        initialState={signedOutState}
        oauthError={Boolean(searchParams.auth_error)}
      />
    );
  }

  const { data, error } = await supabase.rpc("get_signup_state");
  const displayName =
    authData.user.user_metadata?.full_name ??
    authData.user.user_metadata?.name ??
    null;

  return (
    <SignupFlow
      configured
      databaseReady={!error}
      desktopState={desktopState}
      displayName={typeof displayName === "string" ? displayName : null}
      forceRealSetup={searchParams.upgrade === "real"}
      initialLang={initialLang}
      initialState={error ? { ...signedOutState, authenticated: true, step: "mode" } : normalizeState(data)}
      oauthError={Boolean(searchParams.auth_error)}
    />
  );
}
