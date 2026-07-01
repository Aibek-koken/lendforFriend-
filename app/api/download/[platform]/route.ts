import { NextResponse, type NextRequest } from "next/server";
import { captureAnalyticsEvent } from "@/lib/analytics";

const DOWNLOADS = {
  "mac-arm64":
    "https://github.com/Aibek-koken/liveassist-downloads-/releases/download/v0.1.0/LiveAssist.AI-0.1.0-arm64.dmg",
  windows:
    "https://github.com/Aibek-koken/liveassist-downloads-/releases/download/v0.1.0/LiveAssist.AI.Setup.0.1.0.1.exe",
  linux:
    "https://github.com/Aibek-koken/liveassist-downloads-/releases/download/v0.1.0/LiveAssist.AI-0.1.0.1.AppImage",
} as const;

type DownloadPlatform = keyof typeof DOWNLOADS;

function isDownloadPlatform(platform: string): platform is DownloadPlatform {
  return platform in DOWNLOADS;
}

function getDistinctId(request: NextRequest, platform: DownloadPlatform) {
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
  if (!isDownloadPlatform(params.platform)) {
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

  return NextResponse.redirect(DOWNLOADS[params.platform], 302);
}
