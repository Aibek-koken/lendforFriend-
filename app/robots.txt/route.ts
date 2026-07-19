import type { NextRequest } from "next/server";
import { isLandingHost } from "@/lib/hosts";

// One deployment serves two hosts with opposite indexing intents, so
// robots.txt must be resolved per request host: the landing domain stays
// crawlable, the private portal (www + previews) is not a landing page and
// asks crawlers to stay out entirely. This only shapes crawling — no
// callback, API, or POST route is functionally affected.
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const body = isLandingHost(request.headers.get("host"))
    ? "User-agent: *\nDisallow: /api/\nDisallow: /auth/\n"
    : "User-agent: *\nDisallow: /\n";

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
