from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.action_item import ActionItemStatus


class ActionItemBase(BaseModel):
    description: str = Field(..., min_length=1, max_length=2000)
    owner: str | None = Field(default=None, max_length=120)
    due_date: datetime | None = None


class ActionItemRead(ActionItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    meeting_id: str
    position: int
    status: ActionItemStatus
    created_at: datetime
    updated_at: datetime


class ActionItemUpdate(BaseModel):
    description: str | None = Field(default=None, min_length=1, max_length=2000)
    owner: str | None = Field(default=None, max_length=120)
    due_date: datetime | None = None
    status: ActionItemStatus | None = None
