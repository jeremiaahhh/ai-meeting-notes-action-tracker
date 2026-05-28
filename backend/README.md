# Backend — FastAPI service

Layered FastAPI app for the AI Meeting Notes & Action Tracker.
See the [root README](../README.md) and [`docs/architecture.md`](../docs/architecture.md)
for the full picture.

## Local development

```bash
cp .env.example .env
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Interactive OpenAPI: http://localhost:8000/docs

## Tests

```bash
pytest -q
```

Uses SQLite — no Postgres, no API keys required.

## Layers

```
app/
  api/routes/      → thin HTTP adapters
  core/            → config, logging, errors
  db/              → engine + session
  models/          → SQLAlchemy ORM
  repositories/    → DB access
  schemas/         → Pydantic
  services/        → business logic + AI provider orchestration
  main.py          → FastAPI app factory
tests/
```
