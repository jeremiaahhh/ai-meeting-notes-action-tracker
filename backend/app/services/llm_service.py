"""Provider-abstracted notes generator.

The public surface is intentionally small: a single ``generate_notes`` call
that returns a validated :class:`GeneratedNotes`. Provider details (OpenAI,
Anthropic, or mock) are picked from settings and never leak to callers.
"""

from __future__ import annotations

import json
from typing import Protocol

from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.core.errors import AIProviderError
from app.core.logging import get_logger
from app.schemas.notes import GeneratedNotes
from app.services.mock_ai_service import generate_mock_notes

log = get_logger(__name__)


_SYSTEM_PROMPT = (
    "You are an expert meeting analyst. Given a raw transcript, extract a "
    "structured set of notes. Always respond with a single JSON object that "
    "matches this schema exactly:\n"
    "{\n"
    '  "executive_summary": string (2-4 sentences),\n'
    '  "key_decisions": string[] (concise, action-oriented),\n'
    '  "action_items": [{"description": string, "owner": string|null, "due_date": ISO-8601 string|null}],\n'
    '  "unresolved_questions": string[],\n'
    '  "suggested_follow_up": string,\n'
    '  "confidence": number between 0 and 1\n'
    "}\n"
    "Be conservative: only include decisions and action items that are explicit "
    "in the transcript. Do not invent owners or dates."
)


def _user_prompt(transcript: str) -> str:
    return (
        "Transcript:\n----------------\n"
        f"{transcript.strip()}\n"
        "----------------\n"
        "Return JSON only — no prose, no code fences."
    )


class _Provider(Protocol):
    name: str

    def generate(self, transcript: str) -> GeneratedNotes: ...


class OpenAIProvider:
    name = "openai"

    def __init__(self, settings: Settings) -> None:
        from openai import OpenAI  # local import keeps module lightweight in mock mode

        self._client = OpenAI(api_key=settings.openai_api_key)
        self._model = settings.openai_model

    def generate(self, transcript: str) -> GeneratedNotes:
        response = self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": _user_prompt(transcript)},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        return _parse_payload(response.choices[0].message.content or "{}")


class AnthropicProvider:
    name = "anthropic"

    def __init__(self, settings: Settings) -> None:
        import anthropic

        self._client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self._model = settings.anthropic_model

    def generate(self, transcript: str) -> GeneratedNotes:
        message = self._client.messages.create(
            model=self._model,
            max_tokens=2000,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": _user_prompt(transcript)}],
        )
        text = "".join(block.text for block in message.content if getattr(block, "type", "") == "text")
        return _parse_payload(text or "{}")


def _parse_payload(raw: str) -> GeneratedNotes:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise AIProviderError("Model returned invalid JSON", details={"raw": raw[:500]}) from exc
    try:
        return GeneratedNotes(**data)
    except ValidationError as exc:
        raise AIProviderError("Model output failed schema validation", details={"errors": exc.errors()}) from exc


class LLMService:
    """High-level entrypoint used by other services."""

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()

    @property
    def mock_mode(self) -> bool:
        return self._settings.mock_mode

    @property
    def model_name(self) -> str:
        if self.mock_mode:
            return "mock"
        if self._settings.ai_provider == "anthropic":
            return self._settings.anthropic_model
        return self._settings.openai_model

    def generate_notes(self, transcript: str) -> GeneratedNotes:
        if not transcript.strip():
            return GeneratedNotes(
                executive_summary="Transcript was empty.",
                confidence=0.0,
            )

        if self.mock_mode:
            log.info("llm.generate", provider="mock")
            return generate_mock_notes(transcript)

        provider: _Provider
        try:
            if self._settings.ai_provider == "anthropic":
                provider = AnthropicProvider(self._settings)
            else:
                provider = OpenAIProvider(self._settings)
        except Exception as exc:  # noqa: BLE001 - we want a clean error for any init failure
            raise AIProviderError(
                "Failed to initialise AI provider",
                details={"provider": self._settings.ai_provider, "error": str(exc)},
            ) from exc

        log.info("llm.generate", provider=provider.name, model=self.model_name)
        try:
            return provider.generate(transcript)
        except AIProviderError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise AIProviderError(
                "AI provider call failed",
                details={"provider": provider.name, "error": str(exc)},
            ) from exc
