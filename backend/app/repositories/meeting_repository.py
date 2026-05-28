from __future__ import annotations

from sqlalchemy import desc, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.meeting import Meeting


class MeetingRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, meeting: Meeting) -> Meeting:
        self.db.add(meeting)
        self.db.flush()
        return meeting

    def get(self, meeting_id: str) -> Meeting | None:
        stmt = (
            select(Meeting)
            .where(Meeting.id == meeting_id)
            .options(selectinload(Meeting.notes), selectinload(Meeting.action_items))
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list(self, *, search: str | None = None, limit: int = 100) -> list[Meeting]:
        stmt = (
            select(Meeting)
            .options(selectinload(Meeting.notes), selectinload(Meeting.action_items))
            .order_by(desc(Meeting.created_at))
            .limit(limit)
        )
        if search:
            pattern = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    Meeting.title.ilike(pattern),
                    Meeting.participants.ilike(pattern),
                    Meeting.transcript.ilike(pattern),
                )
            )
        return list(self.db.execute(stmt).scalars().all())

    def delete(self, meeting: Meeting) -> None:
        self.db.delete(meeting)
        self.db.flush()
