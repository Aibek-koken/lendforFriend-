import { accountBaseUrl, type AmoCrmDomainZone } from "./amocrm";
import { toCrmErrorCode, type CrmErrorCode } from "./state";

// amoCRM's token endpoint. SERVER ONLY — this module handles client_secret,
// authorization codes, access tokens and refresh tokens in plaintext, in memory,
// for exactly as long as one request takes. None of it is logged, returned to a
// caller, or persisted anywhere except encrypted (lib/crm/crypto.ts).

export type AmoCrmTokenPair = {
  accessToken: string;
  refreshToken: string;
  /** Absolute expiry, so a stored pair can be checked without knowing when it was issued. */
  expiresAt: Date;
};

export class AmoCrmTokenError extends Error {
  readonly code: CrmErrorCode;

  constructor(code: CrmErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "AmoCrmTokenError";
  }
}

type TokenResponse = {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_in?: unknown;
};

/**
 * amoCRM rotates the refresh token on EVERY use: the moment a refresh succeeds,
 * the token we sent is dead. A second concurrent refresh with the same old token
 * therefore fails and can leave the integration locked out. The desktop solved
 * this with a process-wide mutex; here the equivalent guarantee comes from the
 * database — `store.ts` writes the new pair in one statement conditioned on the
 * refresh token it read, so a losing racer's write is a no-op and it simply
 * re-reads the winner's pair.
 */
async function requestTokens(
  subdomain: string,
  domainZone: AmoCrmDomainZone,
  body: Record<string, string>
): Promise<AmoCrmTokenPair> {
  const url = `${accountBaseUrl(subdomain, domainZone)}/oauth2/access_token`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    // A network failure is not a credential problem. Saying so keeps us from
    // wiping a perfectly good stored connection over a transient blip — the
    // exact bug the desktop hit and fixed in TASK-R.
    throw new AmoCrmTokenError("provider_unavailable", "amoCRM could not be reached");
  }

  if (!response.ok) {
    throw new AmoCrmTokenError(
      classifyTokenStatus(response.status),
      `amoCRM rejected the token request (${response.status})`
    );
  }

  let payload: TokenResponse;
  try {
    payload = (await response.json()) as TokenResponse;
  } catch {
    throw new AmoCrmTokenError("provider_unavailable", "amoCRM returned a malformed token response");
  }

  const accessToken = typeof payload.access_token === "string" ? payload.access_token : "";
  const refreshToken = typeof payload.refresh_token === "string" ? payload.refresh_token : "";
  const expiresIn = typeof payload.expires_in === "number" ? payload.expires_in : 0;

  if (!accessToken || !refreshToken) {
    throw new AmoCrmTokenError("provider_unavailable", "amoCRM returned an incomplete token pair");
  }

  return {
    accessToken,
    refreshToken,
    // Expire a minute early so a token cannot die mid-flight on a slow request.
    expiresAt: new Date(Date.now() + Math.max(60, expiresIn - 60) * 1000),
  };
}

/**
 * 400/401 from the TOKEN endpoint means the credentials or the code/refresh
 * token are genuinely bad — that is the only case worth marking the connection
 * failed for. A 429 or 5xx is transient and must not.
 */
export function classifyTokenStatus(status: number): CrmErrorCode {
  if (status === 400 || status === 401) return "invalid_credentials";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "provider_unavailable";
  return toCrmErrorCode(null);
}

export async function exchangeAuthorizationCode(params: {
  subdomain: string;
  domainZone: AmoCrmDomainZone;
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<AmoCrmTokenPair> {
  return requestTokens(params.subdomain, params.domainZone, {
    client_id: params.clientId,
    client_secret: params.clientSecret,
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
  });
}

export async function refreshAccessToken(params: {
  subdomain: string;
  domainZone: AmoCrmDomainZone;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  redirectUri: string;
}): Promise<AmoCrmTokenPair> {
  return requestTokens(params.subdomain, params.domainZone, {
    client_id: params.clientId,
    client_secret: params.clientSecret,
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
    redirect_uri: params.redirectUri,
  });
}

/** Whether a stored pair still has usable life left. */
export function isAccessTokenFresh(expiresAt: Date | null, now: Date = new Date()): boolean {
  return Boolean(expiresAt && expiresAt.getTime() > now.getTime());
}
