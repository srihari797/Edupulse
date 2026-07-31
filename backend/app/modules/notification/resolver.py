from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.modules.notification.repository import (
    NotificationRepository,
    MockNotificationRepository,
    RealNotificationRepository
)

# Shared mock repository instance to persist state during application runtime
_mock_repository_instance = MockNotificationRepository()

def get_notification_repository(db: AsyncSession) -> NotificationRepository:
    """
    ADSA Data Source Resolver for Notification Module.
    """
    mode = settings.get_resolved_mode("student.analytics")
    
    if mode == "REAL":
        return RealNotificationRepository(db)
    else:
        return _mock_repository_instance

