import { NextResponse, type NextRequest } from "next/server";
import { captureAnalyticsEvent } from "@/lib/analytics";
import { API_DOWNLOAD_URLS, isApiDownloadPlatform } from "@/lib/downloads";

function getDistinctId(request: NextRequest, platform: string) {
  const visitorId = request.nextUrl.searchParams.get("visitor_id")?.trim();

  if (visitorId) {
    return visitorId.slice(0, 120);
  }

  return `download:${platform}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  if (!isApiDownloadPlatform(params.platform)) {
    return NextResponse.json({ errorCode: "unknown_download_platform" }, { status: 404 });
  }

  await captureAnalyticsEvent({
    distinctId: getDistinctId(request, params.platform),
    event: "download_redirected",
    properties: {
      download_platform: params.platform,
      platform: params.platform,
      source: "landing_download_route",
    },
  });

  return NextResponse.redirect(API_DOWNLOAD_URLS[params.platform], 302);
}
