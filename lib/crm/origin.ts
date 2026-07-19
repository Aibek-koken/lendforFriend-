/**
 * The canonical public origin of this web app.
 *
 * The amoCRM redirect_uri is built from it, and the customer pastes that exact
 * string into their integration's "Redirect URI" field. amoCRM compares it
 * byte-for-byte at token-exchange time, so it must NOT be derived from the
 * incoming request (a preview deployment, a bare-apex hit, or a proxied Host
 * header would each produce a different value and break the exchange).
 */
export function siteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (configured || "https://www.liveassist.tech").replace(/\/+$/, "");
}
