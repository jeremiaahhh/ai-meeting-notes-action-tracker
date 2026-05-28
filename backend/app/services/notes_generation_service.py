from __future__ import annotations

from app.core.errors import ValidationFailure
from app.core.logging import get_logger
from app.models.action_item import ActionItem
from app.models.meeting import Meeting, MeetingStatus
from app.models.meeting_notes import MeetingNotes
from app.repositories.action_item_repository import ActionItemRepository
from app.repositories.meeting_repository import MeetingRepository
from app.schemas.notes import GeneratedNotes
from app.services.llm_service import LLMService

log = get_logger(__name__)


class NotesGenerationService:
    """Orchestrates AI note generation, persistence, and status transitions."""

    def __init__(
        self,
        meeting_repo: MeetingRepository,
        action_item_repo: ActionItemRepository,
        llm: LLMService,
    ) -> None:
        self._meetings = meeting_repo
        self._actions = action_item_repo
        self._llm = llm

    def generate(self, meeting_id: str, *, transcript_override: str | None = None) -> Meeting:
        meeting = self._meetings.get(meeting_id)
        if not meeting:
            from app.core.errors import NotFoundError

            raise NotFoundError(f"Meeting {meeting_id} not found")

        transcript = transcript_override if transcript_override is not None else meeting.transcript
        if not transcript or not transcript.strip():
            raise ValidationFailure("Cannot generate notes for an empty transcript")

        if transcript_override is not None:
            meeting.transcript = transcript_override

        meeting.status = MeetingStatus.PROCESSING
        meeting.error_message = None

        try:
            generated = self._llm.generate_notes(transcript)
        except Exception as exc:  # noqa: BLE001
            meeting.status = MeetingStatus.FAILED
            meeting.error_message = str(exc)
            log.error("notes.generation_failed", meeting_id=meeting.id, error=str(exc))
            raise

        self._upsert_notes(meeting, generated)
        self._replace_action_items(meeting, generated)
        meeting.status = MeetingStatus.READY

        log.info(
            "notes.generated",
            meeting_id=meeting.id,
            actions=len(meeting.action_items),
            decisions=len(meeting.notes.key_decisions) if meeting.notes else 0,
            mock=self._llm.mock_mode,
        )
        return meeting

    def _upsert_notes(self, meeting: Meeting, generated: GeneratedNotes) -> None:
        notes = meeting.notes
        if notes is None:
            notes = MeetingNotes(meeting_id=meeting.id)
            meeting.notes = notes
        notes.executive_summary = generated.executive_summary
        notes.key_decisions = list(generated.key_decisions)
        notes.unresolved_questions = list(generated.unresolved_questions)
        notes.suggested_follow_up = generated.suggested_follow_up
        notes.confidence = generated.confidence
        notes.used_mock = self._llm.mock_mode
        notes.model_name = self._llm.model_name

    def _replace_action_items(self, meeting: Meeting, generated: GeneratedNotes) -> None:
        # Drop existing items so each generation produces a fresh, in-sync list.
        # ORM cascade deletes the rows when we clear the relationship.
        meeting.action_items.clear()
        for idx, draft in enumerate(generated.action_items):
            meeting.action_items.append(
                ActionItem(
                    meeting_id=meeting.id,
                    position=idx,
                    description=draft.description,
                    owner=draft.owner,
                    due_date=draft.due_date,
                )
            )
