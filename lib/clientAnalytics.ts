import type { AnalyticsEventName } from "./analytics";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

const LANDING_VISITOR_ID_KEY = "liveassist_landing_visitor_id";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function getLandingVisitorId() {
  try {
    const existing = localStorage.getItem(LANDING_VISITOR_ID_KEY);
    if (existing) return existing;

    const nextId = createId();
    localStorage.setItem(LANDING_VISITOR_ID_KEY, nextId);
    return nextId;
  } catch {
    return createId();
  }
}

export function trackLandingEvent(
  event: Extract<AnalyticsEventName, "landing_viewed" | "download_clicked" | "waitlist_submitted">,
  properties: AnalyticsProperties = {},
  distinctId = getLandingVisitorId()
) {
  const payload = JSON.stringify({
    distinctId,
    event,
    properties,
  });

  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon("/api/analytics", blob);
    return;
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
    keepalive: true,
  });
}
