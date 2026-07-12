import { describe, expect, it } from "vitest";
import {
  canCaptureCrmConnected,
  nextStepForState,
  validateCompanySetup,
  workspaceEventsForResult,
} from "@/lib/signup/domain";
import { signupStrings } from "@/lib/signup/strings";

describe("signup mode and resume flow", () => {
  it("routes authenticated real users back to company setup", () => {
    expect(nextStepForState({ authenticated: true, mode: "real", companyId: null })).toBe("company");
  });

  it("routes registered users directly to complete", () => {
    expect(nextStepForState({ authenticated: true, mode: "demo", companyId: "company-1" })).toBe("complete");
  });

  it("does not emit events when a demo workspace already exists", () => {
    expect(workspaceEventsForResult("demo", false)).toEqual([]);
    expect(workspaceEventsForResult("demo", true)).toEqual(["signup_completed", "demo_started"]);
  });
});

describe("company setup validation", () => {
  it("accepts the four allowed choices", () => {
    expect(validateCompanySetup({ companyName: "Acme", managerCount: "2-5", crmProvider: "amocrm", mainGoal: "sales" })).toEqual({
      ok: true,
      value: { companyName: "Acme", managerCount: "2-5", crmProvider: "amocrm", mainGoal: "sales" },
    });
  });

  it("returns field-level errors for missing choices", () => {
    const result = validateCompanySetup({ companyName: " ", managerCount: "", crmProvider: "", mainGoal: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(["companyName", "managerCount", "crmProvider", "mainGoal"]);
  });
});

describe("CRM and localization contracts", () => {
  it("never treats pending CRM as connected", () => {
    expect(canCaptureCrmConnected("pending")).toBe(false);
    expect(canCaptureCrmConnected("connected")).toBe(true);
  });

  it("contains core RU and EN screen copy", () => {
    expect(signupStrings.en.google).toBe("Continue with Google");
    expect(signupStrings.ru.google).toBe("Продолжить с Google");
    expect(signupStrings.en.realTitle).toBe("Connect my CRM");
    expect(signupStrings.ru.demoTitle).toBe("Попробовать демо");
    expect(signupStrings.en.open).toBe("Open LiveAssist");
    expect(signupStrings.ru.open).toBe("Открыть LiveAssist");
  });
});
