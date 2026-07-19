import { NextResponse } from "next/server";
import { DOWNLOAD_URLS } from "@/lib/downloads";

// Temporary redirect to the public macOS (Apple Silicon) installer. The binary
// is served by GitHub Releases — never proxied through this deployment.
export function GET() {
  return NextResponse.redirect(DOWNLOAD_URLS.macArm64, 307);
}
