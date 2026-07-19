import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { CrmConnectionMetadata } from "@/lib/crm/state";
import type { Lang } from "@/lib/strings";
import { AccountView } from "./AccountView";

export const metadata: Metadata = {
  title: "Account · LiveAssist AI",
  description: "Manage your LiveAssist AI workspace and CRM connection.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * `get_account_state` returns only non-secret metadata (it never reads
 * crm_connection_secrets), so everything on this page is safe to render.
 */
export type AccountState = CrmConnectionMetadata & {
  userId: string | null;
  displayName: string | null;
  companyId: string | null;
  companyName: string | null;
};

function normalize(value: unknown): AccountState {
  const raw = (value ?? {}) as Record<string, unknown>;
  const str = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string) : null);

  return {
    userId: str("userId"),
    displayName: str("displayName"),
    companyId: str("companyId"),
    companyName: str("companyName"),
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

export default async function AccountPage({ searchParams }: { searchParams: { lang?: string } }) {
  const lang: Lang = searchParams.lang === "ru" ? "ru" : "en";

  if (!isSupabaseConfigured()) redirect("/signup");

  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/signup");

  const { data } = await supabase.rpc("get_account_state");

  return <AccountView initialLang={lang} state={normalize(data)} />;
}
