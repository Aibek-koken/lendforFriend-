import { accountBaseUrl } from "./amocrm";
import { siteOrigin } from "./origin";
import {
  accessTokenForCompany,
  loadAmoCrmRuntimeConnection,
} from "./store";
import { AmoCrmTokenError } from "./amocrmTokens";

export type DesktopCrmErrorKind =
  | "not_connected"
  | "reconnect_required"
  | "rate_limited"
  | "offline"
  | "api_error"
  | "unknown";

export class DesktopCrmRuntimeError extends Error {
  readonly kind: DesktopCrmErrorKind;

  constructor(kind: DesktopCrmErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = "DesktopCrmRuntimeError";
  }
}

export type AmoCrmLeadContext = {
  leadId: string;
  existingNotes: string[];
  existingTags: string[];
  openTaskTitles: string[];
};

export type AmoCrmApplyField = {
  key: string;
  label: string;
  value: string;
};

export type AmoCrmApplyRequest = {
  actionId: string;
  leadId: string;
  operationKind: "create_note" | "attach_summary" | "create_task" | "add_tag";
  title: string;
  fields: AmoCrmApplyField[];
};

export type AmoCrmApplyOutcome = {
  actionId: string;
  status: "applied" | "failed";
  message: string;
  retryable: boolean;
  errorKind?: DesktopCrmErrorKind;
};

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return value && typeof value === "object" ? (value as JsonRecord) : null;
}

function string(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function mapTokenError(error: AmoCrmTokenError): DesktopCrmRuntimeError {
  if (error.code === "invalid_credentials" || error.code === "authorization_expired") {
    return new DesktopCrmRuntimeError(
      "reconnect_required",
      "The stored amoCRM authorization can no longer be renewed. Reconnect amoCRM on the website."
    );
  }
  if (error.code === "rate_limited") {
    return new DesktopCrmRuntimeError("rate_limited", "amoCRM is rate limiting requests. Try again shortly.");
  }
  return new DesktopCrmRuntimeError("api_error", "amoCRM is temporarily unavailable.");
}

export function classifyAmoCrmHttpStatus(status: number): DesktopCrmErrorKind {
  if (status === 401 || status === 403) return "reconnect_required";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "api_error";
  return "unknown";
}

async function tokenFor(companyId: string, forceRefresh: boolean): Promise<string> {
  try {
    return await accessTokenForCompany(companyId, `${siteOrigin()}/api/crm/amocrm/callback`, {
      forceRefresh,
    });
  } catch (cause) {
    if (cause instanceof AmoCrmTokenError) throw mapTokenError(cause);
    throw new DesktopCrmRuntimeError("api_error", "The CRM authorization could not be loaded.");
  }
}

async function amoCrmRequest(
  companyId: string,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const connection = await loadAmoCrmRuntimeConnection(companyId);
  if (!connection) {
    throw new DesktopCrmRuntimeError("not_connected", "amoCRM is not connected for this workspace.");
  }

  const url = `${accountBaseUrl(connection.subdomain, connection.domainZone)}/api/v4${path}`;

  const send = async (token: string) => {
    try {
      return await fetch(url, {
        ...init,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...init.headers,
        },
        cache: "no-store",
      });
    } catch {
      throw new DesktopCrmRuntimeError("offline", "amoCRM could not be reached.");
    }
  };

  let response = await send(await tokenFor(companyId, false));
  if (response.status === 401) {
    response = await send(await tokenFor(companyId, true));
  }

  if (!response.ok) {
    const kind = classifyAmoCrmHttpStatus(response.status);
    const message =
      kind === "reconnect_required"
        ? "amoCRM rejected the stored authorization. Reconnect amoCRM on the website."
        : kind === "rate_limited"
          ? "amoCRM is rate limiting requests. Try again shortly."
          : `amoCRM rejected the request (${response.status}).`;
    throw new DesktopCrmRuntimeError(kind, message);
  }

  return response;
}

async function json(response: Response): Promise<JsonRecord> {
  try {
    return record(await response.json()) ?? {};
  } catch {
    throw new DesktopCrmRuntimeError("api_error", "amoCRM returned an unreadable response.");
  }
}

export function assembleLeadContext(
  leadId: string,
  leadPayload: unknown,
  notesPayload: unknown,
  tasksPayload: unknown
): AmoCrmLeadContext {
  const lead = record(leadPayload);
  const leadEmbedded = record(lead?._embedded);
  const tags = Array.isArray(leadEmbedded?.tags) ? leadEmbedded.tags : [];

  const notesEmbedded = record(record(notesPayload)?._embedded);
  const notes = Array.isArray(notesEmbedded?.notes) ? notesEmbedded.notes : [];

  const tasksEmbedded = record(record(tasksPayload)?._embedded);
  const tasks = Array.isArray(tasksEmbedded?.tasks) ? tasksEmbedded.tasks : [];

  return {
    leadId,
    existingTags: tags
      .map((tag) => string(record(tag)?.name))
      .filter((value): value is string => Boolean(value)),
    existingNotes: notes
      .map((note) => string(record(record(note)?.params)?.text))
      .filter((value): value is string => Boolean(value)),
    openTaskTitles: tasks
      .filter((task) => record(task)?.is_completed !== true)
      .map((task) => string(record(task)?.text))
      .filter((value): value is string => Boolean(value)),
  };
}

function validLeadId(value: string): boolean {
  return /^[1-9]\d*$/.test(value);
}

export async function getAmoCrmLeadContext(
  companyId: string,
  leadId: string
): Promise<AmoCrmLeadContext> {
  const normalized = leadId.trim();
  if (!validLeadId(normalized)) {
    throw new DesktopCrmRuntimeError("unknown", "Lead ID must be a positive number.");
  }

  // Keep these sequential. amoCRM rotates refresh tokens on every refresh;
  // parallel requests could otherwise race on the same expired token.
  const lead = await amoCrmRequest(companyId, `/leads/${normalized}?with=tags`).then(json);
  const notes = await amoCrmRequest(companyId, `/leads/${normalized}/notes?limit=250`).then(json);
  const tasks = await amoCrmRequest(
    companyId,
    `/tasks?filter[entity_type]=leads&filter[entity_id]=${normalized}&limit=250`
  ).then(json);

  return assembleLeadContext(normalized, lead, notes, tasks);
}

const OPERATIONS = new Set(["create_note", "attach_summary", "create_task", "add_tag"]);

export function parseAmoCrmApplyRequest(input: unknown): AmoCrmApplyRequest | null {
  const value = record(input);
  if (!value) return null;

  const actionId = string(value.actionId)?.trim() ?? "";
  const leadId = string(value.leadId)?.trim() ?? "";
  const operationKind = string(value.operationKind)?.trim() ?? "";
  const title = string(value.title)?.trim() ?? "";
  const rawFields = Array.isArray(value.fields) ? value.fields : [];

  if (
    !actionId ||
    actionId.length > 200 ||
    !validLeadId(leadId) ||
    !OPERATIONS.has(operationKind) ||
    !title ||
    title.length > 2_000 ||
    rawFields.length > 30
  ) {
    return null;
  }

  const fields: AmoCrmApplyField[] = [];
  for (const item of rawFields) {
    const field = record(item);
    const key = string(field?.key)?.trim() ?? "";
    const label = string(field?.label)?.trim() ?? "";
    const fieldValue = string(field?.value) ?? "";
    if (!key || !label || key.length > 200 || label.length > 500 || fieldValue.length > 20_000) {
      return null;
    }
    fields.push({ key, label, value: fieldValue });
  }

  return {
    actionId,
    leadId,
    operationKind: operationKind as AmoCrmApplyRequest["operationKind"],
    title,
    fields,
  };
}

function fieldValue(request: AmoCrmApplyRequest, key: string): string | undefined {
  return request.fields.find((field) => field.key === key)?.value;
}

function noteText(request: AmoCrmApplyRequest): string | undefined {
  const explicit = fieldValue(request, "note") ?? fieldValue(request, "summary");
  if (explicit) return explicit;
  if (request.operationKind !== "attach_summary" || request.fields.length === 0) return undefined;
  return `${request.title}: ${request.fields.map((field) => `${field.label}: ${field.value}`).join("; ")}`;
}

function tagValue(request: AmoCrmApplyRequest): string {
  return fieldValue(request, "tag") ?? request.title;
}

function duplicateMessage(request: AmoCrmApplyRequest, context: AmoCrmLeadContext): string | null {
  if (
    (request.operationKind === "create_note" || request.operationKind === "attach_summary") &&
    context.existingNotes.includes(noteText(request) ?? "")
  ) {
    return "An identical note already exists on this lead.";
  }
  if (request.operationKind === "create_task" && context.openTaskTitles.includes(request.title)) {
    return "A task with this title is already open on this lead.";
  }
  if (request.operationKind === "add_tag" && context.existingTags.includes(tagValue(request))) {
    return "This lead is already tagged with this value.";
  }
  return null;
}

function taskDueAt(request: AmoCrmApplyRequest): number {
  const raw = fieldValue(request, "follow_up_date")?.trim();
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const parsed = Date.parse(`${raw}T12:00:00Z`);
    if (Number.isFinite(parsed)) return Math.floor(parsed / 1000);
  }
  return Math.floor(Date.now() / 1000) + 86_400;
}

export async function applyAmoCrmAction(
  companyId: string,
  request: AmoCrmApplyRequest
): Promise<AmoCrmApplyOutcome> {
  const context = await getAmoCrmLeadContext(companyId, request.leadId);
  const duplicate = duplicateMessage(request, context);
  if (duplicate) {
    return {
      actionId: request.actionId,
      status: "failed",
      message: duplicate,
      retryable: false,
    };
  }

  if (request.operationKind === "create_note" || request.operationKind === "attach_summary") {
    const text = noteText(request);
    if (!text) {
      return { actionId: request.actionId, status: "failed", message: "Missing note text for this action.", retryable: false };
    }
    await amoCrmRequest(companyId, `/leads/${request.leadId}/notes`, {
      method: "POST",
      body: JSON.stringify([{ note_type: "common", params: { text } }]),
    });
    return { actionId: request.actionId, status: "applied", message: "Note added to the amoCRM lead.", retryable: false };
  }

  if (request.operationKind === "create_task") {
    await amoCrmRequest(companyId, "/tasks", {
      method: "POST",
      body: JSON.stringify([{
        text: request.title,
        complete_till: taskDueAt(request),
        entity_id: Number(request.leadId),
        entity_type: "leads",
      }]),
    });
    return { actionId: request.actionId, status: "applied", message: "Task created on the amoCRM lead.", retryable: false };
  }

  const newTag = tagValue(request);
  const names = [...context.existingTags];
  if (!names.some((name) => name.toLowerCase() === newTag.toLowerCase())) names.push(newTag);
  await amoCrmRequest(companyId, `/leads/${request.leadId}`, {
    method: "PATCH",
    body: JSON.stringify({ _embedded: { tags: names.map((name) => ({ name })) } }),
  });
  return { actionId: request.actionId, status: "applied", message: "Tag added on the amoCRM lead.", retryable: false };
}
