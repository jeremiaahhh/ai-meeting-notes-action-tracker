from app.services.mock_ai_service import generate_mock_notes


SAMPLE_TRANSCRIPT = """
Anna: Welcome everyone. Today we need to finalize the Q3 launch plan for the new
billing dashboard.
Marc: We decided to ship the new dashboard on July 15. Marketing will prepare
the launch post by Friday.
Anna: Action item: Marc will draft the launch announcement by next Monday.
Sam: We still don't know how we want to handle EU pricing for the enterprise tier.
Anna: We agreed to keep the legacy export endpoint until Q4.
Marc: Owner: Sam will investigate the EU pricing question and report back by Friday.
"""


def test_mock_notes_extracts_summary():
    result = generate_mock_notes(SAMPLE_TRANSCRIPT)
    assert result.executive_summary
    assert "Q3 launch" in result.executive_summary or "billing dashboard" in result.executive_summary


def test_mock_notes_extracts_decisions():
    result = generate_mock_notes(SAMPLE_TRANSCRIPT)
    joined = " ".join(result.key_decisions).lower()
    assert "ship" in joined or "legacy export" in joined
    assert result.key_decisions  # at least one decision


def test_mock_notes_extracts_action_items_with_owner_and_date():
    result = generate_mock_notes(SAMPLE_TRANSCRIPT)
    assert result.action_items
    # At least one item should have an extracted owner.
    assert any(item.owner for item in result.action_items)
    # At least one item should have an extracted due date.
    assert any(item.due_date for item in result.action_items)


def test_mock_notes_extracts_unresolved_questions():
    result = generate_mock_notes(SAMPLE_TRANSCRIPT)
    joined = " ".join(result.unresolved_questions).lower()
    assert "eu pricing" in joined


def test_mock_notes_handles_empty_transcript():
    result = generate_mock_notes("   ")
    assert result.action_items == []
    assert result.key_decisions == []
    assert result.confidence < 0.5


def test_mock_notes_confidence_within_bounds():
    result = generate_mock_notes(SAMPLE_TRANSCRIPT)
    assert 0.0 <= result.confidence <= 1.0
