import { describe, expect, it } from "vitest";
import {
  assembleLeadContext,
  classifyAmoCrmHttpStatus,
  parseAmoCrmApplyRequest,
} from "@/lib/crm/desktopRuntime";

describe("desktop amoCRM runtime contract", () => {
  it("maps amoCRM lead, notes and task responses to the desktop context", () => {
    expect(
      assembleLeadContext(
        "42",
        { _embedded: { tags: [{ name: "priority" }, { name: "renewal" }] } },
        { _embedded: { notes: [{ params: { text: "Called today" } }, { params: {} }] } },
        {
          _embedded: {
            tasks: [
              { text: "Send proposal", is_completed: false },
              { text: "Old task", is_completed: true },
            ],
          },
        }
      )
    ).toEqual({
      leadId: "42",
      existingNotes: ["Called today"],
      existingTags: ["priority", "renewal"],
      openTaskTitles: ["Send proposal"],
    });
  });

  it("accepts only the four allowlisted write operations and numeric lead ids", () => {
    const valid = {
      actionId: "action-1",
      leadId: "42",
      operationKind: "create_note",
      title: "Call summary",
      fields: [{ key: "note", label: "Note", value: "Customer approved." }],
    };

    expect(parseAmoCrmApplyRequest(valid)).toEqual(valid);
    expect(parseAmoCrmApplyRequest({ ...valid, leadId: "../../account" })).toBeNull();
    expect(parseAmoCrmApplyRequest({ ...valid, operationKind: "delete_lead" })).toBeNull();
  });

  it("keeps reconnect, rate-limit and provider failures distinct", () => {
    expect(classifyAmoCrmHttpStatus(401)).toBe("reconnect_required");
    expect(classifyAmoCrmHttpStatus(429)).toBe("rate_limited");
    expect(classifyAmoCrmHttpStatus(503)).toBe("api_error");
    expect(classifyAmoCrmHttpStatus(400)).toBe("unknown");
  });
});
