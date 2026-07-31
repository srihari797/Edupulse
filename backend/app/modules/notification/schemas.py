from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.modules.student.schemas import APIResponse

class NotificationDTO(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    notification_type: str
    is_read: bool
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

# Pagination response wrapper matching 06_API_Contract_ai_and_others.md
class NotificationListDTO(BaseModel):
    items: List[NotificationDTO]
    page: int
    size: int
    total: int
    total_pages: int

class NotificationListResponse(APIResponse):
    data: NotificationListDTO

class NotificationResponse(APIResponse):
    data: NotificationDTO
