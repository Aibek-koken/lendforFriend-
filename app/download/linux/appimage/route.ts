import { NextResponse } from "next/server";
import { DOWNLOAD_URLS } from "@/lib/downloads";

// Temporary redirect to the public Linux AppImage (x86_64), served by GitHub
// Releases — never proxied through this deployment.
export function GET() {
  return NextResponse.redirect(DOWNLOAD_URLS.linuxAppImage, 307);
}
