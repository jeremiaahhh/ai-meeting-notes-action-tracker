import type {
  ActionItem,
  ActionItemStatus,
  HealthResponse,
  MarkdownExport,
  Meeting,
  MeetingSummary,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(message: string, status: number, code = "api_error", details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? err.message : "Network error",
      0,
      "network_error",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json().catch(() => undefined)
    : await response.text();

  if (!response.ok) {
    const message =
      (body && typeof body === "object" && "error" in body
        ? (body as { error?: { message?: string } }).error?.message
        : undefined) || `Request failed with status ${response.status}`;
    const code =
      body && typeof body === "object" && "error" in body
        ? (body as { error?: { code?: string } }).error?.code ?? "api_error"
        : "api_error";
    throw new ApiError(message, response.status, code, body);
  }

  return body as T;
}

export const api = {
  health: () => request<HealthResponse>("/health"),

  listMeetings: (search?: string) =>
    request<MeetingSummary[]>(
      `/meetings${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    ),

  getMeeting: (id: string) => request<Meeting>(`/meetings/${id}`),

  createMeeting: (payload: {
    title: string;
    participants?: string | null;
    meeting_date?: string | null;
    transcript?: string;
  }) =>
    request<Meeting>("/meetings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateMeeting: (
    id: string,
    payload: Partial<{ title: string; participants: string | null; transcript: string }>,
  ) =>
    request<Meeting>(`/meetings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteMeeting: (id: string) =>
    request<void>(`/meetings/${id}`, { method: "DELETE" }),

  generateNotes: (id: string, transcript?: string) =>
    request<Meeting>(`/meetings/${id}/generate-notes`, {
      method: "POST",
      body: JSON.stringify(transcript ? { transcript } : {}),
    }),

  exportMarkdown: (id: string) =>
    request<MarkdownExport>(`/meetings/${id}/export`),

  updateActionItem: (
    id: string,
    payload: Partial<{ status: ActionItemStatus; description: string; owner: string | null }>,
  ) =>
    request<ActionItem>(`/action-items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

export type { ActionItem, Meeting, MeetingSummary };
