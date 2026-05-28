from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.meeting import MeetingStatus
from app.schemas.action_item import ActionItemRead
from app.schemas.notes import MeetingNotesRead


class MeetingCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    participants: str | None = Field(default=None, max_length=500)
    meeting_date: datetime | None = None
    transcript: str = Field(default="", max_length=200_000)


class MeetingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    participants: str | None = Field(default=None, max_length=500)
    meeting_date: datetime | None = None
    transcript: str | None = Field(default=None, max_length=200_000)


class MeetingSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    participants: str | None
    meeting_date: datetime | None
    status: MeetingStatus
    created_at: datetime
    updated_at: datetime
    action_item_count: int = 0
    open_action_item_count: int = 0
    has_notes: bool = False


class MeetingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    participants: str | None
    meeting_date: datetime | None
    transcript: str
    status: MeetingStatus
    error_message: str | None
    created_at: datetime
    updated_at: datetime
    notes: MeetingNotesRead | None = None
    action_items: list[ActionItemRead] = Field(default_factory=list)


class GenerateNotesRequest(BaseModel):
    transcript: str | None = Field(
        default=None,
        description="Optional override transcript. If omitted, the stored transcript is used.",
        max_length=200_000,
    )


class MarkdownExport(BaseModel):
    meeting_id: str
    filename: str
    markdown: str
