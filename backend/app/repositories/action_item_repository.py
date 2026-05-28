from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.action_item import ActionItem


class ActionItemRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, item_id: str) -> ActionItem | None:
        return self.db.execute(
            select(ActionItem).where(ActionItem.id == item_id)
        ).scalar_one_or_none()

    def list_for_meeting(self, meeting_id: str) -> list[ActionItem]:
        return list(
            self.db.execute(
                select(ActionItem)
                .where(ActionItem.meeting_id == meeting_id)
                .order_by(ActionItem.position)
            )
            .scalars()
            .all()
        )

    def add_all(self, items: list[ActionItem]) -> None:
        self.db.add_all(items)
        self.db.flush()

    def delete_for_meeting(self, meeting_id: str) -> None:
        for item in self.list_for_meeting(meeting_id):
            self.db.delete(item)
        self.db.flush()
