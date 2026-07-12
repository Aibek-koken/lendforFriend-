import { describe, expect, it } from "vitest";
import { PRODUCT_ANALYTICS_EVENTS, isProductAnalyticsEvent } from "@/lib/analytics";

describe("signup analytics allowlist", () => {
  it("contains only the three approved product events", () => {
    expect(PRODUCT_ANALYTICS_EVENTS).toEqual(["signup_completed", "demo_started", "crm_connected"]);
  });

  it("rejects internal funnel events", () => {
    for (const event of ["auth_google_started", "auth_google_succeeded", "signup_mode_selected", "company_profile_completed", "crm_connect_started", "crm_connect_failed"]) {
      expect(isProductAnalyticsEvent(event)).toBe(false);
    }
  });
});
