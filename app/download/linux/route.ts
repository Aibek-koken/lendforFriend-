import { NextResponse, type NextRequest } from "next/server";

// Linux has two formats (AppImage and .deb), so /download/linux does not pick
// one — it sends the visitor to the Linux section of the download page to
// choose. Temporary redirect, same-origin.
export function GET(request: NextRequest) {
  const target = new URL("/download", request.url);
  target.hash = "linux";
  return NextResponse.redirect(target, 307);
}
