from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Date, func
from app.core.database import Base

class GrowthPassport(Base):
    """
    SQLAlchemy model representing a Student's Holistic Growth Passport.
    """
    __tablename__ = "growth_passports"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    holistic_score = Column(Float, default=0.0, nullable=False)
    growth_level = Column(String(50), default="Beginner", nullable=False)

    # Common audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

class Achievement(Base):
    """
    SQLAlchemy model representing extracurricular or academic achievements/appreciation records.
    """
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    category = Column(String(50), nullable=False)  # e.g., Academic, Sports, Arts, Leadership, Competition, Certification
    date_earned = Column(Date, nullable=False)
    badge_name = Column(String(50), nullable=True)

    # Common audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

class Activity(Base):
    """
    SQLAlchemy model representing extracurricular participation records.
    """
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    activity_type = Column(String(50), nullable=False)  # e.g., Sports, Art, Club, Leadership, Volunteer
    hours_spent = Column(Float, default=0.0, nullable=False)

    # Common audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
