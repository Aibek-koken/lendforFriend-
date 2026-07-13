import { NextResponse } from "next/server";
import { authorizeDesktopSession } from "@/lib/desktop-auth/authorize";
import {
  applyAmoCrmAction,
  DesktopCrmRuntimeError,
  getAmoCrmLeadContext,
  parseAmoCrmApplyRequest,
} from "@/lib/crm/desktopRuntime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function runtimeFailure(cause: unknown) {
  const error =
    cause instanceof DesktopCrmRuntimeError
      ? cause
      : new DesktopCrmRuntimeError("api_error", "The CRM request could not be completed.");
  const status =
    error.kind === "rate_limited"
      ? 429
      : error.kind === "not_connected" || error.kind === "reconnect_required"
        ? 409
        : error.kind === "unknown"
          ? 400
          : 502;
  return NextResponse.json(
    { ok: false, error: { kind: error.kind, message: error.message } },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(request: Request) {
  const auth = await authorizeDesktopSession(request);
  if (!auth.ok) return auth.response;

  const leadId = new URL(request.url).searchParams.get("leadId") ?? "";
  try {
    const context = await getAmoCrmLeadContext(auth.companyId, leadId);
    return NextResponse.json(context, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    return runtimeFailure(cause);
  }
}

export async function POST(request: Request) {
  const auth = await authorizeDesktopSession(request);
  if (!auth.ok) return auth.response;

  const parsed = parseAmoCrmApplyRequest(await request.json().catch(() => null));
  if (!parsed) {
    return runtimeFailure(new DesktopCrmRuntimeError("unknown", "The CRM action is invalid."));
  }

  try {
    const outcome = await applyAmoCrmAction(auth.companyId, parsed);
    return NextResponse.json(outcome, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    return runtimeFailure(cause);
  }
}
