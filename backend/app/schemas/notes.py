from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ActionItemDraft(BaseModel):
    """Action items as produced by the LLM, before persistence."""

    description: str = Field(..., min_length=1)
    owner: str | None = None
    due_date: datetime | None = None


class GeneratedNotes(BaseModel):
    """Structured payload returned by the AI notes generator."""

    executive_summary: str = Field(default="")
    key_decisions: list[str] = Field(default_factory=list)
    action_items: list[ActionItemDraft] = Field(default_factory=list)
    unresolved_questions: list[str] = Field(default_factory=list)
    suggested_follow_up: str = Field(default="")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class MeetingNotesRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    meeting_id: str
    executive_summary: str
    key_decisions: list[str]
    unresolved_questions: list[str]
    suggested_follow_up: str
    confidence: float
    used_mock: bool
    model_name: str
    created_at: datetime
    updated_at: datetime
