from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy import select, func
from app.modules.notification.models import Notification

class NotificationRepository(ABC):
    """
    Interface for Notification Repository.
    """
    @abstractmethod
    async def get_notifications_by_user_id(self, user_id: int, page: int, size: int) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def mark_as_read(self, user_id: int, notification_id: int) -> Optional[Dict[str, Any]]:
        pass

class MockNotificationRepository(NotificationRepository):
    """
    Mock implementation of NotificationRepository.
    """
    def __init__(self):
        self.mock_notifications = [
            {
                "id": 1,
                "user_id": 1, # Student
                "title": "New Assignment Published",
                "content": "Math Homework 4 has been published. Due in 5 days.",
                "notification_type": "Assignment",
                "is_read": False,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "is_active": True
            },
            {
                "id": 2,
                "user_id": 1, # Student
                "title": "AI Study Insight",
                "content": "Spend 15 mins reviewing 'Quadratic Equations' today to boost your mastery.",
                "notification_type": "AI Insight",
                "is_read": False,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "is_active": True
            },
            {
                "id": 3,
                "user_id": 2, # Parent
                "title": "Bus Boarded",
                "content": "Your child has boarded bus BUS-2026-X.",
                "notification_type": "Reminder",
                "is_read": False,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "is_active": True
            }
        ]

    async def get_notifications_by_user_id(self, user_id: int, page: int, size: int) -> Dict[str, Any]:
        filtered = [n for n in self.mock_notifications if n["user_id"] == user_id]
        total = len(filtered)
        start = (page - 1) * size
        end = start + size
        items = filtered[start:end]
        total_pages = (total + size - 1) // size if size > 0 else 1
        return {
            "items": items,
            "page": page,
            "size": size,
            "total": total,
            "total_pages": total_pages
        }

    async def mark_as_read(self, user_id: int, notification_id: int) -> Optional[Dict[str, Any]]:
        for n in self.mock_notifications:
            if n["id"] == notification_id and n["user_id"] == user_id:
                n["is_read"] = True
                n["updated_at"] = datetime.now()
                return n
        return None

class RealNotificationRepository(NotificationRepository):
    """
    SQLAlchemy-based database repository for Notification module.
    """
    def __init__(self, db_session):
        self.db = db_session

    async def get_notifications_by_user_id(self, user_id: int, page: int, size: int) -> Dict[str, Any]:
        # Fetch total count
        count_stmt = select(func.count(Notification.id)).where(Notification.user_id == user_id)
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar_one()

        # If zero notifications exist for user, seed defaults
        if total == 0:
            defaults = [
                Notification(
                    user_id=user_id,
                    title="Welcome to EduPulse System",
                    content="Your EduPulse active session and role profile have been initialized.",
                    notification_type="General",
                    is_read=False,
                    is_active=True
                ),
                Notification(
                    user_id=user_id,
                    title="AI Intelligence Engine Active",
                    content="Adaptive Data Source Architecture & AI Radar monitoring enabled.",
                    notification_type="AI Insight",
                    is_read=False,
                    is_active=True
                ),
                Notification(
                    user_id=user_id,
                    title="Academic Calendar Reminder",
                    content="Check the latest timetable slots and institutional event dates.",
                    notification_type="Reminder",
                    is_read=False,
                    is_active=True
                ),
            ]
            self.db.add_all(defaults)
            await self.db.commit()

        # Fetch paginated items
        stmt = select(Notification).where(
            Notification.user_id == user_id
        ).order_by(
            Notification.created_at.desc()
        ).offset((page - 1) * size).limit(size)
        
        result = await self.db.execute(stmt)
        items = result.scalars().all()

        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar_one()
        total_pages = (total + size - 1) // size if size > 0 else 1

        return {
            "items": [
                {
                    "id": item.id,
                    "user_id": item.user_id,
                    "title": item.title,
                    "content": item.content,
                    "notification_type": item.notification_type,
                    "is_read": item.is_read,
                    "created_at": str(item.created_at),
                    "is_active": item.is_active
                }
                for item in items
            ],
            "page": page,
            "size": size,
            "total": total,
            "total_pages": total_pages
        }

    async def mark_as_read(self, user_id: int, notification_id: int) -> Optional[Dict[str, Any]]:
        stmt = select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id
        )
        result = await self.db.execute(stmt)
        notification = result.scalar_one_or_none()
        if not notification:
            return None
        notification.is_read = True
        await self.db.commit()
        await self.db.refresh(notification)
        return {
            "id": notification.id,
            "user_id": notification.user_id,
            "title": notification.title,
            "content": notification.content,
            "notification_type": notification.notification_type,
            "is_read": notification.is_read,
            "created_at": notification.created_at,
            "is_active": notification.is_active
        }
