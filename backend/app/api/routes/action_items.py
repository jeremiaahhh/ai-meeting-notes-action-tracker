from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.action_item_repository import ActionItemRepository
from app.schemas.action_item import ActionItemRead, ActionItemUpdate
from app.services.action_item_service import ActionItemService

router = APIRouter(prefix="/action-items", tags=["action-items"])


def _service(db: Session) -> ActionItemService:
    return ActionItemService(ActionItemRepository(db))


@router.patch("/{item_id}", response_model=ActionItemRead)
def update_action_item(
    item_id: str, payload: ActionItemUpdate, db: Session = Depends(get_db)
) -> ActionItemRead:
    item = _service(db).update(item_id, payload)
    db.commit()
    db.refresh(item)
    return ActionItemRead.model_validate(item)
