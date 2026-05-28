from datetime import datetime, timezone

from app.models.action_item import ActionItem, ActionItemStatus
from app.models.meeting import Meeting, MeetingStatus
from app.models.meeting_notes import MeetingNotes
from app.services.markdown_export_service import export_meeting


def _build_meeting() -> Meeting:
    meeting = Meeting(
        id="m1",
        title="Roadmap Sync",
        participants="Anna, Marc",
        meeting_date=datetime(2026, 1, 15, 14, 0, tzinfo=timezone.utc),
        transcript="Anna: hello.",
        status=MeetingStatus.READY,
    )
    meeting.notes = MeetingNotes(
        id="n1",
        meeting_id="m1",
        executive_summary="We aligned on Q3 launch.",
        key_decisions=["Ship on July 15", "Keep legacy export until Q4"],
        unresolved_questions=["How to handle EU pricing?"],
        suggested_follow_up="Confirm owners next sync.",
        confidence=0.82,
        used_mock=True,
        model_name="mock",
    )
    meeting.action_items = [
        ActionItem(
            id="a1",
            meeting_id="m1",
            position=0,
            description="Draft launch announcement",
            owner="Marc",
            due_date=datetime(2026, 1, 20, 17, 0, tzinfo=timezone.utc),
            status=ActionItemStatus.OPEN,
        ),
        ActionItem(
            id="a2",
            meeting_id="m1",
            position=1,
            description="Investigate EU pricing",
            owner=None,
            due_date=None,
            status=ActionItemStatus.COMPLETED,
        ),
    ]
    return meeting


def test_markdown_export_contains_all_sections():
    export = export_meeting(_build_meeting())
    assert export.filename == "roadmap-sync.md"
    md = export.markdown
    for header in [
        "# Roadmap Sync",
        "## Executive Summary",
        "## Key Decisions",
        "## Action Items",
        "## Unresolved Questions",
        "## Suggested Follow-up",
    ]:
        assert header in md
    assert "- [x] Investigate EU pricing" in md
    assert "- [ ] Draft launch announcement" in md
    assert "**Marc**" in md
    assert "82%" in md


def test_markdown_export_without_notes():
    meeting = Meeting(
        id="m2",
        title="Empty Meeting",
        participants=None,
        meeting_date=None,
        transcript="",
        status=MeetingStatus.DRAFT,
    )
    meeting.notes = None
    meeting.action_items = []
    md = export_meeting(meeting).markdown
    assert "_Notes have not been generated yet._" in md
