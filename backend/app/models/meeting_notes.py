from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Float, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.meeting import Meeting


def _new_id() -> str:
    return str(uuid.uuid4())


class MeetingNotes(Base, TimestampMixin):
    __tablename__ = "meeting_notes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    meeting_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("meetings.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    executive_summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    key_decisions: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    unresolved_questions: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    suggested_follow_up: Mapped[str] = mapped_column(Text, default="", nullable=False)

    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    used_mock: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    model_name: Mapped[str] = mapped_column(String(80), default="mock", nullable=False)

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="notes")
