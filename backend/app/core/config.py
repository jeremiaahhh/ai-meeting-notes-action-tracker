from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = Field(
        default="sqlite:///./meeting_notes.db",
        alias="DATABASE_URL",
    )

    use_mock_ai: bool = Field(default=True, alias="USE_MOCK_AI")
    ai_provider: str = Field(default="openai", alias="AI_PROVIDER")
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")
    anthropic_api_key: str = Field(default="", alias="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(default="claude-sonnet-4-6", alias="ANTHROPIC_MODEL")

    cors_origins_raw: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.cors_origins_raw.split(",") if o.strip()]

    @property
    def mock_mode(self) -> bool:
        """Effective mock mode: forced via USE_MOCK_AI, or no provider key configured."""
        if self.use_mock_ai:
            return True
        if self.ai_provider == "openai" and not self.openai_api_key:
            return True
        if self.ai_provider == "anthropic" and not self.anthropic_api_key:
            return True
        return False


@lru_cache
def get_settings() -> Settings:
    return Settings()
