from __future__ import annotations

from app.core.errors import NotFoundError
from app.core.logging import get_logger
from app.models.action_item import ActionItem
from app.repositories.action_item_repository import ActionItemRepository
from app.schemas.action_item import ActionItemUpdate

log = get_logger(__name__)


class ActionItemService:
    def __init__(self, repo: ActionItemRepository) -> None:
        self._repo = repo

    def get(self, item_id: str) -> ActionItem:
        item = self._repo.get(item_id)
        if not item:
            raise NotFoundError(f"Action item {item_id} not found")
        return item

    def update(self, item_id: str, payload: ActionItemUpdate) -> ActionItem:
        item = self.get(item_id)
        data = payload.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(item, key, value)
        log.info("action_item.updated", id=item.id, fields=list(data))
        return item
