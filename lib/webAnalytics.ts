/**
 * Strips the query string and fragment from a URL before it reaches web
 * analytics. Portal URLs legitimately carry `desktop_state` (the desktop
 * handoff nonce), OAuth `code`/`state`, and amoCRM callback parameters —
 * none of which may ever land in an analytics store.
 */
export function sanitizeAnalyticsUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return rawUrl.split("?")[0].split("#")[0];
  }
}
