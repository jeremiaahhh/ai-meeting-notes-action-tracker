from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.action_item import ActionItem
    from app.models.meeting_notes import MeetingNotes


class MeetingStatus(str, enum.Enum):
    DRAFT = "draft"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


def _new_id() -> str:
    return str(uuid.uuid4())


class Meeting(Base, TimestampMixin):
    __tablename__ = "meetings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    participants: Mapped[str | None] = mapped_column(String(500))
    meeting_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    transcript: Mapped[str] = mapped_column(Text, default="", nullable=False)
    status: Mapped[MeetingStatus] = mapped_column(
        Enum(MeetingStatus, native_enum=False, length=20),
        default=MeetingStatus.DRAFT,
        nullable=False,
    )
    error_message: Mapped[str | None] = mapped_column(Text)

    notes: Mapped["MeetingNotes | None"] = relationship(
        "MeetingNotes",
        back_populates="meeting",
        uselist=False,
        cascade="all, delete-orphan",
    )
    action_items: Mapped[list["ActionItem"]] = relationship(
        "ActionItem",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="ActionItem.position",
    )
