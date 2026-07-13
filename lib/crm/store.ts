import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret, encryptSecret } from "./crypto";
import { isAmoCrmDomainZone, type AmoCrmDomainZone } from "./amocrm";
import { isAccessTokenFresh, refreshAccessToken, AmoCrmTokenError, type AmoCrmTokenPair } from "./amocrmTokens";
import type { CrmConnectionMetadata, CrmErrorCode, WorkspaceMode } from "./state";

// The ONLY module that touches public.crm_connection_secrets. SERVER ONLY.
//
// Everything that leaves this module is non-secret: metadata for rendering, or
// a plaintext access token handed straight to an outbound amoCRM call inside the
// same request. No secret is ever returned to a page, a server action's client
// result, an API response body, or a log line.

export type CompanyWorkspace = {
  companyId: string;
  companyName: string;
  mode: WorkspaceMode;
};

type ConnectionRow = {
  id: string;
  company_id: string;
  provider: string;
  status: string;
  subdomain: string | null;
  domain_zone: string | null;
  client_id: string | null;
  external_account_id: string | null;
  connected_at: string | null;
  last_error_code: string | null;
  last_error_at: string | null;
};

const CONNECTION_COLUMNS =
  "id, company_id, provider, status, subdomain, domain_zone, client_id, external_account_id, connected_at, last_error_code, last_error_at";

function toMetadata(mode: WorkspaceMode | null, row: ConnectionRow | null): CrmConnectionMetadata {
  return {
    mode,
    provider: row?.provider ?? null,
    status: row?.status ?? null,
    subdomain: row?.subdomain ?? null,
    domainZone: row?.domain_zone ?? null,
    clientId: row?.client_id ?? null,
    accountId: row?.external_account_id ?? null,
    connectedAt: row?.connected_at ?? null,
    lastErrorCode: row?.last_error_code ?? null,
    lastErrorAt: row?.last_error_at ?? null,
  };
}

/** The workspace a user owns, or null if signup never created one. */
export async function loadWorkspaceForUser(userId: string): Promise<CompanyWorkspace | null> {
  const admin = createAdminClient();

  const membership = await admin
    .from("company_members")
    .select("company_id, companies(id, name, mode)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{
      company_id: string;
      companies: { id: string; name: string; mode: string } | null;
    }>();

  if (membership.error || !membership.data?.companies) return null;

  const company = membership.data.companies;
  return {
    companyId: company.id,
    companyName: company.name,
    mode: company.mode === "demo" ? "demo" : "real",
  };
}

export async function loadCrmMetadata(workspace: CompanyWorkspace): Promise<CrmConnectionMetadata> {
  const admin = createAdminClient();

  const connection = await admin
    .from("crm_connections")
    .select(CONNECTION_COLUMNS)
    .eq("company_id", workspace.companyId)
    .maybeSingle<ConnectionRow>();

  if (connection.error) {
    console.error("crm store: crm_connections lookup failed", {
      code: connection.error.code,
      message: connection.error.message,
    });
    return toMetadata(workspace.mode, null);
  }

  return toMetadata(workspace.mode, connection.data);
}

/**
 * Saves the integration's credentials: the non-secret half onto the metadata
 * row, the client_secret encrypted into the secrets table. Leaves `status`
 * alone — saving credentials is not connecting; only a completed OAuth round
 * trip may move a row to `connected`.
 */
export async function saveAmoCrmCredentials(
  workspace: CompanyWorkspace,
  credentials: {
    subdomain: string;
    domainZone: AmoCrmDomainZone;
    clientId: string;
    clientSecret: string;
  }
): Promise<{ ok: true } | { ok: false; code: "not_found" | "server_error" }> {
  const admin = createAdminClient();

  const connection = await admin
    .from("crm_connections")
    .select("id, provider")
    .eq("company_id", workspace.companyId)
    .maybeSingle<{ id: string; provider: string }>();

  // A demo or non-amoCRM workspace has no business storing an amoCRM secret.
  // The caller checks this too; this is the last line, closest to the write.
  if (connection.error || !connection.data || connection.data.provider !== "amocrm") {
    return { ok: false, code: "not_found" };
  }

  const metadataUpdate = await admin
    .from("crm_connections")
    .update({
      subdomain: credentials.subdomain,
      domain_zone: credentials.domainZone,
      client_id: credentials.clientId,
      last_error_code: null,
      last_error_at: null,
    })
    .eq("id", connection.data.id)
    .eq("company_id", workspace.companyId);

  if (metadataUpdate.error) {
    console.error("crm store: crm_connections update failed", {
      code: metadataUpdate.error.code,
      message: metadataUpdate.error.message,
    });
    return { ok: false, code: "server_error" };
  }

  // Re-saving credentials invalidates any token pair minted under the old ones.
  // Clearing them here means a half-changed connection can never present a stale
  // access token as if it belonged to the new client id.
  const secretUpsert = await admin.from("crm_connection_secrets").upsert(
    {
      company_id: workspace.companyId,
      provider: "amocrm",
      client_secret_enc: encryptSecret(credentials.clientSecret),
      access_token_enc: null,
      refresh_token_enc: null,
      access_token_expires_at: null,
    },
    { onConflict: "company_id" }
  );

  if (secretUpsert.error) {
    console.error("crm store: crm_connection_secrets upsert failed", {
      code: secretUpsert.error.code,
      message: secretUpsert.error.message,
    });
    return { ok: false, code: "server_error" };
  }

  return { ok: true };
}

export async function selectAmoCrmForWorkspace(companyId: string): Promise<boolean> {
  const admin = createAdminClient();

  const update = await admin
    .from("crm_connections")
    .update({
      provider: "amocrm",
      status: "pending",
      subdomain: null,
      domain_zone: null,
      client_id: null,
      external_account_id: null,
      external_account_name: null,
      connected_at: null,
      last_error_code: null,
      last_error_at: null,
    })
    .eq("company_id", companyId);

  if (update.error) {
    console.error("crm store: provider switch to amoCRM failed", {
      code: update.error.code,
      message: update.error.message,
    });
    return false;
  }

  await admin.from("crm_connection_secrets").delete().eq("company_id", companyId);
  return true;
}

type SecretRow = {
  client_secret_enc: string;
  access_token_enc: string | null;
  refresh_token_enc: string | null;
  access_token_expires_at: string | null;
};

/** The client_secret, for one outbound amoCRM call. Never returned to a client. */
export async function loadClientSecret(companyId: string): Promise<string | null> {
  const admin = createAdminClient();

  const secret = await admin
    .from("crm_connection_secrets")
    .select("client_secret_enc")
    .eq("company_id", companyId)
    .maybeSingle<{ client_secret_enc: string }>();

  if (secret.error || !secret.data) return null;
  return decryptSecret(secret.data.client_secret_enc);
}

export async function saveTokenPair(companyId: string, tokens: AmoCrmTokenPair): Promise<boolean> {
  const admin = createAdminClient();

  const update = await admin
    .from("crm_connection_secrets")
    .update({
      access_token_enc: encryptSecret(tokens.accessToken),
      refresh_token_enc: encryptSecret(tokens.refreshToken),
      access_token_expires_at: tokens.expiresAt.toISOString(),
    })
    .eq("company_id", companyId);

  if (update.error) {
    console.error("crm store: token persist failed", {
      code: update.error.code,
      message: update.error.message,
    });
    return false;
  }

  return true;
}

export async function markCrmConnected(
  companyId: string,
  accountId: string | null
): Promise<{ ok: true; changed: boolean } | { ok: false }> {
  const admin = createAdminClient();

  const before = await admin
    .from("crm_connections")
    .select("status")
    .eq("company_id", companyId)
    .maybeSingle<{ status: string }>();

  if (before.error || !before.data) {
    console.error("crm store: connected status lookup failed", {
      code: before.error?.code ?? "missing_connection",
      message: before.error?.message ?? "No crm_connections row exists for this company",
    });
    return { ok: false };
  }

  const alreadyConnected = before.data.status === "connected";

  const update = await admin
    .from("crm_connections")
    .update({
      status: "connected",
      external_account_id: accountId,
      connected_at: new Date().toISOString(),
      last_error_code: null,
      last_error_at: null,
    })
    .eq("company_id", companyId);

  if (update.error) {
    console.error("crm store: connected status update failed", {
      code: update.error.code,
      message: update.error.message,
    });
    return { ok: false };
  }

  // `changed` gates the crm_connected analytics event, exactly as the desktop
  // reconciliation path does: one real connection, one event, no matter how many
  // times the customer retries.
  return { ok: true, changed: !alreadyConnected };
}

export async function markCrmFailed(companyId: string, code: CrmErrorCode): Promise<void> {
  const admin = createAdminClient();

  await admin
    .from("crm_connections")
    .update({
      status: "failed",
      last_error_code: code,
      last_error_at: new Date().toISOString(),
    })
    .eq("company_id", companyId);
}

export async function disconnectCrm(companyId: string): Promise<void> {
  const admin = createAdminClient();

  // Secrets go first. If the second statement fails, the worst outcome is a row
  // that says "connected" with no credentials behind it — recoverable, and it
  // fails closed. The reverse order could leave live tokens behind a row that
  // claims to be disconnected.
  await admin.from("crm_connection_secrets").delete().eq("company_id", companyId);

  await admin
    .from("crm_connections")
    .update({
      status: "pending",
      external_account_id: null,
      connected_at: null,
      last_error_code: null,
      last_error_at: null,
    })
    .eq("company_id", companyId);
}

/**
 * A usable access token for `companyId`, refreshing it first if it has expired.
 * The ONLY way outbound amoCRM calls get a token — nothing else decrypts one.
 *
 * Throws AmoCrmTokenError so callers can distinguish "reconnect required" from
 * "amoCRM is having a bad day"; a transient failure must never clear the stored
 * credentials.
 */
export async function accessTokenForCompany(companyId: string, redirectUri: string): Promise<string> {
  const admin = createAdminClient();

  const connection = await admin
    .from("crm_connections")
    .select("subdomain, domain_zone, client_id, status")
    .eq("company_id", companyId)
    .maybeSingle<{
      subdomain: string | null;
      domain_zone: string | null;
      client_id: string | null;
      status: string;
    }>();

  const row = connection.data;
  if (!row?.subdomain || !isAmoCrmDomainZone(row.domain_zone) || !row.client_id) {
    throw new AmoCrmTokenError("invalid_credentials", "This workspace has no amoCRM integration configured");
  }

  const secret = await admin
    .from("crm_connection_secrets")
    .select("client_secret_enc, access_token_enc, refresh_token_enc, access_token_expires_at")
    .eq("company_id", companyId)
    .maybeSingle<SecretRow>();

  if (secret.error || !secret.data) {
    throw new AmoCrmTokenError("invalid_credentials", "This workspace has no stored amoCRM credentials");
  }

  const expiresAt = secret.data.access_token_expires_at
    ? new Date(secret.data.access_token_expires_at)
    : null;

  if (secret.data.access_token_enc && isAccessTokenFresh(expiresAt)) {
    return decryptSecret(secret.data.access_token_enc);
  }

  if (!secret.data.refresh_token_enc) {
    throw new AmoCrmTokenError("authorization_expired", "This workspace has never completed amoCRM authorization");
  }

  const refreshed = await refreshAccessToken({
    subdomain: row.subdomain,
    domainZone: row.domain_zone,
    clientId: row.client_id,
    clientSecret: decryptSecret(secret.data.client_secret_enc),
    refreshToken: decryptSecret(secret.data.refresh_token_enc),
    redirectUri,
  });

  await saveTokenPair(companyId, refreshed);
  return refreshed.accessToken;
}
