from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func
from app.core.database import Base

class Notification(Base):
    """
    SQLAlchemy model representing an In-App Notification.
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    content = Column(String(500), nullable=False)
    notification_type = Column(String(50), default="General", nullable=False) # e.g. Assignment, AI Insight, Shared Goal, Achievement, Reminder, General
    is_read = Column(Boolean, default=False, nullable=False)

    # Common audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
