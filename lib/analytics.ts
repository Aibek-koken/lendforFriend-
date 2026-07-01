export type AnalyticsEventName =
  | "landing_viewed"
  | "download_clicked"
  | "download_redirected"
  | "waitlist_submitted";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

type CaptureAnalyticsEventInput = {
  distinctId: string;
  event: AnalyticsEventName;
  properties?: AnalyticsProperties;
};

const SAFE_PROPERTY_KEYS = new Set([
  "app_version",
  "download_platform",
  "language",
  "os",
  "os_version",
  "path",
  "platform",
  "source",
  "timestamp",
]);

function normalizePostHogHost(rawHost: string | undefined) {
  return (rawHost || "https://us.i.posthog.com").replace(/\/+$/, "");
}

function sanitizeProperties(properties: AnalyticsProperties | undefined) {
  const safeProperties: AnalyticsProperties = {};

  for (const [key, value] of Object.entries(properties ?? {})) {
    if (!SAFE_PROPERTY_KEYS.has(key)) continue;
    if (typeof value === "string") {
      safeProperties[key] = value.slice(0, 200);
      continue;
    }
    if (typeof value === "number" || typeof value === "boolean" || value === null) {
      safeProperties[key] = value;
    }
  }

  return safeProperties;
}

export async function captureAnalyticsEvent({
  distinctId,
  event,
  properties,
}: CaptureAnalyticsEventInput) {
  const apiKey = process.env.POSTHOG_API_KEY;

  if (!apiKey) {
    return;
  }

  const host = normalizePostHogHost(process.env.POSTHOG_HOST);
  const safeProperties = sanitizeProperties(properties);

  if (!safeProperties.source) {
    safeProperties.source = "landing";
  }

  try {
    const response = await fetch(`${host}/capture/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        distinct_id: distinctId,
        event,
        properties: {
          ...safeProperties,
          timestamp: new Date().toISOString(),
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn(`Analytics capture failed for ${event}: ${response.status}`);
    }
  } catch (error) {
    console.warn(`Analytics capture failed for ${event}:`, error);
  }
}
