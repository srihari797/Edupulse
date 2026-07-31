from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func
from app.core.database import Base

class ParentProfile(Base):
    """
    SQLAlchemy model representing a Parent Profile.
    """
    __tablename__ = "parent_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    phone = Column(String(20), nullable=True)
    address = Column(String(200), nullable=True)

    # Common audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(Integer, nullable=True)
    updated_by = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
