import { NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WAITLIST_TABLE = process.env.SUPABASE_WAITLIST_TABLE || "waitlist_signups";

type WaitlistRequest = {
  email?: string;
  lang?: string;
};

function normalizeSupabaseUrl(rawUrl?: string) {
  return rawUrl?.trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

export async function POST(request: Request) {
  let payload: WaitlistRequest;

  try {
    payload = (await request.json()) as WaitlistRequest;
  } catch {
    return NextResponse.json(
      { errorCode: "invalid_payload" },
      { status: 400 }
    );
  }

  const email = payload.email?.trim().toLowerCase();
  const locale = payload.lang === "ru" ? "ru" : "en";

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { errorCode: "invalid_email" },
      { status: 400 }
    );
  }

  const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { errorCode: "waitlist_not_configured" },
      { status: 503 }
    );
  }

  let response: Response;

  try {
    response = await fetch(
      `${supabaseUrl}/rest/v1/${WAITLIST_TABLE}?on_conflict=email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          email,
          locale,
          source: "landing_page",
          user_agent: request.headers.get("user-agent"),
        }),
        cache: "no-store",
      }
    );
  } catch (error) {
    console.error("Waitlist Supabase request failed:", error);

    return NextResponse.json(
      { errorCode: "waitlist_upstream_unreachable" },
      { status: 502 }
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Waitlist Supabase insert failed:", errorText);

    return NextResponse.json(
      { errorCode: "supabase_insert_failed" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
