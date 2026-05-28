export type MeetingStatus = "draft" | "processing" | "ready" | "failed";
export type ActionItemStatus = "open" | "in_progress" | "completed";

export interface ActionItem {
  id: string;
  meeting_id: string;
  position: number;
  description: string;
  owner: string | null;
  due_date: string | null;
  status: ActionItemStatus;
  created_at: string;
  updated_at: string;
}

export interface MeetingNotes {
  id: string;
  meeting_id: string;
  executive_summary: string;
  key_decisions: string[];
  unresolved_questions: string[];
  suggested_follow_up: string;
  confidence: number;
  used_mock: boolean;
  model_name: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingSummary {
  id: string;
  title: string;
  participants: string | null;
  meeting_date: string | null;
  status: MeetingStatus;
  created_at: string;
  updated_at: string;
  action_item_count: number;
  open_action_item_count: number;
  has_notes: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  participants: string | null;
  meeting_date: string | null;
  transcript: string;
  status: MeetingStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  notes: MeetingNotes | null;
  action_items: ActionItem[];
}

export interface MarkdownExport {
  meeting_id: string;
  filename: string;
  markdown: string;
}

export interface HealthResponse {
  status: string;
  mock_mode: boolean;
  provider: string;
}
