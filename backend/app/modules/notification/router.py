from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.notification.resolver import get_notification_repository
from app.modules.notification.service import NotificationService
from app.modules.notification.schemas import (
    NotificationListResponse,
    NotificationListDTO,
    NotificationResponse,
    NotificationDTO
)

from app.auth.router import get_current_user
from app.auth.schemas import UserDTO

router = APIRouter(prefix="/notifications", tags=["notification"])

def get_notification_service(
    db: AsyncSession = Depends(get_db)
) -> NotificationService:
    repository = get_notification_repository(db)
    return NotificationService(repository)

@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    current_user: UserDTO = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service)
):
    """
    Retrieve in-app notifications for the authenticated user (paginated).
    """
    data = await service.get_notifications(current_user.id, page, size)
    dto = NotificationListDTO(**data)
    return NotificationListResponse(
        success=True,
        message="Notifications retrieved successfully.",
        data=dto
    )

@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read(
    notification_id: int,
    current_user: UserDTO = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service)
):
    """
    Mark an in-app notification as read.
    """
    notification = await service.mark_as_read(current_user.id, notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found."
        )
    dto = NotificationDTO(**notification)
    return NotificationResponse(
        success=True,
        message="Notification marked as read.",
        data=dto
    )

