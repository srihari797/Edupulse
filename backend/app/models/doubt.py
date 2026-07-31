from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, func
from app.core.database import Base

class Doubt(Base):
    """
    SQLAlchemy model for Student-Teacher Academic Doubts & Q/A interaction.
    """
    __tablename__ = "doubts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("teacher_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=True)
    status = Column(String(50), default="Pending", nullable=False) # Pending, Answered, Resolved
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
