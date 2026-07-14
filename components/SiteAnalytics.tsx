"use client";

import { Analytics } from "@vercel/analytics/next";
import { sanitizeAnalyticsUrl } from "@/lib/webAnalytics";

/**
 * Vercel Analytics with every reported URL stripped of its query string and
 * fragment, so auth codes, OAuth state, and the desktop handoff nonce can
 * never leak into analytics. Client wrapper because `beforeSend` is a
 * function and cannot be passed from the server layout.
 */
export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => ({ ...event, url: sanitizeAnalyticsUrl(event.url) })}
    />
  );
}
