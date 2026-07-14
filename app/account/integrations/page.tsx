import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { amoCrmRedirectUri } from "@/lib/crm/amocrm";
import { siteOrigin } from "@/lib/crm/origin";
import { isCrmSecretsConfigured } from "@/lib/crm/crypto";
import { toCrmErrorCode, type CrmConnectionMetadata } from "@/lib/crm/state";
import {
  DESKTOP_STATE_COOKIE,
  DESKTOP_STATE_PARAM,
  readDesktopStateParam,
} from "@/lib/desktop-auth/handoff";
import type { Lang } from "@/lib/strings";
import { AmoCrmSetup } from "./AmoCrmSetup";

export const metadata: Metadata = {
  title: "CRM integration · LiveAssist AI",
  description: "Connect amoCRM to your LiveAssist AI workspace.",
};

export const dynamic = "force-dynamic";

function normalize(value: unknown): CrmConnectionMetadata & { companyId: string | null } {
  const raw = (value ?? {}) as Record<string, unknown>;
  const str = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string) : null);

  return {
    companyId: str("companyId"),
    mode: raw.mode === "demo" ? "demo" : raw.mode === "real" ? "real" : null,
    provider: str("crmProvider"),
    status: str("crmStatus"),
    subdomain: str("crmSubdomain"),
    domainZone: str("crmDomainZone"),
    clientId: str("crmClientId"),
    accountId: str("crmAccountId"),
    connectedAt: str("crmConnectedAt"),
    lastErrorCode: str("crmLastErrorCode"),
    lastErrorAt: str("crmLastErrorAt"),
  };
}

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: {
    lang?: string;
    error?: string;
    connected?: string;
    disconnected?: string;
    [DESKTOP_STATE_PARAM]?: string;
  };
}) {
  const lang: Lang = searchParams.lang === "ru" ? "ru" : "en";

  if (!isSupabaseConfigured()) redirect("/signup");

  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/signup");

  const { data } = await supabase.rpc("get_account_state");
  const metadata = normalize(data);
  const cookieStore = cookies();
  const desktopState =
    readDesktopStateParam(searchParams[DESKTOP_STATE_PARAM]) ??
    readDesktopStateParam(cookieStore.get(DESKTOP_STATE_COOKIE)?.value);

  return (
    <AmoCrmSetup
      initialLang={lang}
      metadata={metadata}
      redirectUri={amoCrmRedirectUri(siteOrigin())}
      secretsConfigured={isCrmSecretsConfigured()}
      callbackError={searchParams.error ? toCrmErrorCode(searchParams.error) : null}
      justConnected={searchParams.connected === "1"}
      // Set by the disconnect flow itself, so the page that lands afterwards can
      // offer the same "Open LiveAssist" sync action a connect does.
      justDisconnected={searchParams.disconnected === "1"}
      desktopState={desktopState}
    />
  );
}
