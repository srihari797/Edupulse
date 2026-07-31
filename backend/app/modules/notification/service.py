from typing import Optional, Dict, Any
from app.modules.notification.repository import NotificationRepository

class NotificationService:
    """
    Business Service Layer for Notification Module.
    """
    def __init__(self, repository: NotificationRepository):
        self.repository = repository

    async def get_notifications(self, user_id: int, page: int, size: int) -> Dict[str, Any]:
        return await self.repository.get_notifications_by_user_id(user_id, page, size)

    async def mark_as_read(self, user_id: int, notification_id: int) -> Optional[Dict[str, Any]]:
        return await self.repository.mark_as_read(user_id, notification_id)
