"""Deterministic mock provider used when no provider key is configured.

The mock is more than a placeholder — it actually parses the transcript so
that demos look credible. It looks for decision/action/question cues and
extracts owners + due dates with light regex. The whole product is testable
with this alone.
"""

from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Iterable

from app.schemas.notes import ActionItemDraft, GeneratedNotes


_DECISION_CUES = (
    r"\bwe (?:will|are going to|decided to|agreed to|will be)\b",
    r"\bdecision[: ]",
    r"\bagreed (?:that|to)\b",
    r"\bgoing with\b",
    r"\bwe[''']?ll\b",
)

_ACTION_CUES = (
    r"\b(?:action(?: item)?|todo|to-do|task|follow up|follow-up|next step)[: ]",
    r"\b(?:will|to)\s+(?:send|email|prepare|draft|schedule|book|share|review|update|investigate|build|ship|deploy|set up|set-up|put together|put-together)\b",
    r"\bowner[: ]",
    r"\bassigned to\b",
    r"\b(?:by|due) (?:next |this )?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month|friday|eod|tomorrow)\b",
)

_QUESTION_CUES = (
    r"\?$",
    r"\bopen question\b",
    r"\bunresolved\b",
    r"\bwe (?:still )?(?:don[''']?t|do not) know\b",
    r"\bnot sure (?:if|whether|how|what)\b",
    r"\bneeds? (?:more )?(?:research|investigation|input|discussion)\b",
)

_DAY_OFFSETS = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}


def _sentences(transcript: str) -> list[str]:
    cleaned = transcript.strip()
    if not cleaned:
        return []
    parts = re.split(r"(?<=[\.!\?])\s+(?=[A-Z0-9])", cleaned)
    return [p.strip() for p in parts if p.strip()]


def _matches_any(text: str, patterns: Iterable[str]) -> bool:
    lower = text.lower()
    return any(re.search(p, lower) for p in patterns)


def _strip_speaker(sentence: str) -> tuple[str, str | None]:
    """Pull a leading ``Name:`` speaker label off a line, if present."""

    m = re.match(r"^\s*([A-Z][A-Za-z\.\- ]{1,40}):\s*(.*)$", sentence)
    if not m:
        return sentence, None
    return m.group(2).strip(), m.group(1).strip()


def _next_weekday(reference: datetime, weekday: int) -> datetime:
    days_ahead = (weekday - reference.weekday()) % 7
    if days_ahead == 0:
        days_ahead = 7
    return reference + timedelta(days=days_ahead)


def _extract_due_date(sentence: str, now: datetime) -> datetime | None:
    lower = sentence.lower()

    if re.search(r"\beod\b|\bend of (?:day|today)\b", lower):
        return now.replace(hour=17, minute=0, second=0, microsecond=0)
    if "tomorrow" in lower:
        return (now + timedelta(days=1)).replace(hour=17, minute=0, second=0, microsecond=0)
    if "end of week" in lower or "eow" in lower:
        return _next_weekday(now, _DAY_OFFSETS["friday"]).replace(hour=17, minute=0, second=0, microsecond=0)
    if "next week" in lower:
        return _next_weekday(now, _DAY_OFFSETS["monday"]).replace(hour=17, minute=0, second=0, microsecond=0)
    if "end of month" in lower or "eom" in lower:
        return (now + timedelta(days=30)).replace(hour=17, minute=0, second=0, microsecond=0)

    for name, offset in _DAY_OFFSETS.items():
        if re.search(rf"\b(?:by |on |this |next )?{name}\b", lower):
            return _next_weekday(now, offset).replace(hour=17, minute=0, second=0, microsecond=0)

    return None


def _extract_owner(sentence: str, fallback: str | None) -> str | None:
    m = re.search(r"\bowner[: ]\s*([A-Z][A-Za-z\.\- ]{1,40})\b", sentence)
    if m:
        return m.group(1).strip().rstrip(".")
    m = re.search(r"\bassigned to ([A-Z][A-Za-z\.\- ]{1,40})\b", sentence)
    if m:
        return m.group(1).strip().rstrip(".")
    return fallback


def _shorten(text: str, max_len: int = 220) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= max_len:
        return text
    return text[: max_len - 1].rstrip() + "…"


def _dedupe(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for v in values:
        key = v.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(v)
    return out


def generate_mock_notes(transcript: str) -> GeneratedNotes:
    now = datetime.now(timezone.utc)
    sentences = _sentences(transcript)

    if not sentences:
        return GeneratedNotes(
            executive_summary="Transcript was empty. No notes could be generated.",
            confidence=0.1,
        )

    decisions: list[str] = []
    actions: list[ActionItemDraft] = []
    questions: list[str] = []

    for raw in sentences:
        clean, speaker = _strip_speaker(raw)
        if not clean:
            continue

        is_action = _matches_any(clean, _ACTION_CUES)
        is_decision = _matches_any(clean, _DECISION_CUES)
        is_question = _matches_any(clean, _QUESTION_CUES)

        if is_question:
            questions.append(_shorten(clean))

        if is_action:
            actions.append(
                ActionItemDraft(
                    description=_shorten(clean, 240),
                    owner=_extract_owner(clean, speaker),
                    due_date=_extract_due_date(clean, now),
                )
            )
        elif is_decision:
            decisions.append(_shorten(clean))

    decisions = _dedupe(decisions)[:8]
    questions = _dedupe(questions)[:8]
    actions = list({a.description: a for a in actions}.values())[:12]

    summary_source = sentences[: min(3, len(sentences))]
    executive_summary = _shorten(" ".join(summary_source), 600)

    follow_up_parts = []
    if actions:
        follow_up_parts.append(
            f"Confirm owners and dates for the {len(actions)} action item(s)."
        )
    if questions:
        follow_up_parts.append(
            f"Resolve the {len(questions)} open question(s) before the next sync."
        )
    if not follow_up_parts:
        follow_up_parts.append("Schedule a brief follow-up to confirm next steps.")
    suggested_follow_up = " ".join(follow_up_parts)

    signal = (len(decisions) * 0.12) + (len(actions) * 0.1) + (len(questions) * 0.05)
    confidence = max(0.4, min(0.9, 0.45 + signal))

    return GeneratedNotes(
        executive_summary=executive_summary or "Discussion summary unavailable.",
        key_decisions=decisions,
        action_items=actions,
        unresolved_questions=questions,
        suggested_follow_up=suggested_follow_up,
        confidence=round(confidence, 2),
    )
