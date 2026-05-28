from __future__ import annotations

import uuid
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import action_items, health, meetings
from app.core.config import get_settings
from app.core.errors import register_error_handlers
from app.core.logging import configure_logging, get_logger
from app.db.base import Base
from app.db.session import engine

# Models are imported here so Base.metadata.create_all sees every table.
from app.models import ActionItem, Meeting, MeetingNotes  # noqa: F401


log = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    log.info("app.startup", mock_mode=get_settings().mock_mode)
    yield
    log.info("app.shutdown")


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(
        title="Meeting Notes & Action Tracker",
        version="1.0.0",
        description=(
            "Transforms meeting transcripts into structured summaries, decisions, "
            "action items, and unresolved questions."
        ),
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_error_handlers(app)

    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        structlog.contextvars.bind_contextvars(request_id=request_id, path=request.url.path)
        try:
            response = await call_next(request)
        finally:
            structlog.contextvars.clear_contextvars()
        response.headers["x-request-id"] = request_id
        return response

    app.include_router(health.router)
    app.include_router(meetings.router)
    app.include_router(action_items.router)

    return app


app = create_app()
