from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.action_item_repository import ActionItemRepository
from app.repositories.meeting_repository import MeetingRepository
from app.schemas.meeting import (
    GenerateNotesRequest,
    MarkdownExport,
    MeetingCreate,
    MeetingRead,
    MeetingSummary,
    MeetingUpdate,
)
from app.services.llm_service import LLMService
from app.services.markdown_export_service import export_meeting
from app.services.meeting_service import MeetingService
from app.services.notes_generation_service import NotesGenerationService

router = APIRouter(prefix="/meetings", tags=["meetings"])


def _service(db: Session) -> MeetingService:
    return MeetingService(MeetingRepository(db))


def _notes_service(db: Session) -> NotesGenerationService:
    return NotesGenerationService(
        meeting_repo=MeetingRepository(db),
        action_item_repo=ActionItemRepository(db),
        llm=LLMService(),
    )


@router.post("", response_model=MeetingRead, status_code=status.HTTP_201_CREATED)
def create_meeting(payload: MeetingCreate, db: Session = Depends(get_db)) -> MeetingRead:
    service = _service(db)
    meeting = service.create(payload)
    db.commit()
    db.refresh(meeting)
    return MeetingRead.model_validate(meeting)


@router.get("", response_model=list[MeetingSummary])
def list_meetings(
    search: str | None = Query(default=None, max_length=200),
    db: Session = Depends(get_db),
) -> list[MeetingSummary]:
    return _service(db).list_summaries(search=search)


@router.get("/{meeting_id}", response_model=MeetingRead)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)) -> MeetingRead:
    meeting = _service(db).get(meeting_id)
    return MeetingRead.model_validate(meeting)


@router.patch("/{meeting_id}", response_model=MeetingRead)
def update_meeting(
    meeting_id: str, payload: MeetingUpdate, db: Session = Depends(get_db)
) -> MeetingRead:
    meeting = _service(db).update(meeting_id, payload)
    db.commit()
    db.refresh(meeting)
    return MeetingRead.model_validate(meeting)


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(meeting_id: str, db: Session = Depends(get_db)) -> Response:
    _service(db).delete(meeting_id)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{meeting_id}/generate-notes", response_model=MeetingRead)
def generate_notes(
    meeting_id: str,
    payload: GenerateNotesRequest | None = None,
    db: Session = Depends(get_db),
) -> MeetingRead:
    transcript_override = payload.transcript if payload else None
    meeting = _notes_service(db).generate(meeting_id, transcript_override=transcript_override)
    db.commit()
    db.refresh(meeting)
    return MeetingRead.model_validate(meeting)


@router.get("/{meeting_id}/export", response_model=MarkdownExport)
def export_notes(meeting_id: str, db: Session = Depends(get_db)) -> MarkdownExport:
    meeting = _service(db).get(meeting_id)
    return export_meeting(meeting)
