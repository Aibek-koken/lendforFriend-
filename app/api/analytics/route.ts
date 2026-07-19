import { NextResponse } from "next/server";
import { captureAnalyticsEvent, type AnalyticsEventName } from "@/lib/analytics";

const CLIENT_EVENTS = new Set<AnalyticsEventName>([
  "landing_viewed",
  "download_clicked",
  "waitlist_submitted",
]);

type AnalyticsRequest = {
  distinctId?: unknown;
  event?: unknown;
  properties?: unknown;
};

function isProperties(value: unknown): value is Record<string, string | number | boolean | null> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export async function POST(request: Request) {
  let payload: AnalyticsRequest;

  try {
    payload = (await request.json()) as AnalyticsRequest;
  } catch {
    return NextResponse.json({ errorCode: "invalid_payload" }, { status: 400 });
  }

  if (typeof payload.event !== "string" || !CLIENT_EVENTS.has(payload.event as AnalyticsEventName)) {
    return NextResponse.json({ errorCode: "invalid_event" }, { status: 400 });
  }

  const distinctId =
    typeof payload.distinctId === "string" && payload.distinctId.trim()
      ? payload.distinctId.trim().slice(0, 120)
      : "landing:anonymous";

  await captureAnalyticsEvent({
    distinctId,
    event: payload.event as AnalyticsEventName,
    properties: isProperties(payload.properties) ? payload.properties : {},
  });

  return NextResponse.json({ ok: true });
}
