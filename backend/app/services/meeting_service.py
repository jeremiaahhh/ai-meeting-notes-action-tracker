from __future__ import annotations

from app.core.errors import NotFoundError
from app.core.logging import get_logger
from app.models.action_item import ActionItemStatus
from app.models.meeting import Meeting
from app.repositories.meeting_repository import MeetingRepository
from app.schemas.meeting import MeetingCreate, MeetingSummary, MeetingUpdate

log = get_logger(__name__)


class MeetingService:
    def __init__(self, repo: MeetingRepository) -> None:
        self._repo = repo

    def create(self, payload: MeetingCreate) -> Meeting:
        meeting = Meeting(
            title=payload.title.strip(),
            participants=payload.participants.strip() if payload.participants else None,
            meeting_date=payload.meeting_date,
            transcript=payload.transcript or "",
        )
        self._repo.create(meeting)
        log.info("meeting.created", id=meeting.id, title=meeting.title)
        return meeting

    def get(self, meeting_id: str) -> Meeting:
        meeting = self._repo.get(meeting_id)
        if not meeting:
            raise NotFoundError(f"Meeting {meeting_id} not found")
        return meeting

    def update(self, meeting_id: str, payload: MeetingUpdate) -> Meeting:
        meeting = self.get(meeting_id)
        data = payload.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(meeting, key, value)
        log.info("meeting.updated", id=meeting.id, fields=list(data))
        return meeting

    def delete(self, meeting_id: str) -> None:
        meeting = self.get(meeting_id)
        self._repo.delete(meeting)
        log.info("meeting.deleted", id=meeting_id)

    def list_summaries(self, *, search: str | None = None) -> list[MeetingSummary]:
        meetings = self._repo.list(search=search)
        summaries: list[MeetingSummary] = []
        for m in meetings:
            open_count = sum(
                1 for ai in m.action_items if ai.status != ActionItemStatus.COMPLETED
            )
            summaries.append(
                MeetingSummary(
                    id=m.id,
                    title=m.title,
                    participants=m.participants,
                    meeting_date=m.meeting_date,
                    status=m.status,
                    created_at=m.created_at,
                    updated_at=m.updated_at,
                    action_item_count=len(m.action_items),
                    open_action_item_count=open_count,
                    has_notes=m.notes is not None,
                )
            )
        return summaries
