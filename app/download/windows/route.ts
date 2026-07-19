import { NextResponse } from "next/server";
import { DOWNLOAD_URLS } from "@/lib/downloads";

// Temporary redirect to the public Windows (x64) installer, served by GitHub
// Releases — never proxied through this deployment.
export function GET() {
  return NextResponse.redirect(DOWNLOAD_URLS.windows, 307);
}
